import { NextResponse, type NextRequest } from "next/server";
import { handleCryptoWebhook } from "@/lib/orders";
import { verifyDextopusSignature } from "@/lib/dextopus";
import { forwardWebhook } from "@/lib/webhook-forward";

export const runtime = "nodejs";

/**
 * Dextopus webhook. Register https://<your-domain>/api/webhooks/dextopus in the Dextopus dashboard
 * (or POST /deposit/static/webhook) and store the returned secret as DEXTOPUS_WEBHOOK_SECRET.
 * The signature is checked, then the payment status is re-read from the Dextopus API.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifyDextopusSignature(raw, req.headers.get("x-signature-timestamp"), req.headers.get("x-signature-sha256"))) {
    console.warn("[dextopus] rejected webhook: bad or missing signature");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  let payload: { event?: string; data?: { requestId?: string; depositRequestId?: string; depositAddress?: string } };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  try {
    const d = payload.data ?? {};
    const result = await handleCryptoWebhook(d.requestId ?? d.depositRequestId, d.depositAddress);
    // Not one of our quotes: it may belong to the sister storefront sharing this Dextopus account.
    if (result.reason === "not an order quote") {
      const forwarded = await forwardWebhook(req, "dextopus", raw, "unknown quote");
      if (forwarded) return forwarded;
    }
    return NextResponse.json({ received: true, event: payload.event ?? null, ...result });
  } catch (err) {
    console.error("[dextopus] webhook processing failed", err);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
