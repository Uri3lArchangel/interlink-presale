import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { sendOrderConfirmation } from "@/lib/email";
import { transactionFee } from "@/lib/pricing";
import { productById } from "@/lib/catalog";
import { site } from "@/lib/site";
import type { Order } from "@/lib/orders";

export const runtime = "nodejs";

/**
 * Admin only: send the real order-confirmation email for a dummy paid order, to check how it looks
 * and that the email provider works. Requires `Authorization: Bearer <ADMIN_TOKEN>`.
 * The subject is prefixed with "[Test]" so it can't be mistaken for a real receipt.
 */
export async function POST(req: NextRequest) {
  const token = process.env.ADMIN_TOKEN;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token || given.length !== token.length || !timingSafeEqual(Buffer.from(given), Buffer.from(token))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { to } = (await req.json().catch(() => ({}))) as { to?: string };
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) return NextResponse.json({ error: "Valid 'to' required" }, { status: 422 });

  const lines = [
    { id: "tier1-pro", quantity: 1 },
    { id: "power-3", quantity: 2 },
  ].map(({ id, quantity }) => {
    const p = productById(id)!;
    return { id, name: p.name, unitPrice: p.price, quantity, image: p.image };
  });
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const fee = transactionFee(subtotal);
  const total = (subtotal + fee) * 100;
  const order: Order = {
    id: "IL-TEST-0001",
    token: "test",
    status: "paid",
    createdAt: new Date().toISOString(),
    paidAt: new Date().toISOString(),
    customer: {
      firstName: "Interlink",
      lastName: "Tester",
      email: to,
      phone: "+2348000000000",
      address: { line1: "Test delivery address", city: "Lagos", state: "Lagos" },
    },
    lines,
    subtotalKobo: subtotal * 100,
    feeKobo: fee * 100,
    totalKobo: total,
    paidKobo: total,
    credits: [],
    account: { id: "test", number: "0000000000", name: "Test", bank: "Test" },
    pouchCustomerId: "test",
    consent: { termsVersion: site.termsVersion, acceptedAt: new Date().toISOString() },
    estimatedDispatch: site.presale.estimatedDispatch,
  };
  try {
    await sendOrderConfirmation(order, { subjectPrefix: "[Test] " });
    return NextResponse.json({ sent: true, to, provider: process.env.RESEND_API_KEY && process.env.EMAIL_FROM ? "resend" : "fallback" });
  } catch (err) {
    return NextResponse.json({ sent: false, error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}
