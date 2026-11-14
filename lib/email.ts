import "server-only";
import { Resend } from "resend";
import { formatKobo, formatNaira } from "./catalog";
import { site } from "./site";
import type { Order } from "./orders";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function confirmationEmail(order: Order) {
  const orderUrl = `${site.url}/order/${order.id}?t=${order.token}`;
  const a = order.customer.address;
  const address = [a.line1, a.line2, `${a.city}, ${a.state}`, a.postcode].filter(Boolean).map((x) => esc(x!)).join("<br>");
  const rows = order.lines
    .map(
      (l) => `<tr>
        <td style="padding:14px 0;border-bottom:1px solid #e7e2da;font-size:14px;color:#1b1a18">${esc(l.name)}<br><span style="color:#8a8378;font-size:12px">Qty ${l.quantity} × ${formatNaira(l.unitPrice)}</span></td>
        <td style="padding:14px 0;border-bottom:1px solid #e7e2da;font-size:14px;color:#1b1a18;text-align:right;white-space:nowrap">${formatNaira(l.unitPrice * l.quantity)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html><html><body style="margin:0;background:#f4f1ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ec;padding:40px 16px"><tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e2da">
    <tr><td style="background:#0e0d0c;padding:28px 36px">
      <span style="color:#efe9e0;font-size:13px;letter-spacing:.28em;text-transform:uppercase">Interlink</span>
    </td></tr>
    <tr><td style="padding:40px 36px 8px">
      <p style="margin:0 0 6px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#a3743a">Payment received</p>
      <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:30px;line-height:1.2;color:#1b1a18">Your reservation is confirmed, ${esc(order.customer.firstName)}.</h1>
      <p style="margin:0;font-size:15px;line-height:1.6;color:#4a4640">We have received ${formatKobo(order.paidKobo)} and secured your place in the Interlink presale (${site.presale.batch}). Keep this email: your order number is how we find your reservation.</p>
    </td></tr>
    <tr><td style="padding:28px 36px 8px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f6f2;border:1px solid #e7e2da"><tr>
        <td style="padding:18px 20px"><span style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a8378">Order number</span><br><span style="font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:20px;color:#1b1a18;letter-spacing:.06em">${order.id}</span></td>
        <td style="padding:18px 20px;text-align:right"><span style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a8378">Estimated dispatch</span><br><span style="font-size:16px;color:#1b1a18">${esc(order.estimatedDispatch)}</span></td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:20px 36px 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
        <tr><td style="padding:16px 0 0;font-size:14px;color:#1b1a18;font-weight:600">Total paid</td><td style="padding:16px 0 0;font-size:16px;color:#1b1a18;font-weight:600;text-align:right">${formatKobo(order.paidKobo)}</td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:28px 36px 0">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a8378">Shipping to</p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#4a4640">${esc(order.customer.firstName)} ${esc(order.customer.lastName)}<br>${address}</p>
    </td></tr>
    <tr><td style="padding:32px 36px">
      <a href="${orderUrl}" style="display:inline-block;background:#0e0d0c;color:#efe9e0;text-decoration:none;font-size:14px;padding:14px 22px">View your order</a>
    </td></tr>
    <tr><td style="padding:0 36px 36px;font-size:12px;line-height:1.6;color:#8a8378;border-top:1px solid #e7e2da">
      <p style="margin:20px 0 0">This is a presale order. The dispatch date is an estimate and may change; we will email you before your order ships. Your purchase is governed by the <a href="${site.url}/terms" style="color:#8a8378">Terms of Sale</a> (version ${site.termsVersion}) you accepted at checkout, including your right to cancel before dispatch.</p>
      <p style="margin:12px 0 0">Questions? Reply to this email or write to ${esc(site.supportEmail)} and quote ${order.id}.</p>
      <p style="margin:12px 0 0">${esc(site.legalName)} · ${esc(site.rcNumber)} · ${esc(site.address)}</p>
    </td></tr>
  </table></td></tr></table></body></html>`;

  const text = [
    `Your Interlink reservation is confirmed, ${order.customer.firstName}.`,
    ``,
    `Order number: ${order.id}`,
    `Amount received: ${formatKobo(order.paidKobo)}`,
    `Estimated dispatch: ${order.estimatedDispatch}`,
    ``,
    ...order.lines.map((l) => `${l.quantity} × ${l.name}  ${formatNaira(l.unitPrice * l.quantity)}`),
    ``,
    `View your order: ${orderUrl}`,
    ``,
    `This is a presale order governed by the Terms of Sale (version ${site.termsVersion}): ${site.url}/terms`,
    `Questions? Write to ${site.supportEmail} and quote ${order.id}.`,
  ].join("\n");

  return { subject: `Order ${order.id} confirmed: Interlink presale`, html, text };
}

export async function sendOrderConfirmation(order: Order) {
  const mail = confirmationEmail(order);
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY is not set");
    console.info(`[email] (dev, not sent) to ${order.customer.email}: ${mail.subject}\n${mail.text}`);
    return;
  }
  const resend = new Resend(key);
  const { error } = await resend.emails.send(
    {
      from: process.env.EMAIL_FROM ?? `Interlink <orders@interlink.example>`,
      to: order.customer.email,
      replyTo: site.supportEmail,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    },
    // Resend drops repeats with the same key, a second guard against double emails.
    { idempotencyKey: `order-confirmation/${order.id}` },
  );
  if (error) throw new Error(error.message);
}
