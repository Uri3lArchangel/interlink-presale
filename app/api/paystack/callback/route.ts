import { NextResponse, type NextRequest } from "next/server";
import { getOrder, orderIdForPaystack, settlePaystack } from "@/lib/orders";
import { site } from "@/lib/site";

export const runtime = "nodejs";

/**
 * Where Paystack sends the customer after checkout (?reference=...). The payment is verified with
 * Paystack before the order changes, then the customer lands back on their order page.
 */
export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference") ?? req.nextUrl.searchParams.get("trxref");
  if (!reference) return NextResponse.redirect(new URL("/", site.url));
  let order = null;
  try {
    order = await settlePaystack(reference);
  } catch (err) {
    console.error("[paystack] callback verify failed", err);
    // Paystack was unreachable: send them back to the order page, which keeps checking by itself.
    const orderId = await orderIdForPaystack(reference);
    order = orderId ? await getOrder(orderId) : null;
  }
  if (!order) return NextResponse.redirect(new URL("/", site.url));
  return NextResponse.redirect(new URL(`/order/${order.id}?t=${encodeURIComponent(order.token)}`, site.url));
}
