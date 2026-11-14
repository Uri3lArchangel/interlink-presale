import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { SETTLEMENT, type CryptoAsset } from "./crypto-assets";

/**
 * Client for the Dextopus deposit API: https://swap-api.dextopus.com/llms.txt
 *
 * Crypto checkout: for each order we ask for an exact-output, strict quote, so whatever the customer
 * sends on their chosen network settles as the exact USDC amount we need on Base, paid to
 * CRYPTO_SETTLEMENT_ADDRESS. Strict mode auto-refunds under- and over-payments to the customer.
 * Payment state is always read back from the API; webhooks only tell us when to look.
 *
 * Without DEXTOPUS_API_KEY outside production, a mock mode issues fake addresses for local testing.
 */

const BASE = (process.env.DEXTOPUS_API_URL ?? "https://swap-api.dextopus.com").replace(/\/$/, "") + "/api";

export const dextopusMock = !process.env.DEXTOPUS_API_KEY && process.env.NODE_ENV !== "production";

/** Crypto checkout is offered only when everything it needs is configured. */
export function cryptoEnabled() {
  if (dextopusMock) return true;
  return Boolean(process.env.DEXTOPUS_API_KEY && process.env.CRYPTO_SETTLEMENT_ADDRESS && ngnPerUsd());
}

/** Naira per US dollar used to price crypto payments. Set by the business, e.g. 1550. */
export function ngnPerUsd(): number | null {
  const v = Number(process.env.CRYPTO_NGN_PER_USD ?? (dextopusMock ? 1550 : NaN));
  return Number.isFinite(v) && v > 0 ? v : null;
}

export type CryptoQuote = {
  requestId: string;
  depositAddress: string;
  amountIn: string; // smallest unit of the customer's token
  usdcOut: string; // smallest unit of USDC we receive
  expiresAt?: string;
};

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = process.env.DEXTOPUS_API_KEY;
  if (!key) throw new Error("DEXTOPUS_API_KEY is not set");
  const res = await fetch(BASE + path, {
    ...init,
    headers: { "x-api-key": key, "Content-Type": "application/json", Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
  });
  const json = (await res.json().catch(() => ({}))) as T & { success?: boolean; error?: string; message?: string };
  if (!res.ok || json.success === false) throw new Error(json.message ?? json.error ?? `Dextopus request failed (${res.status})`);
  return json;
}

/** Quote an exact USDC amount on Base, paid with `asset`. Strict: only the exact amount is accepted. */
export async function createQuote(input: { asset: CryptoAsset; usdcOut: bigint; refundTo: string; orderId: string }): Promise<CryptoQuote> {
  if (dextopusMock) {
    const scale = 10n ** BigInt(input.asset.decimals - SETTLEMENT.decimals >= 0 ? input.asset.decimals - SETTLEMENT.decimals : 0);
    const amountIn = ((input.usdcOut * 1005n) / 1000n) * scale; // pretend 0.5% route fees
    return {
      requestId: `mock_req_${input.orderId}_${Date.now()}`,
      depositAddress: input.asset.vm === "evm" ? "0x" + "ab".repeat(20) : input.asset.vm === "svm" ? "MockSo1anaDeposit1111111111111111111111111" : "TMockTronDepositAddress11111111111",
      amountIn: amountIn.toString(),
      usdcOut: input.usdcOut.toString(),
      expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
    };
  }
  const recipient = process.env.CRYPTO_SETTLEMENT_ADDRESS!;
  const data = await call<{
    requestId: string;
    depositAddress: string;
    amountOut?: string;
    expiresAt?: string;
    reverseQuoteMetadata?: { calculatedAmountIn: string; actualAmountOut: string; accuracyBps: number };
  }>("/deposit/quote", {
    method: "POST",
    body: JSON.stringify({
      originChainId: input.asset.chainId,
      destinationChainId: SETTLEMENT.chainId,
      originAsset: input.asset.address,
      destinationAsset: SETTLEMENT.asset,
      amountOut: input.usdcOut.toString(),
      recipient,
      refundTo: input.refundTo,
      strict: true,
      // Dextopus expects the payer's wallet on the origin chain here, not our order id.
      user: input.refundTo,
      slippageBps: 50,
    }),
  });
  const meta = data.reverseQuoteMetadata;
  if (!meta?.calculatedAmountIn) throw new Error("Dextopus did not return an amount to send");
  // Never accept a route that would settle noticeably short of what the order needs.
  if (BigInt(meta.actualAmountOut ?? data.amountOut ?? "0") * 1000n < input.usdcOut * 995n) {
    throw new Error("Quote would settle short of the order total");
  }
  return {
    requestId: data.requestId,
    depositAddress: data.depositAddress,
    amountIn: meta.calculatedAmountIn,
    usdcOut: meta.actualAmountOut ?? input.usdcOut.toString(),
    expiresAt: data.expiresAt,
  };
}

export type CryptoStatus = { state: "waiting" | "processing" | "completed" | "failed" | "refunded"; originTxHash?: string };

const g = globalThis as unknown as { __dxMock?: Map<string, CryptoStatus> };
const mockStatus = (g.__dxMock ??= new Map());

export function setMockStatus(requestId: string, status: CryptoStatus) {
  if (!dextopusMock) throw new Error("Mock status is only available in local test mode");
  mockStatus.set(requestId, status);
}

/** Read the authoritative status of a deposit request. */
export async function quoteStatus(requestId: string): Promise<CryptoStatus> {
  if (dextopusMock) return mockStatus.get(requestId) ?? { state: "waiting" };
  const data = await call<{ status?: string; originTxHash?: string; progress?: { deposited?: boolean } }>(
    `/deposit/status?requestId=${encodeURIComponent(requestId)}`,
  );
  const s = (data.status ?? "").toLowerCase();
  const state: CryptoStatus["state"] =
    s === "completed" || s === "success" || s === "settled"
      ? "completed"
      : s.includes("refund")
        ? "refunded"
        : s === "failed" || s === "failure" || s === "expired"
          ? "failed"
          : data.progress?.deposited || s === "pending" || s === "processing"
            ? "processing"
            : "waiting";
  return { state, originTxHash: data.originTxHash };
}

/**
 * Dextopus signs `timestamp + "." + JSON body` with HMAC-SHA256 (hex), sent in X-Signature-SHA256
 * with X-Signature-Timestamp (ms). Rejects stale timestamps to stop replays.
 */
export function verifyDextopusSignature(rawBody: string, timestamp: string | null, signature: string | null) {
  const secret = process.env.DEXTOPUS_WEBHOOK_SECRET;
  if (!secret || !timestamp || !signature) return false;
  if (Math.abs(Date.now() - Number(timestamp)) > 10 * 60_000) return false;
  const candidates = [rawBody];
  try {
    candidates.push(JSON.stringify(JSON.parse(rawBody)));
  } catch {}
  return candidates.some((body) => {
    const expected = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}
