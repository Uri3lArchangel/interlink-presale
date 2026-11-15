import { NextResponse, type NextRequest } from "next/server";
import { PaystackError, getOrder, startPaystackPayment, tokenMatches } from "@/lib/orders";

export const runtime = "nodejs";

/** Start a Paystack checkout for an unpaid order. Body: { token }. Returns { url } to redirect to. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { token?: string };
  const order = await getOrder(id);
  if (!order || !tokenMatches(order, body.token ?? null)) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  try {
    const url = await startPaystackPayment(id);
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof PaystackError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("[paystack] initialize failed", err);
    return NextResponse.json({ error: "We couldn't open card payment just now. Try again, or pay by bank transfer." }, { status: 502 });
  }
}
