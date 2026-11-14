import "server-only";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { MAX_QTY, productById } from "./catalog";
import { transactionFee } from "./pricing";
import { kv, withLock } from "./store";
import { listCreditsFor, openCollectionAccount, traceInboundTransfer, type InboundCredit } from "./pouch";
import { sendOrderConfirmation } from "./email";
import { assetByKey, looksLikeAddress } from "./crypto-assets";
import { createQuote, cryptoEnabled, ngnPerUsd, quoteStatus } from "./dextopus";
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
  subtotalKobo?: number; // hardware only (absent on orders placed before the fee existed)
  feeKobo?: number; // transaction fee
  totalKobo: number; // what the customer must transfer
  paidKobo: number;
  credits: { id: string; amount: number; payer?: string; at?: string }[];
  account: { id: string; number: string; name: string; bank: string };
  pouchCustomerId: string;
  consent: { termsVersion: string; acceptedAt: string; ip?: string; userAgent?: string };
  estimatedDispatch: string;
  confirmationEmailAt?: string;
  lastReconciledAt?: number;
  /** Latest crypto quote, if the customer chose to pay in crypto. */
  crypto?: {
    requestId: string;
    assetKey: string;
    depositAddress: string;
    amountIn: string; // smallest unit of the chosen token
    usdcOut: string; // smallest unit of USDC (6 dp) we receive
    ngnPerUsd: number;
    refundTo: string;
    createdAt: string;
    expiresAt?: string;
    state: "waiting" | "processing" | "completed" | "failed" | "refunded";
    originTxHash?: string;
  };
};

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L
function orderNumber() {
  const bytes = randomBytes(8);
  const chars = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
  return `IL-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

const orderKey = (id: string) => `order:${id}`;
const accountKey = (vaId: string) => `va:${vaId}`;
const cryptoKey = (requestId: string) => `dx:${requestId}`;

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
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const fee = transactionFee(subtotal);
  const subtotalKobo = subtotal * 100;
  const feeKobo = fee * 100;
  const totalKobo = subtotalKobo + feeKobo;

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
    subtotalKobo,
    feeKobo,
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
    if (order.crypto && order.crypto.state !== "completed" && order.crypto.state !== "refunded") {
      const after = await reconcileCrypto(order.id);
      if (after?.status === "paid") return after;
    }
    const credits = await listCreditsFor(order.account.id);
    return (await applyCredits(order.id, credits)) ?? order;
  } catch (err) {
    console.error(`[orders] reconcile ${order.id} failed`, err);
    return order;
  }
}

export class CryptoError extends Error {}

/**
 * Create (or replace) a crypto quote for an unpaid order. The naira total is converted to USDC at the
 * business-set rate, and Dextopus works out exactly how much of the customer's token to send.
 */
export async function startCryptoPayment(orderId: string, assetKey: string, refundTo: string) {
  if (!cryptoEnabled()) throw new CryptoError("Crypto payments aren't available right now.");
  const asset = assetByKey(assetKey);
  if (!asset) throw new CryptoError("Choose a supported coin and network.");
  refundTo = refundTo.trim();
  if (!looksLikeAddress(asset.vm, refundTo)) {
    throw new CryptoError(`That doesn't look like a ${asset.network} wallet address. Check it and try again.`);
  }
  const rate = ngnPerUsd()!;
  const result = await withLock(orderId, async () => {
    const order = await getOrder(orderId);
    if (!order) throw new CryptoError("Order not found.");
    if (order.status !== "awaiting_payment" || order.paidKobo > 0) {
      throw new CryptoError("This order already has a payment. Contact support to pay the rest in crypto.");
    }
    if (isExpired(order)) throw new CryptoError("This reservation has lapsed. Please start a new order.");
    if (order.crypto && (order.crypto.state === "processing" || order.crypto.state === "completed")) {
      throw new CryptoError("A crypto payment for this order is already being processed.");
    }
    // naira (kobo) -> USDC smallest unit (6 dp), rounded up so we never receive less than the total.
    // USDC units = naira / rate * 1e6 = kobo * 1e4 / rate. Rate is scaled by 100 to keep it an integer.
    const rate100 = BigInt(Math.round(rate * 100));
    const usdcOut = (BigInt(order.totalKobo) * 1_000_000n + rate100 - 1n) / rate100;
    const quote = await createQuote({ asset, usdcOut, refundTo, orderId: order.id });
    order.crypto = {
      requestId: quote.requestId,
      assetKey: asset.key,
      depositAddress: quote.depositAddress,
      amountIn: quote.amountIn,
      usdcOut: quote.usdcOut,
      ngnPerUsd: rate,
      refundTo,
      createdAt: new Date().toISOString(),
      expiresAt: quote.expiresAt,
      state: "waiting",
    };
    await kv().set(orderKey(order.id), order);
    await kv().set(cryptoKey(quote.requestId), order.id);
    await kv().set(`dxaddr:${quote.depositAddress.toLowerCase()}`, order.id);
    return order;
  });
  if (!result) throw new CryptoError("We're busy updating this order. Try again in a moment.");
  return result;
}

