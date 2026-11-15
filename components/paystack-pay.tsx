"use client";

import { useState } from "react";
import { formatKobo } from "@/lib/catalog";
import type { PublicOrder } from "@/lib/orders";

/** Hands the customer to Paystack's hosted checkout for whatever is still owed. */
export function PaystackPay({ order, token, testMode }: { order: PublicOrder; token: string; testMode: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const outstanding = Math.max(0, order.totalKobo - order.paidKobo);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/paystack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Something went wrong.");
      window.location.assign(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="case transfer">
      <p className="small">Pay with card, bank app or USSD</p>
      <p className="amount">{formatKobo(outstanding)}</p>
      {order.paidKobo > 0 && (
        <p className="small" style={{ marginTop: 10 }}>
          {formatKobo(order.paidKobo)} received so far. This pays the balance.
        </p>
      )}
      <button className="btn btn-primary btn-block" style={{ marginTop: 28 }} onClick={start} disabled={busy}>
        {busy ? "Opening Paystack…" : `Pay ${formatKobo(outstanding)}`}
      </button>
      {error && (
        <p className="small" style={{ marginTop: 14, color: "#ffb4a8" }} role="alert">
          {error}
        </p>
      )}
      <ul className="tips">
        <li>You’ll finish on Paystack’s secure page, then come straight back here.</li>
        <li>Your order confirms as soon as Paystack approves the payment.</li>
        <li>We never see or store your card details.</li>
      </ul>
      {testMode && <p className="small" style={{ marginTop: 16 }}>Test mode: no Paystack key is set, so payment is simulated and succeeds at once.</p>}
    </div>
  );
}
