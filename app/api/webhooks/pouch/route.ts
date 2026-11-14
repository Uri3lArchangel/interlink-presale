import { NextResponse, type NextRequest } from "next/server";
import { handleCreditWebhook } from "@/lib/orders";
import { verifyWebhookSignature } from "@/lib/pouch";

export const runtime = "nodejs";

/**
 * Pouch webhook endpoint. Register https://<your-domain>/api/webhooks/pouch as the
 * webhook URL in your Pouch integrator settings.
 *
 * Webhooks can arrive late, twice, or out of order, so handling is idempotent:
 * each credit is keyed by its transfer id and re-verified against the Pouch API.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = verifyWebhookSignature(raw, req.headers.get("x-liquifia-signature"));
  if (signature === "invalid") {
    console.warn("[webhook] rejected: bad X-Liquifia-Signature");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: { event?: string; data?: Record<string, unknown> };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (payload.event !== "virtual_account.credited") {
    return NextResponse.json({ received: true, ignored: payload.event ?? null });
  }

  try {
    const data = payload.data ?? {};
    const result = await handleCreditWebhook({
      id: typeof data.id === "string" ? data.id : undefined,
      virtual_account_id: typeof data.virtual_account_id === "string" ? data.virtual_account_id : undefined,
    });
    if (!result.ok) console.warn("[webhook] credit not applied:", result.reason, data.id);
    // 200 either way for unverifiable credits: a retry wouldn't change the answer.
    return NextResponse.json({ received: true, ...result });
  } catch (err) {
    console.error("[webhook] processing failed", err);
    // 5xx so Pouch retries once its API is reachable again.
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
