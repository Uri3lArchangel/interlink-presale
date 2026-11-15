import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { site } from "./site";

/**
 * Shared-webhook routing between sister storefronts (Interlink and ArkPlay) that use the same
 * Pouch, Paystack and Dextopus accounts. Providers allow one webhook URL, so one site receives
 * everything and forwards events that aren't its own to WEBHOOK_FORWARD_URL (the other site's origin).
 *
 * The raw body and the provider's signature headers are passed through untouched, so the receiving
 * site verifies the provider's signature itself and re-checks the payment with the provider's API,
 * exactly as if the provider had called it directly. Nothing is trusted because it came from us.
 *
 * A hop header stops an event from bouncing back and forth if both sites ever have forwarding on.
 */

const HOP_HEADER = "x-presale-forwarded-by";
const PASS_THROUGH = ["content-type", "x-paystack-signature", "x-liquifia-signature", "x-signature-timestamp", "x-signature-sha256"];

export type Provider = "pouch" | "paystack" | "dextopus";

/** Where to forward foreign events, or null if this site handles only its own (or this is already a forwarded hop). */
export function forwardTarget(req: NextRequest): string | null {
  if (req.headers.get(HOP_HEADER)) return null;
  const base = process.env.WEBHOOK_FORWARD_URL?.trim().replace(/\/$/, "");
  return base || null;
}

/** Re-deliver a webhook to the sister site and relay its answer, so the provider retries if it failed. */
export async function forwardWebhook(req: NextRequest, provider: Provider, raw: string, why: string) {
  const base = forwardTarget(req);
  if (!base) return null;
  const headers: Record<string, string> = { [HOP_HEADER]: site.key };
  for (const h of PASS_THROUGH) {
    const v = req.headers.get(h);
    if (v) headers[h] = v;
  }
  try {
    const res = await fetch(`${base}/api/webhooks/${provider}`, {
      method: "POST",
      headers,
      body: raw,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    console.info(`[webhook] forwarded ${provider} event (${why}) to ${base}: ${res.status}`);
    return new NextResponse(text, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") ?? "application/json", "x-presale-routed-to": base },
    });
  } catch (err) {
    console.error(`[webhook] forwarding ${provider} event to ${base} failed`, err);
    // 502 so the provider retries later.
    return NextResponse.json({ error: "forward failed" }, { status: 502 });
  }
}