/** Re-read the crypto payment status from Dextopus and settle the order if it has completed. */
export async function reconcileCrypto(orderId: string): Promise<Order | null> {
  const order = await getOrder(orderId);
  if (!order?.crypto || order.crypto.state === "completed" || order.crypto.state === "refunded") return order;
  const status = await quoteStatus(order.crypto.requestId);
  if (status.state !== "completed" && status.state === order.crypto.state) return order;
  if (status.state === "completed") {
    // Strict quotes only complete for the exact amount, so a completed quote covers the order total.
    const credit = {
      id: order.crypto.requestId,
      amount: order.totalKobo - order.paidKobo,
      payer_name: `Crypto (${assetByKey(order.crypto.assetKey)?.symbol ?? "stablecoin"})`,
      received_at: new Date().toISOString(),
    };
    const updated = await withLock(orderId, async () => {
      const o = await getOrder(orderId);
      if (!o?.crypto) return o;
      o.crypto.state = "completed";
      o.crypto.originTxHash = status.originTxHash ?? o.crypto.originTxHash;
      await kv().set(orderKey(o.id), o);
      return o;
    });
    return (await applyCredits(orderId, [credit])) ?? updated ?? order;
  }
  return withLock(orderId, async () => {
    const o = await getOrder(orderId);
    if (!o?.crypto) return o;
    o.crypto.state = status.state;
    o.crypto.originTxHash = status.originTxHash ?? o.crypto.originTxHash;
    await kv().set(orderKey(o.id), o);
    return o;
  });
}

/** A Dextopus webhook only names the request; the status is re-read from the API before anything changes. */
export async function handleCryptoWebhook(requestId?: string, depositAddress?: string) {
  let orderId = requestId ? await kv().get<string>(cryptoKey(requestId)) : null;
  if (!orderId && depositAddress) {
    // Fall back to matching the deposit address if the webhook's id format differs from the quote's.
    orderId = await kv().get<string>(`dxaddr:${depositAddress.toLowerCase()}`);
  }
  if (!orderId) return { ok: true, reason: "not an order quote" as const };
  const order = await reconcileCrypto(orderId);
  return { ok: true, status: order?.status };
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
    subtotalKobo: order.subtotalKobo ?? order.totalKobo,
    feeKobo: order.feeKobo ?? 0,
    totalKobo: order.totalKobo,
    paidKobo: order.paidKobo,
    account: { number: order.account.number, name: order.account.name, bank: order.account.bank },
    estimatedDispatch: order.estimatedDispatch,
    cryptoEnabled: cryptoEnabled(),
    crypto: order.crypto
      ? {
          assetKey: order.crypto.assetKey,
          depositAddress: order.crypto.depositAddress,
          amountIn: order.crypto.amountIn,
          usdcOut: order.crypto.usdcOut,
          ngnPerUsd: order.crypto.ngnPerUsd,
          refundTo: order.crypto.refundTo,
          expiresAt: order.crypto.expiresAt,
          state: order.crypto.state,
        }
      : null,
    expiresAt: new Date(Date.parse(order.createdAt) + site.presale.paymentWindowHours * 3600_000).toISOString(),
  };
}
export type PublicOrder = ReturnType<typeof publicOrder>;
