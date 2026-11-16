import { NextResponse, type NextRequest } from "next/server";
import { CryptoError, getOrder, publicOrder, startCryptoPayment, tokenMatches } from "@/lib/orders";

export const runtime = "nodejs";

/** Start (or refresh) a crypto payment for an unpaid order. Body: { token, chainId, address, refundTo }. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { token?: string; chainId?: number; address?: string; refundTo?: string };
  const order = await getOrder(id);
  if (!order || !tokenMatches(order, body.token ?? null)) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  try {
    const updated = await startCryptoPayment(id, { chainId: Number(body.chainId), address: String(body.address ?? "") }, String(body.refundTo ?? ""));
    return NextResponse.json(publicOrder(updated));
  } catch (err) {
    if (err instanceof CryptoError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("[crypto] quote failed", err);
    return NextResponse.json({ error: "We couldn't create a crypto payment address just now. Try another network or pay by bank transfer." }, { status: 502 });
  }
}
