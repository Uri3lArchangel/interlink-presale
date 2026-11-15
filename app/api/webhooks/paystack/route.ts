import { NextResponse, type NextRequest } from "next/server";
import { handlePaystackWebhook } from "@/lib/orders";
import { verifyPaystackSignature } from "@/lib/paystack";
import { site } from "@/lib/site";
import { forwardWebhook } from "@/lib/webhook-forward";

export const runtime = "nodejs";

/**
 * Paystack webhook. Set https://<your-domain>/api/webhooks/paystack as the Live Webhook URL in
 * Paystack Settings > API Keys & Webhooks. The x-paystack-signature header (HMAC-SHA512 of the raw
 * body with PAYSTACK_SECRET_KEY) is checked, then the transaction is re-verified with the API.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifyPaystackSignature(raw, req.headers.get("x-paystack-signature"))) {
    console.warn("[paystack] rejected webhook: bad or missing signature");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  let payload: { event?: string; data?: { reference?: string; metadata?: unknown } };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  // Payments we start carry metadata.site. If it names the sister storefront, hand the event over untouched.
  const owner = siteFromMetadata(payload.data?.metadata);
  if (owner && owner !== site.key) {
    const forwarded = await forwardWebhook(req, "paystack", raw, `metadata.site=${owner}`);
    if (forwarded) return forwarded;
    return NextResponse.json({ received: true, ignored: "belongs to another site" });
  }
  try {
    const result = await handlePaystackWebhook(payload.event, payload.data?.reference);
    if (result.reason === "not an order reference" && !owner) {
      const forwarded = await forwardWebhook(req, "paystack", raw, "unknown reference");
      if (forwarded) return forwarded;
    }
    return NextResponse.json({ received: true, ...result });
  } catch (err) {
    console.error("[paystack] webhook processing failed", err);
    // A 500 makes Paystack retry later.
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}

/** Paystack sends metadata back as an object, or as a JSON string on some integrations. */
function siteFromMetadata(meta: unknown): string | null {
  if (typeof meta === "string") {
    try {
      meta = JSON.parse(meta);
    } catch {
      return null;
    }
  }
  const s = (meta as { site?: unknown } | null)?.site;
  return typeof s === "string" ? s : null;
}
