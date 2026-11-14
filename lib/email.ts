import "server-only";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { formatEspees, formatKobo, formatNaira } from "./catalog";
import { site } from "./site";
import { feeLabel } from "./pricing";
import type { Order } from "./orders";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function confirmationEmail(order: Order) {
  const orderUrl = `${site.url}/order/${order.id}?t=${order.token}`;
  const a = order.customer.address;
  const address = [a.line1, a.line2, `${a.city}, ${a.state}`, a.postcode].filter(Boolean).map((x) => esc(x!)).join("<br>");
  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
  const ink = "#1d1d1f";
  const grey = "#6e6e73";
  const rule = "#e8e8ed";
  const blue = "#1e5aa8";
  // JPG/PNG copies in public/email: many mail clients can't show the site's WebP images.
  const asset = (p: string) => `${site.url}/email/${p}`;

  const rows = order.lines
    .map(
      (l) => `<tr>
        <td width="64" style="padding:14px 0;border-bottom:1px solid ${rule};vertical-align:middle">
          <img src="${asset(`${l.id}.jpg`)}" width="56" height="56" alt="" style="display:block;border-radius:12px;background:#0b0b0c">
        </td>
        <td style="padding:14px 12px;border-bottom:1px solid ${rule};vertical-align:middle;font-family:${font}">
          <div style="font-size:15px;font-weight:600;color:${ink};line-height:1.3">${esc(l.name)}</div>
          <div style="font-size:13px;color:${grey};margin-top:2px">Qty ${l.quantity}${l.quantity > 1 ? ` · ${formatNaira(l.unitPrice)} each` : ""}</div>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid ${rule};vertical-align:middle;text-align:right;white-space:nowrap;font-family:${font};font-size:15px;font-weight:600;color:${ink}">${formatNaira(l.unitPrice * l.quantity)}</td>
      </tr>`,
    )
    .join("");

  const step = (title: string, body: string) => `<tr>
      <td width="22" style="padding:0 0 14px;vertical-align:top"><div style="width:8px;height:8px;border-radius:50%;background:${blue};margin-top:7px"></div></td>
      <td style="padding:0 0 14px;font-family:${font};font-size:14px;line-height:1.5;color:${grey}"><strong style="color:${ink};font-weight:600">${title}</strong> ${body}</td>
    </tr>`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>Order ${order.id} confirmed</title></head>
<body style="margin:0;padding:0;background:#f5f5f7;-webkit-font-smoothing:antialiased">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">Payment received. Order ${order.id} is confirmed, estimated dispatch ${esc(order.estimatedDispatch)}.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7"><tr><td align="center" style="padding:40px 16px">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
      <tr><td align="center" style="padding:0 0 24px">
        <img src="${asset("logo.png")}" width="44" height="44" alt="Interlink" style="display:block;border-radius:11px">
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px">
      <tr><td align="center" style="padding:44px 40px 8px;font-family:${font}">
        <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:#e9f6ee;color:#1d7a43;font-size:13px;font-weight:600">&#10003;&nbsp; Payment received</div>
        <h1 style="margin:18px 0 10px;font-size:30px;line-height:1.15;font-weight:700;letter-spacing:-0.02em;color:${ink}">Thank you, ${esc(order.customer.firstName)}.</h1>
        <p style="margin:0;font-size:16px;line-height:1.5;color:${grey}">Your Interlink reservation is confirmed.<br>Keep this email: your order number is how we find it.</p>
      </td></tr>

      <tr><td style="padding:28px 40px 4px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;border-radius:14px"><tr>
          <td style="padding:18px 20px;font-family:${font}">
            <div style="font-size:12px;color:${grey}">Order number</div>
            <div style="font-size:20px;font-weight:700;color:${ink};letter-spacing:0.02em;margin-top:2px">${order.id}</div>
          </td>
          <td style="padding:18px 20px;text-align:right;font-family:${font}">
            <div style="font-size:12px;color:${grey}">Estimated dispatch</div>
            <div style="font-size:16px;font-weight:600;color:${ink};margin-top:2px">${esc(order.estimatedDispatch)}</div>
          </td>
        </tr></table>
      </td></tr>

      <tr><td style="padding:12px 40px 0">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${rows}
          ${
            order.feeKobo
              ? `<tr>
            <td colspan="2" style="padding:16px 0 0;font-family:${font};font-size:14px;color:${grey}">Subtotal</td>
            <td style="padding:16px 0 0;text-align:right;font-family:${font};font-size:14px;color:${grey}">${formatKobo(order.subtotalKobo ?? order.totalKobo - order.feeKobo)}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:6px 0 0;font-family:${font};font-size:14px;color:${grey}">${feeLabel}</td>
            <td style="padding:6px 0 0;text-align:right;font-family:${font};font-size:14px;color:${grey}">${formatKobo(order.feeKobo)}</td>
          </tr>`
              : ""
          }
          <tr>
            <td colspan="2" style="padding:12px 0 0;font-family:${font};font-size:15px;color:${grey}">Total paid</td>
            <td style="padding:18px 0 0;text-align:right;font-family:${font};font-size:20px;font-weight:700;letter-spacing:-0.01em;color:${ink}">${formatKobo(order.paidKobo)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding:4px 0 0;text-align:right;font-family:${font};font-size:13px;color:${grey}">≈ ${formatEspees(order.paidKobo / 100)}</td>
          </tr>
        </table>
      </td></tr>

      <tr><td align="center" style="padding:32px 40px 8px">
        <a href="${orderUrl}" style="display:inline-block;background:${blue};color:#ffffff;text-decoration:none;font-family:${font};font-size:16px;font-weight:600;padding:14px 28px;border-radius:999px">View your order</a>
      </td></tr>

      <tr><td style="padding:28px 40px 0"><div style="height:1px;background:${rule};line-height:1px;font-size:1px">&nbsp;</div></td></tr>

      <tr><td style="padding:24px 40px 0;font-family:${font}">
        <div style="font-size:15px;font-weight:700;color:${ink};margin-bottom:14px">What happens next</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${step("We build your hardware.", `${site.presale.batch} is estimated to dispatch in ${esc(order.estimatedDispatch)}. If that changes, we’ll email you.`)}
          ${step("We confirm delivery.", "Before dispatch we’ll check your address and quote the delivery charge.")}
          ${step("You can change your mind.", `Cancel any time before your dispatch notice and we refund the price you paid. The ${site.transactionFeePct}% transaction fee isn’t refunded for a change of mind.`)}
        </table>
      </td></tr>

      <tr><td style="padding:10px 40px 40px;font-family:${font}">
        <div style="font-size:12px;color:${grey};margin-bottom:4px">Delivering to</div>
        <div style="font-size:14px;line-height:1.55;color:${ink}">${esc(order.customer.firstName)} ${esc(order.customer.lastName)}<br>${address}</div>
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
      <tr><td align="center" style="padding:28px 24px 0;font-family:${font};font-size:12px;line-height:1.6;color:#86868b">
        Questions? Reply to this email or write to <a href="mailto:${esc(site.supportEmail)}" style="color:#86868b">${esc(site.supportEmail)}</a> and quote ${order.id}.<br>
        Your order is covered by the <a href="${site.url}/terms" style="color:#86868b">Terms of Sale</a> (version ${site.termsVersion}) you accepted at checkout.<br><br>
        Interlink is a product of ${esc(site.legalName)}, ${esc(site.rcNumber)}, ${esc(site.address)}.
      </td></tr>
    </table>

  </td></tr></table>
</body></html>`;

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
 * Sends the confirmation. Resend (RESEND_API_KEY + EMAIL_FROM on a verified domain) wins, then an SMTP mailbox
 * (SMTP_USER + SMTP_PASSWORD), then Gmail (GMAIL_USER + GMAIL_APP_PASSWORD). With none of them,
 * development prints the email and production throws so the send is retried later.
 */
export async function sendOrderConfirmation(order: Order, opts: { subjectPrefix?: string } = {}) {
  const mail = confirmationEmail(order);
  const subject = (opts.subjectPrefix ?? "") + mail.subject;
  const message = {
    to: order.customer.email,
    replyTo: site.supportEmail,
    subject,
    html: mail.html,
    text: mail.text,
    headers: { "X-Interlink-Order": order.id },
  };

  // 1. Resend, once EMAIL_FROM is set to an address on a domain verified in Resend.
  const resendKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.EMAIL_FROM;
  if (resendKey && resendFrom) {
    await sendWithResend(resendKey, resendFrom, message, order.id);
    return;
  }

  // 2. Any SMTP mailbox, e.g. Namecheap Private Email (mail.privateemail.com, port 465).
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  if (smtpUser && smtpPass) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "mail.privateemail.com",
      port,
      secure: port === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });
    // The mailbox can only send as itself, so the address is always SMTP_USER.
    await transport.sendMail({ ...message, from: { name: site.name, address: smtpUser } });
    return;
  }

  // 3. Gmail with an app password.
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
      ...message,
    });
    return;
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") throw new Error("No email provider configured (RESEND_API_KEY + EMAIL_FROM, SMTP_USER/SMTP_PASSWORD or GMAIL_USER/GMAIL_APP_PASSWORD)");
    console.info(`[email] (dev, not sent) to ${order.customer.email}: ${mail.subject}\n${mail.text}`);
    return;
  }
  await sendWithResend(key, process.env.EMAIL_FROM ?? `${site.name} <onboarding@resend.dev>`, message, order.id);
}

async function sendWithResend(
  key: string,
  from: string,
  message: { to: string; replyTo: string; subject: string; html: string; text: string; headers: Record<string, string> },
  orderId: string,
) {
  const { error } = await new Resend(key).emails.send(
    { from, ...message },
    // Resend drops repeats with the same key, a second guard against double emails.
    { idempotencyKey: `order-confirmation/${orderId}` },
  );
  if (error) throw new Error(error.message);
}
