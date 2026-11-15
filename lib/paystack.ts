import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { site } from "./site";

/**
 * Paystack client: https://paystack.com/docs/api/transaction/
 *
 * Card / bank / USSD checkout: we open a hosted Paystack page for the order's outstanding amount.
 * Nothing is trusted from the browser redirect or the webhook body alone: every payment is re-read
 * with GET /transaction/verify/:reference using our secret key before an order is marked paid.
 *
 * Without PAYSTACK_SECRET_KEY outside production, a mock mode "pays" instantly for local testing.
 */

const BASE = "https://api.paystack.co";

export const paystackMock = !process.env.PAYSTACK_SECRET_KEY && process.env.NODE_ENV !== "production";

export function paystackEnabled() {
  return paystackMock || Boolean(process.env.PAYSTACK_SECRET_KEY);
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  const res = await fetch(BASE + path, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const json = (await res.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T };
  if (!res.ok || json.status === false || !json.data) throw new Error(json.message ?? `Paystack request failed (${res.status})`);
  return json.data;
}

/** Paystack references must be unique per attempt, so each attempt gets a fresh suffix. */
export const newReference = (orderId: string) => `${orderId}-${randomBytes(4).toString("hex")}`;

export async function initializeTransaction(input: {
  reference: string;
  email: string;
  amountKobo: number;
  callbackUrl: string;
  orderId: string;
}): Promise<{ authorizationUrl: string }> {
  if (paystackMock) {
    mockTx.set(input.reference, input.amountKobo);
    return { authorizationUrl: `${input.callbackUrl}?reference=${encodeURIComponent(input.reference)}` };
  }
  const data = await call<{ authorization_url: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      currency: "NGN",
      reference: input.reference,
      callback_url: input.callbackUrl,
      // `site` tells a shared webhook receiver which storefront owns this payment.
      metadata: { site: site.key, order_id: input.orderId, cancel_action: input.callbackUrl },
    }),
  });
  return { authorizationUrl: data.authorization_url };
}

export type PaystackTx = {
  reference: string;
  status: string; // "success" | "failed" | "abandoned" | "ongoing" | "pending" | "reversed" ...
  amount: number; // kobo
  currency: string;
  paidAt?: string;
  channel?: string;
};

const g = globalThis as unknown as { __psMock?: Map<string, number> };
const mockTx = (g.__psMock ??= new Map());

/** The authoritative state of a transaction, read from Paystack with our secret key. */
export async function verifyTransaction(reference: string): Promise<PaystackTx> {
  if (paystackMock) {
    const amount = mockTx.get(reference);
    return amount
      ? { reference, status: "success", amount, currency: "NGN", paidAt: new Date().toISOString(), channel: "card" }
      : { reference, status: "abandoned", amount: 0, currency: "NGN" };
  }
  const d = await call<{ reference: string; status: string; amount: number; currency: string; paid_at?: string; channel?: string }>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
  return { reference: d.reference, status: d.status, amount: d.amount, currency: d.currency, paidAt: d.paid_at, channel: d.channel };
}

/** Paystack signs the raw webhook body with HMAC-SHA512 using the secret key, in x-paystack-signature. */
export function verifyPaystackSignature(rawBody: string, signature: string | null) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
