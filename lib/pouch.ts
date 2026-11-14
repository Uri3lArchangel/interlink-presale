import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

/**
 * Client for the Pouch (Liquifia) fiat API: https://fiat-api.pouchfinance.xyz/llms.txt
 *
 * Collection works by bank transfer: each order gets its own virtual NUBAN account,
 * the customer transfers the exact total into it, and Pouch notifies us with a
 * `virtual_account.credited` webhook. We never trust the webhook body on its own:
 * every credit is re-checked against the API with our secret key before an order is marked paid.
 *
 * With no POUCH_SECRET_KEY outside production, a mock mode issues fake accounts so the
 * whole flow can be tested locally (see app/api/dev/simulate-payment).
 */

const BASE = (process.env.POUCH_API_URL ?? "https://fiat-api.pouchfinance.xyz").replace(/\/$/, "") + "/api/v1";

export const pouchMock = !process.env.POUCH_SECRET_KEY && process.env.NODE_ENV !== "production";

export type VirtualAccount = {
  id: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  funding_limit?: number;
  status: string;
};

export type InboundCredit = {
  id: string;
  virtual_account_id?: string;
  credited_account?: string;
  amount: number; // kobo
  payer_name?: string;
  payer_bank?: string;
  received_at?: string;
};

class PouchError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

async function call<T>(path: string, init: RequestInit & { idempotencyKey?: string } = {}): Promise<T> {
  const key = process.env.POUCH_SECRET_KEY;
  if (!key) throw new PouchError("POUCH_SECRET_KEY is not set", 500);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
  };
  if (init.body) headers["Content-Type"] = "application/json";
  if (init.idempotencyKey) headers["X-Idempotency-Key"] = init.idempotencyKey;
  const res = await fetch(BASE + path, { ...init, headers, cache: "no-store", signal: AbortSignal.timeout(20_000) });
  const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: T; error?: string; code?: string };
  if (!res.ok || json.success === false) {
    throw new PouchError(json.error ?? `Pouch request failed (${res.status})`, res.status, json.code);
  }
  return json.data as T;
}

/** Create the payer as a Pouch customer and open a virtual account capped at the order total. */
export async function openCollectionAccount(input: {
  reference: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  amountKobo: number;
}): Promise<{ customerId: string; account: VirtualAccount }> {
  if (pouchMock) {
    return {
      customerId: `mock_cus_${input.reference}`,
      account: {
        id: `mock_va_${input.reference}`,
        account_number: String(Math.floor(1e9 + Math.random() * 9e9)),
        account_name: `Interlink / ${input.firstName} ${input.lastName}`,
        bank_name: "Paga (test mode)",
        funding_limit: input.amountKobo,
        status: "active",
      },
    };
  }
  const customer = await call<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify({
      customer_reference: input.reference,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      ...(input.phone ? { phone_number: input.phone } : {}),
    }),
  });
  const account = await call<VirtualAccount>(`/customers/${customer.id}/virtual-accounts`, {
    method: "POST",
    idempotencyKey: randomUUID(),
    body: JSON.stringify({
      country: "NG",
      currency: "NGN",
      // Pouch rejects transfers above this, which stops accidental overpayment.
      funding_limit: input.amountKobo,
      settlement_mode: "held",
    }),
  });
  return { customerId: customer.id, account };
}

/** Look up one received transfer by transfer id, reference or NIBSS session id. Null if Pouch has no record of it. */
export async function traceInboundTransfer(identifier: string): Promise<InboundCredit | null> {
  if (pouchMock) return mockCredits.get(identifier) ?? null;
  const data = await call<{
    found: boolean;
    status?: string;
    amount?: number;
    reference?: string;
    transaction_id?: string;
    credited_account?: string;
    payer_name?: string;
    payer_bank?: string;
    received_at?: string;
  }>(`/inbound-transfers/${encodeURIComponent(identifier)}/trace`);
  if (!data.found || data.status !== "success" || typeof data.amount !== "number") return null;
  return {
    id: identifier,
    credited_account: data.credited_account,
    amount: data.amount,
    payer_name: data.payer_name,
    payer_bank: data.payer_bank,
    received_at: data.received_at,
  };
}

/** Recent credits on one virtual account, used when a webhook is late or never arrives. */
export async function listCreditsFor(virtualAccountId: string, pages = 3): Promise<InboundCredit[]> {
  if (pouchMock) return [...mockCredits.values()].filter((c) => c.virtual_account_id === virtualAccountId);
  const found: InboundCredit[] = [];
  for (let page = 0; page < pages; page++) {
    const data = await call<
      { id: string; virtual_account_id: string; amount: number; payer_name?: string; payer_bank_name?: string; created_at: string }[]
    >(`/inbound-transfers?skip=${page * 100}&take=100&currency=NGN`);
    for (const t of data) {
      if (t.virtual_account_id === virtualAccountId) {
        found.push({
          id: t.id,
          virtual_account_id: t.virtual_account_id,
          amount: t.amount,
          payer_name: t.payer_name,
          payer_bank: t.payer_bank_name,
          received_at: t.created_at,
        });
      }
    }
    if (data.length < 100) break;
  }
  return found;
}

/**
 * Pouch sends `X-Liquifia-Signature` but its docs don't publish the algorithm yet.
 * We accept an HMAC-SHA256 or HMAC-SHA512 of the raw body (hex or base64, optional `sha256=`/`sha512=` prefix)
 * when POUCH_WEBHOOK_SECRET is set. This is a first filter only: payment state is decided by
 * re-reading the credit from the API, so a forged webhook can never mark an order paid.
 */
export function verifyWebhookSignature(rawBody: string, header: string | null): "valid" | "invalid" | "skipped" {
  const secret = process.env.POUCH_WEBHOOK_SECRET;
  if (!secret) return "skipped";
  if (!header) return "invalid";
  const given = header.replace(/^sha(256|512)=/i, "").trim();
  // Pouch hasn't published its scheme; accept HMAC-SHA256 or HMAC-SHA512 of the raw body, hex or base64.
  for (const algo of ["sha256", "sha512"] as const) {
    const mac = createHmac(algo, secret).update(rawBody, "utf8").digest();
    for (const expected of [mac.toString("hex"), mac.toString("base64")]) {
      const a = Buffer.from(given);
      const b = Buffer.from(expected);
      if (a.length === b.length && timingSafeEqual(a, b)) return "valid";
    }
  }
  return "invalid";
}

// ---- mock mode (local development only) ----
const globalForMock = globalThis as unknown as { __pouchMockCredits?: Map<string, InboundCredit> };
const mockCredits = (globalForMock.__pouchMockCredits ??= new Map());

export function recordMockCredit(credit: InboundCredit) {
  if (!pouchMock) throw new Error("Mock credits are only available without POUCH_SECRET_KEY outside production");
  mockCredits.set(credit.id, credit);
}

export { PouchError };
