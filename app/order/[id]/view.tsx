"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatKobo, formatNaira } from "@/lib/catalog";
import { feeLabel } from "@/lib/pricing";
import type { PublicOrder } from "@/lib/orders";
import { site } from "@/lib/site";
import { CryptoPay } from "@/components/crypto-pay";

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
  awaiting_payment: "Waiting for your transfer",
  part_paid: "Part payment received",
  paid: "Paid and confirmed",
  expired: "Reservation lapsed",
};

export function OrderView({ initial, token, testMode }: { initial: PublicOrder; token: string; testMode: boolean }) {
  const [order, setOrder] = useState(initial);
  const [simulating, setSimulating] = useState(false);
  const [method, setMethod] = useState<"bank" | "crypto">(initial.crypto ? "crypto" : "bank");
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
        {!paid && (
          <ol className="crumbs">
            <li>Shop</li>
            <li>Details</li>
            <li aria-current="step">Payment</li>
          </ol>
        )}
        <p className="status" data-s={order.status} role="status">
          <i aria-hidden="true" /> {statusLabel[order.status]}
        </p>
        <h1 className="h1 page-h">{paid ? `Thank you, ${order.firstName}` : order.status === "expired" ? "This reservation lapsed" : "Transfer to confirm your order"}</h1>

        <div className="split">
          <div>
            {paid ? (
              <div className="case transfer">
                <p className="small" style={{ color: "var(--case-ink-2)" }}>
                  Order number
                </p>
                <p className="order-no">{order.id}</p>
                <p style={{ color: "var(--case-ink-2)", margin: "24px 0 0", maxWidth: "34em" }}>
                  We received {formatKobo(order.paidKobo)} and your place in {site.presale.batch} is secured. A confirmation is on its
                  way to <strong style={{ color: "var(--case-ink)" }}>{order.email}</strong>. Estimated dispatch is{" "}
                  {order.estimatedDispatch}, and we’ll email you before anything ships.
                </p>
                <Link href="/" className="btn btn-sm" style={{ marginTop: 28, background: "var(--case-ink)", color: "var(--case)" }}>
                  Back to the shop
                </Link>
              </div>
            ) : order.status === "expired" ? (
              <div className="panel">
                <p style={{ marginTop: 0 }}>
                  No transfer arrived within {site.presale.paymentWindowHours} hours, so the hardware was released. If you did pay,
                  email{" "}
                  <a className="link" href={`mailto:${site.supportEmail}?subject=${order.id}`}>
                    {site.supportEmail}
                  </a>{" "}
                  with order number {order.id} and we’ll match your payment.
                </p>
                <Link href="/" className="btn btn-primary">
                  Start a new order
                </Link>
              </div>
            ) : (
              <>
              {order.cryptoEnabled && order.status === "awaiting_payment" && (
                <div className="switch" role="group" aria-label="Payment method" style={{ background: "var(--grey)", marginTop: 0, marginBottom: 16 }}>
                  {(["bank", "crypto"] as const).map((m) => (
                    <button
                      key={m}
                      aria-pressed={method === m}
                      onClick={() => setMethod(m)}
                      style={method === m ? { background: "#fff", color: "var(--ink)", boxShadow: "0 1px 3px rgba(0,0,0,.12)" } : { color: "var(--ink-2)" }}
                    >
                      {m === "bank" ? "Bank transfer" : "Crypto"}
                    </button>
                  ))}
                </div>
              )}
              {method === "crypto" && order.cryptoEnabled && order.status === "awaiting_payment" ? (
                <CryptoPay order={order} token={token} testMode={testMode} onUpdate={setOrder} />
              ) : (
              <div className="case transfer">
                <p className="small">Send exactly</p>
                <p className="amount">{formatKobo(outstanding)}</p>
                {order.status === "part_paid" && (
                  <p className="small" style={{ marginTop: 10 }}>
                    {formatKobo(order.paidKobo)} received so far. Send the balance to the same account.
                  </p>
                )}
                <dl className="bank">
                  <div>
                    <dt>Account number</dt>
                    <dd>
                      <span className="acct">{order.account.number}</span>
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
                      {formatKobo(outstanding)}
                      <Copy value={String(outstanding / 100)} label="amount" />
                    </dd>
                  </div>
                </dl>
                <ul className="tips">
                  <li>This account number is only for order {order.id}. Don’t reuse it.</li>
                  <li>Send it before {deadline}, or the hardware may be released.</li>
                  <li>This page updates by itself when the money lands, usually within a minute.</li>
                  <li>We will never ask you to pay into another account. If anyone does, tell {site.supportEmail}.</li>
                </ul>
                {testMode && (
                  <div
                    style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid rgba(235,236,232,.12)", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}
                  >
                    <span className="small">Test mode: no Pouch key is set, so this account is simulated.</span>
                    <button className="btn btn-sm btn-primary" onClick={simulate} disabled={simulating}>
                      {simulating ? "Sending…" : "Simulate transfer"}
                    </button>
                  </div>
                )}
              </div>
              )}
              </>
            )}
          </div>

          <aside className="panel sticky" aria-label="Order summary">
            <div className="sum">
              <h2 className="h3" style={{ fontSize: 20 }}>
                Order
              </h2>
              <span>{order.id}</span>
            </div>
            <div style={{ margin: "12px 0 16px" }}>
              {order.lines.map((l) => (
                <div className="line" key={l.id} style={{ gridTemplateColumns: "56px 1fr auto" }}>
                  <div className="thumb" style={{ width: 56, height: 56, borderRadius: 12 }}>
                    <Image src={l.image} alt="" width={56} height={56} />
                  </div>
                  <div>
                    <div className="line-name">{l.name}</div>
                    <div className="line-sub">Qty {l.quantity}</div>
                  </div>
                  <div className="price">{formatNaira(l.unitPrice * l.quantity)}</div>
                </div>
              ))}
            </div>
            {order.feeKobo > 0 && (
              <div style={{ display: "grid", gap: 8, borderTop: "1px solid var(--rule)", paddingTop: 16, marginBottom: 10 }}>
                <div className="sum">
                  <span>Subtotal</span>
                  <span>{formatKobo(order.subtotalKobo)}</span>
                </div>
                <div className="sum">
                  <span>{feeLabel}</span>
                  <span>{formatKobo(order.feeKobo)}</span>
                </div>
              </div>
            )}
            <div className="sum" style={{ borderTop: "1px solid var(--rule)", paddingTop: 16 }}>
              <span>Total</span>
              <strong>{formatKobo(order.totalKobo)}</strong>
            </div>
            <p className="small" style={{ marginTop: 16 }}>
              Bookmark this page to check your order later. This order is covered by the{" "}
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
