import { NextResponse, type NextRequest } from "next/server";
import { handlePaystackWebhook } from "@/lib/orders";
import { verifyPaystackSignature } from "@/lib/paystack";

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
  let payload: { event?: string; data?: { reference?: string } };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  try {
    const result = await handlePaystackWebhook(payload.event, payload.data?.reference);
    return NextResponse.json({ received: true, ...result });
  } catch (err) {
    console.error("[paystack] webhook processing failed", err);
    // A 500 makes Paystack retry later.
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
