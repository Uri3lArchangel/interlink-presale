import "server-only";
import nodemailer from "nodemailer";
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
        <td style="padding:14px 0;border-bottom:1px solid #d8dad5;font-size:14px;color:#1c1e21">${esc(l.name)}<br><span style="color:#636970;font-size:12px">Qty ${l.quantity} × ${formatNaira(l.unitPrice)}</span></td>
        <td style="padding:14px 0;border-bottom:1px solid #d8dad5;font-size:14px;color:#1c1e21;text-align:right;white-space:nowrap">${formatNaira(l.unitPrice * l.quantity)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html><html><body style="margin:0;background:#e4e5e1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e4e5e1;padding:40px 16px"><tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #d8dad5">
    <tr><td style="background:#141619;padding:24px 36px">
      <span style="color:#ebece8;font-size:18px;font-weight:700;letter-spacing:-0.01em">Interlink</span>
    </td></tr>
    <tr><td style="padding:40px 36px 8px">
      <p style="margin:0 0 6px;font-size:14px;color:#1e5aa8;font-weight:600">Payment received</p>
      <h1 style="margin:0 0 16px;font-weight:700;font-size:28px;letter-spacing:-0.02em;line-height:1.2;color:#1c1e21">Your reservation is confirmed, ${esc(order.customer.firstName)}.</h1>
      <p style="margin:0;font-size:15px;line-height:1.6;color:#4b5056">We have received ${formatKobo(order.paidKobo)} and secured your place in the Interlink presale (${site.presale.batch}). Keep this email: your order number is how we find your reservation.</p>
    </td></tr>
    <tr><td style="padding:28px 36px 8px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0ec;border:1px solid #d8dad5"><tr>
        <td style="padding:18px 20px"><span style="font-size:11px;color:#636970">Order number</span><br><span style="font-size:22px;font-weight:700;color:#1c1e21;letter-spacing:.02em">${order.id}</span></td>
        <td style="padding:18px 20px;text-align:right"><span style="font-size:11px;color:#636970">Estimated dispatch</span><br><span style="font-size:16px;color:#1c1e21">${esc(order.estimatedDispatch)}</span></td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:20px 36px 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
        <tr><td style="padding:16px 0 0;font-size:14px;color:#1c1e21;font-weight:600">Total paid</td><td style="padding:16px 0 0;font-size:16px;color:#1c1e21;font-weight:600;text-align:right">${formatKobo(order.paidKobo)}</td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:28px 36px 0">
      <p style="margin:0 0 6px;font-size:11px;color:#636970">Shipping to</p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#4b5056">${esc(order.customer.firstName)} ${esc(order.customer.lastName)}<br>${address}</p>
    </td></tr>
    <tr><td style="padding:32px 36px">
      <a href="${orderUrl}" style="display:inline-block;background:#1e5aa8;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 24px;border-radius:999px">View your order</a>
    </td></tr>
    <tr><td style="padding:0 36px 36px;font-size:12px;line-height:1.6;color:#636970;border-top:1px solid #d8dad5">
      <p style="margin:20px 0 0">This is a presale order. The dispatch date is an estimate and may change; we will email you before your order ships. Your purchase is governed by the <a href="${site.url}/terms" style="color:#636970">Terms of Sale</a> (version ${site.termsVersion}) you accepted at checkout, including your right to cancel before dispatch.</p>
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

/**
 * Sends the confirmation. Gmail (GMAIL_USER + GMAIL_APP_PASSWORD) wins when set, so the store can
 * email customers without owning a domain. Otherwise Resend, which needs a verified domain to reach
 * customers. With neither, development prints the email and production throws so the send is retried.
 */
export async function sendOrderConfirmation(order: Order) {
  const mail = confirmationEmail(order);
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (gmailUser && gmailPass) {
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass.replace(/\s+/g, "") },
    });
    await transport.sendMail({
      // Gmail only sends as the signed-in account, so the address is always GMAIL_USER.
      from: { name: site.name, address: gmailUser },
      to: order.customer.email,
      replyTo: site.supportEmail,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      headers: { "X-Interlink-Order": order.id },
    });
    return;
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") throw new Error("No email provider configured (GMAIL_USER/GMAIL_APP_PASSWORD or RESEND_API_KEY)");
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
