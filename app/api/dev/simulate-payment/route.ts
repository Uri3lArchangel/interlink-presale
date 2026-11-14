import { NextResponse, type NextRequest } from "next/server";
import { getOrder, handleCreditWebhook, reconcileCrypto, tokenMatches } from "@/lib/orders";
import { dextopusMock, setMockStatus } from "@/lib/dextopus";
import { pouchMock, recordMockCredit } from "@/lib/pouch";

export const runtime = "nodejs";

/**
 * Local testing only: pretend the customer paid, then run the exact webhook path.
 * Disabled whenever a real POUCH_SECRET_KEY is set or in production.
 */
export async function POST(req: NextRequest) {
  if (!pouchMock) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { id, token, amountKobo, method } = (await req.json()) as { id: string; token: string; amountKobo?: number; method?: "crypto" };
  const order = await getOrder(id);
  if (!order || !tokenMatches(order, token)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (method === "crypto") {
    if (!dextopusMock || !order.crypto) return NextResponse.json({ error: "No mock crypto quote" }, { status: 400 });
    setMockStatus(order.crypto.requestId, { state: "completed", originTxHash: "0xmock" });
    const updated = await reconcileCrypto(order.id);
    return NextResponse.json({ ok: true, status: updated?.status });
  }
  const credit = {
    id: `mock_tx_${crypto.randomUUID().slice(0, 8)}`,
    virtual_account_id: order.account.id,
    credited_account: order.account.number,
    amount: amountKobo ?? order.totalKobo - order.paidKobo,
    payer_name: `${order.customer.firstName} ${order.customer.lastName}`.toUpperCase(),
    received_at: new Date().toISOString(),
  };
  recordMockCredit(credit);
  const result = await handleCreditWebhook({ id: credit.id, virtual_account_id: order.account.id });
  return NextResponse.json(result);
}
