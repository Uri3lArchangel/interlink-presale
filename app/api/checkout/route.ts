import { NextResponse, type NextRequest } from "next/server";
import { CheckoutError, createOrder } from "@/lib/orders";
import { PouchError } from "@/lib/pouch";

export const runtime = "nodejs";

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const c = (body.customer ?? {}) as Record<string, unknown>;
  const a = (c.address ?? {}) as Record<string, unknown>;
  const customer = {
    firstName: str(c.firstName, 60),
    lastName: str(c.lastName, 60),
    email: str(c.email, 200).toLowerCase(),
    phone: str(c.phone, 20).replace(/[^\d+]/g, ""),
    address: {
      line1: str(a.line1),
      line2: str(a.line2) || undefined,
      city: str(a.city, 80),
      state: str(a.state, 80),
      postcode: str(a.postcode, 12) || undefined,
    },
  };
  const problems: string[] = [];
  if (!customer.firstName || !customer.lastName) problems.push("your full name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(customer.email)) problems.push("a valid email address");
  if (!/^\+?\d{10,15}$/.test(customer.phone)) problems.push("a valid phone number");
  if (!customer.address.line1 || !customer.address.city || !customer.address.state) problems.push("your delivery address");
  if (problems.length) {
    return NextResponse.json({ error: `Please provide ${problems.join(", ")}.` }, { status: 422 });
  }
  // Pouch expects international format.
  if (customer.phone.startsWith("0")) customer.phone = "+234" + customer.phone.slice(1);

  try {
    const order = await createOrder({
      items: Array.isArray(body.items) ? (body.items as { id: string; quantity: number }[]).slice(0, 50) : [],
      customer,
      acceptedTerms: body.acceptedTerms === true,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: req.headers.get("user-agent")?.slice(0, 300),
    });
    return NextResponse.json({ id: order.id, token: order.token });
  } catch (err) {
    if (err instanceof CheckoutError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("[checkout] failed", err);
    const message =
      err instanceof PouchError
        ? "We couldn't open a payment account just now. Please try again in a minute."
        : "Something went wrong creating your order. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
