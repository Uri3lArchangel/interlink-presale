import "server-only";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { MAX_QTY, productById } from "./catalog";
import { kv, withLock } from "./store";
import { listCreditsFor, openCollectionAccount, traceInboundTransfer, type InboundCredit } from "./pouch";
import { sendOrderConfirmation } from "./email";
import { site } from "./site";

export type OrderLine = { id: string; name: string; unitPrice: number; quantity: number; image: string };

export type OrderStatus = "awaiting_payment" | "part_paid" | "paid" | "expired";

export type Order = {
  id: string; // customer-facing order number, e.g. IL-7K3F-9Q2A
  token: string; // secret that lets the buyer view the order page
  status: OrderStatus;
  createdAt: string;
  paidAt?: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: { line1: string; line2?: string; city: string; state: string; postcode?: string };
  };
  lines: OrderLine[];
  totalKobo: number;
  paidKobo: number;
  credits: { id: string; amount: number; payer?: string; at?: string }[];
  account: { id: string; number: string; name: string; bank: string };
  pouchCustomerId: string;
  consent: { termsVersion: string; acceptedAt: string; ip?: string; userAgent?: string };
  estimatedDispatch: string;
  confirmationEmailAt?: string;
  lastReconciledAt?: number;
};

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L
function orderNumber() {
  const bytes = randomBytes(8);
  const chars = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
  return `IL-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

const orderKey = (id: string) => `order:${id}`;
const accountKey = (vaId: string) => `va:${vaId}`;

export type CheckoutInput = {
  items: { id: string; quantity: number }[];
  customer: Order["customer"];
  acceptedTerms: boolean;
  ip?: string;
  userAgent?: string;
};

export class CheckoutError extends Error {}

/** Price the cart on the server (never trust client prices), open a collection account and save the order. */
export async function createOrder(input: CheckoutInput): Promise<Order> {
  if (!input.acceptedTerms) throw new CheckoutError("Please accept the Terms of Sale to continue.");
  const merged = new Map<string, number>();
  for (const item of input.items) {
    const q = Math.floor(Number(item.quantity));
    if (!productById(item.id) || !Number.isFinite(q) || q < 1) continue;
    merged.set(item.id, Math.min(MAX_QTY, (merged.get(item.id) ?? 0) + q));
  }
  const lines: OrderLine[] = [...merged].map(([id, quantity]) => {
    const p = productById(id)!;
    return { id, name: p.name, unitPrice: p.price, quantity, image: p.image };
  });
  if (!lines.length) throw new CheckoutError("Your cart is empty.");
  const totalKobo = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0) * 100;

  let id = orderNumber();
  while (await kv().get(orderKey(id))) id = orderNumber();

  const { customerId, account } = await openCollectionAccount({
    reference: id,
    firstName: input.customer.firstName,
    lastName: input.customer.lastName,
    email: input.customer.email,
    phone: input.customer.phone,
    amountKobo: totalKobo,
  });

  const order: Order = {
    id,
    token: randomBytes(18).toString("base64url"),
    status: "awaiting_payment",
    createdAt: new Date().toISOString(),
    customer: input.customer,
    lines,
    totalKobo,
    paidKobo: 0,
    credits: [],
    account: { id: account.id, number: account.account_number, name: account.account_name, bank: account.bank_name },
    pouchCustomerId: customerId,
    consent: {
      termsVersion: site.termsVersion,
      acceptedAt: new Date().toISOString(),
      ip: input.ip,
      userAgent: input.userAgent,
    },
    estimatedDispatch: site.presale.estimatedDispatch,
  };
  await kv().set(orderKey(id), order);
  await kv().set(accountKey(account.id), id);
  return order;
}

export async function getOrder(id: string) {
  return kv().get<Order>(orderKey(id));
}

export function tokenMatches(order: Order, token: string | null) {
  if (!token) return false;
  const a = Buffer.from(order.token);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function orderIdForAccount(virtualAccountId: string) {
  return kv().get<string>(accountKey(virtualAccountId));
}

export function isExpired(order: Order) {
  return (
    order.status === "awaiting_payment" &&
    Date.now() - Date.parse(order.createdAt) > site.presale.paymentWindowHours * 3600_000
  );
}

/**
 * Apply verified credits to an order. Each credit counts once. When the total is covered,
 * the order becomes paid and the confirmation email goes out exactly once.
 */
async function applyCredits(orderId: string, credits: InboundCredit[]) {
  return withLock(orderId, async () => {
    const order = await getOrder(orderId);
    if (!order) return null;
    let changed = false;
    for (const c of credits) {
      if (order.credits.some((x) => x.id === c.id)) continue;
      order.credits.push({ id: c.id, amount: c.amount, payer: c.payer_name, at: c.received_at });
      order.paidKobo += c.amount;
      changed = true;
    }
    if (changed) {
      if (order.paidKobo >= order.totalKobo) {
        order.status = "paid";
        order.paidAt ??= new Date().toISOString();
      } else if (order.paidKobo > 0) {
        order.status = "part_paid";
      }
    }
    if (order.status === "paid" && !order.confirmationEmailAt) {
      try {
        await sendOrderConfirmation(order);
        order.confirmationEmailAt = new Date().toISOString();
        changed = true;
      } catch (err) {
        // Leave confirmationEmailAt unset so the next webhook or poll retries the email.
        console.error(`[orders] confirmation email for ${order.id} failed`, err);
      }
    }
    if (changed) await kv().set(orderKey(order.id), order);
    return order;
  });
}

/**
 * Handle one `virtual_account.credited` webhook. The body only tells us where to look:
 * the credit is re-read from Pouch with our secret key and must land on this order's account.
 */
export async function handleCreditWebhook(data: { id?: string; virtual_account_id?: string }) {
  if (!data.id || !data.virtual_account_id) return { ok: false, reason: "missing id" as const };
  const orderId = await orderIdForAccount(data.virtual_account_id);
  if (!orderId) return { ok: true, reason: "not an order account" as const };
  const order = await getOrder(orderId);
  if (!order) return { ok: true, reason: "order missing" as const };

  const credit = await traceInboundTransfer(data.id);
  if (!credit) return { ok: false, reason: "credit not found at Pouch" as const };
  const onThisAccount = credit.credited_account
    ? credit.credited_account === order.account.number
    : credit.virtual_account_id === order.account.id;
  if (!onThisAccount) return { ok: false, reason: "credit belongs to another account" as const };

  const updated = await applyCredits(orderId, [{ ...credit, id: data.id }]);
  return { ok: true, status: updated?.status };
}

/** Pull credits straight from Pouch, at most every 20 seconds per order. Covers missed or delayed webhooks. */
export async function reconcile(order: Order): Promise<Order> {
  if (order.status === "paid" && order.confirmationEmailAt) return order;
  if (order.lastReconciledAt && Date.now() - order.lastReconciledAt < 20_000) return order;
  order.lastReconciledAt = Date.now();
  await kv().set(orderKey(order.id), order);
  try {
    const credits = await listCreditsFor(order.account.id);
    return (await applyCredits(order.id, credits)) ?? order;
  } catch (err) {
    console.error(`[orders] reconcile ${order.id} failed`, err);
    return order;
  }
}

/** The subset of an order that is safe to send to the browser. */
export function publicOrder(order: Order) {
  return {
    id: order.id,
    status: isExpired(order) ? ("expired" as const) : order.status,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    firstName: order.customer.firstName,
    email: order.customer.email,
    lines: order.lines,
    totalKobo: order.totalKobo,
    paidKobo: order.paidKobo,
    account: { number: order.account.number, name: order.account.name, bank: order.account.bank },
    estimatedDispatch: order.estimatedDispatch,
    expiresAt: new Date(Date.parse(order.createdAt) + site.presale.paymentWindowHours * 3600_000).toISOString(),
  };
}
export type PublicOrder = ReturnType<typeof publicOrder>;
