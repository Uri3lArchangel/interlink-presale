"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatKobo, formatNaira } from "@/lib/catalog";
import type { PublicOrder } from "@/lib/orders";
import { site } from "@/lib/site";

function Copy({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="copy"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {}
      }}
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

const statusLabel: Record<PublicOrder["status"], string> = {
  awaiting_payment: "Awaiting transfer",
  part_paid: "Part payment received",
  paid: "Paid · Reservation confirmed",
  expired: "Reservation expired",
};

export function OrderView({ initial, token, testMode }: { initial: PublicOrder; token: string; testMode: boolean }) {
  const [order, setOrder] = useState(initial);
  const [simulating, setSimulating] = useState(false);
  const outstanding = Math.max(0, order.totalKobo - order.paidKobo);
  const paid = order.status === "paid";

  useEffect(() => {
    if (paid) return;
    let stop = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}?t=${encodeURIComponent(token)}`, { cache: "no-store" });
        if (res.ok && !stop) setOrder(await res.json());
      } catch {}
    };
    const iv = setInterval(tick, 8000);
    const onVis = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop = true;
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [paid, order.id, token]);

  async function simulate() {
    setSimulating(true);
    await fetch("/api/dev/simulate-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: order.id, token }),
    });
    const res = await fetch(`/api/orders/${order.id}?t=${encodeURIComponent(token)}`, { cache: "no-store" });
    if (res.ok) setOrder(await res.json());
    setSimulating(false);
  }

  const deadline = new Date(order.expiresAt).toLocaleString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <section className="page">
      <div className="wrap">
        <p className="status" data-s={order.status} role="status">
          <i aria-hidden="true" /> {statusLabel[order.status]}
        </p>
        <h1 className="display page-title">
          {paid ? (
            <>
              Thank you, <em>{order.firstName}.</em>
            </>
          ) : (
            <>
              Complete your <em>transfer.</em>
            </>
          )}
        </h1>

        <div className="split">
          <div>
            {paid ? (
              <div className="panel">
                <p className="eyebrow">Order number</p>
                <p style={{ margin: "10px 0 0", fontFamily: "var(--mono)", fontSize: 32, letterSpacing: ".06em" }}>
                  {order.id}
                </p>
                <p className="lede" style={{ marginTop: 24 }}>
                  We’ve received {formatKobo(order.paidKobo)} and your place in {site.presale.batch} is secured. A confirmation has
                  been sent to <strong style={{ color: "var(--text)" }}>{order.email}</strong>. Estimated dispatch is{" "}
                  {order.estimatedDispatch}; we’ll email you before anything ships.
                </p>
                <div className="hero-actions" style={{ marginTop: 28 }}>
                  <Link href="/" className="btn btn-ghost">
                    Back to the store
                  </Link>
                </div>
              </div>
            ) : order.status === "expired" ? (
              <div className="panel">
                <p className="lede" style={{ marginTop: 0 }}>
                  We didn’t receive a transfer within {site.presale.paymentWindowHours} hours, so this reservation has lapsed. If you
                  have already paid, don’t worry: write to{" "}
                  <a className="link" href={`mailto:${site.supportEmail}?subject=${order.id}`}>
                    {site.supportEmail}
                  </a>{" "}
                  with order number {order.id} and we’ll match your payment.
                </p>
                <Link href="/" className="btn btn-primary" style={{ marginTop: 16 }}>
                  Start a new reservation
                </Link>
              </div>
            ) : (
              <div className="panel">
                <p className="eyebrow">Transfer exactly</p>
                <p style={{ fontFamily: "var(--serif)", fontSize: "clamp(48px,6vw,72px)", lineHeight: 1, margin: "14px 0 6px" }}>
                  {formatKobo(outstanding)}
                </p>
                {order.status === "part_paid" && (
                  <p className="fine">
                    {formatKobo(order.paidKobo)} received so far. Transfer the remaining balance to the same account.
                  </p>
                )}
                <dl className="bank" style={{ marginTop: 24 }}>
                  <div>
                    <dt>Account number</dt>
                    <dd>
                      <span className="big">{order.account.number}</span>
                      <Copy value={order.account.number} label="account number" />
                    </dd>
                  </div>
                  <div>
                    <dt>Bank</dt>
                    <dd>{order.account.bank}</dd>
                  </div>
                  <div>
                    <dt>Account name</dt>
                    <dd>{order.account.name}</dd>
                  </div>
                  <div>
                    <dt>Amount</dt>
                    <dd>
                      <span className="price">{formatKobo(outstanding)}</span>
                      <Copy value={String(outstanding / 100)} label="amount" />
                    </dd>
                  </div>
                </dl>
                <ul className="fine" style={{ paddingLeft: "1.1em", margin: "24px 0 0", display: "grid", gap: 8 }}>
                  <li>This account number is unique to order {order.id}. Don’t reuse it for another order.</li>
                  <li>Transfer before {deadline}. After that the reservation may be released.</li>
                  <li>This page updates on its own once the transfer lands, usually within a minute.</li>
                  <li>
                    We will never ask you to pay into any other account. If anyone does, contact {site.supportEmail}.
                  </li>
                </ul>
                {testMode && (
                  <div className="callout" style={{ marginTop: 28 }}>
                    <strong>Test mode.</strong> No POUCH_SECRET_KEY is set, so this account is simulated.{" "}
                    <button className="btn btn-ghost btn-sm" onClick={simulate} disabled={simulating} style={{ marginLeft: 8 }}>
                      {simulating ? "Simulating…" : "Simulate transfer"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="panel sticky" aria-label="Order summary">
            <div className="sum">
              <span className="eyebrow">Order</span>
              <span className="price">{order.id}</span>
            </div>
            <div className="mini-lines" style={{ margin: "12px 0 20px" }}>
              {order.lines.map((l) => (
                <div className="line" key={l.id}>
                  <Image src={l.image} alt="" width={56} height={56} />
                  <div>
                    <div className="line-name">{l.name}</div>
                    <div className="line-sub">Qty {l.quantity}</div>
                  </div>
                  <div className="price">{formatNaira(l.unitPrice * l.quantity)}</div>
                </div>
              ))}
            </div>
            <div className="sum">
              <span>Total</span>
              <strong>{formatKobo(order.totalKobo)}</strong>
            </div>
            <p className="fine" style={{ marginTop: 16 }}>
              Bookmark this page to check your order later. Governed by the{" "}
              <Link className="link" href="/terms">
                Terms of Sale
              </Link>
              .
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
