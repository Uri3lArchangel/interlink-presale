import { NextResponse, type NextRequest } from "next/server";
import { getOrder, publicOrder, reconcile, tokenMatches } from "@/lib/orders";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/orders/[id]">) {
  const { id } = await ctx.params;
  const order = await getOrder(id);
  if (!order || !tokenMatches(order, req.nextUrl.searchParams.get("t"))) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  const fresh = await reconcile(order);
  return NextResponse.json(publicOrder(fresh), { headers: { "Cache-Control": "no-store" } });
}
