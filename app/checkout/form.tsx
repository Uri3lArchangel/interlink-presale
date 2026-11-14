"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart";
import { formatNaira } from "@/lib/catalog";
import { site } from "@/lib/site";

const STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo",
  "Ekiti", "Enugu", "FCT Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

export function CheckoutForm() {
  const { lines, subtotal, ready, clear } = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (ready && lines.length === 0 && !busy) {
    return (
      <div className="panel" style={{ marginTop: 48, maxWidth: 560 }}>
        <p style={{ marginTop: 0 }}>Your bag is empty.</p>
        <Link href="/#network" className="btn btn-primary btn-sm">
          Browse the hardware
        </Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ id: l.id, quantity: l.quantity })),
          acceptedTerms: f.get("terms") === "on",
          customer: {
            firstName: v("firstName"),
            lastName: v("lastName"),
            email: v("email"),
            phone: v("phone"),
            address: { line1: v("line1"), line2: v("line2"), city: v("city"), state: v("state"), postcode: v("postcode") },
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      clear();
      router.push(`/order/${data.id}?t=${encodeURIComponent(data.token)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form className="split" onSubmit={submit}>
      <div>
        <fieldset>
          <legend>Contact</legend>
          <div className="fields">
            <div className="field">
              <label htmlFor="firstName">First name</label>
              <input id="firstName" name="firstName" autoComplete="given-name" required maxLength={60} />
            </div>
            <div className="field">
              <label htmlFor="lastName">Last name</label>
              <input id="lastName" name="lastName" autoComplete="family-name" required maxLength={60} />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required placeholder="Your confirmation goes here" />
            </div>
            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input id="phone" name="phone" type="tel" autoComplete="tel" required placeholder="0803 000 0000" pattern="[\d\s+\-()]{10,20}" />
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend>Delivery address</legend>
          <div className="fields">
            <div className="field full">
              <label htmlFor="line1">Street address</label>
              <input id="line1" name="line1" autoComplete="address-line1" required />
            </div>
            <div className="field full">
              <label htmlFor="line2">Apartment, suite, landmark (optional)</label>
              <input id="line2" name="line2" autoComplete="address-line2" />
            </div>
            <div className="field">
              <label htmlFor="city">City</label>
              <input id="city" name="city" autoComplete="address-level2" required />
            </div>
            <div className="field">
              <label htmlFor="state">State</label>
              <select id="state" name="state" autoComplete="address-level1" required defaultValue="">
                <option value="" disabled>
                  Select state
                </option>
                {STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend>Agreement</legend>
          <p className="note">
            <strong>This is a presale.</strong> You are paying now for hardware that is still being manufactured. Estimated dispatch
            is <strong>{site.presale.estimatedDispatch}</strong>; dates can change. You may cancel for a refund at any time before
            your dispatch notice. If exchange rates, duties or tariffs raise our costs by more than{" "}
            {site.presale.costAdjustThresholdPct}% before dispatch, we may ask for a cost adjustment, which you can accept or decline
            for a full refund.
          </p>
          <label className="check" style={{ marginTop: 24 }}>
            <input type="checkbox" name="terms" required />
            <span>
              I have read and agree to the{" "}
              <Link className="link" href="/terms" target="_blank">
                Terms of Sale
              </Link>{" "}
              and{" "}
              <Link className="link" href="/privacy" target="_blank">
                Privacy Notice
              </Link>
              , and I understand the estimated dispatch date is not guaranteed.
            </span>
          </label>
        </fieldset>
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
      </div>

      <aside className="panel sticky" aria-label="Order summary">
        <h2 className="h3" style={{ fontSize: 20 }}>Summary</h2>
        <div style={{ margin: "12px 0 20px" }}>
          {lines.map((l) => (
            <div className="line" key={l.id} style={{ gridTemplateColumns: "56px 1fr auto" }}>
              <div className="thumb" style={{ width: 56, height: 56, borderRadius: 12 }}>
                <Image src={l.image} alt="" width={56} height={56} />
              </div>
              <div>
                <div className="line-name">{l.name}</div>
                <div className="line-sub">Qty {l.quantity}</div>
              </div>
              <div className="price">{formatNaira(l.price * l.quantity)}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <div className="sum">
            <span>Hardware</span>
            <span className="price">{formatNaira(subtotal)}</span>
          </div>
          <div className="sum">
            <span>Delivery</span>
            <span>Quoted before dispatch</span>
          </div>
          <div className="sum" style={{ borderTop: "1px solid var(--line)", paddingTop: 16, marginTop: 6 }}>
            <span>Due today</span>
            <strong>{formatNaira(subtotal)}</strong>
          </div>
        </div>
        <button className="btn btn-primary btn-block" style={{ marginTop: 24 }} disabled={busy || !ready}>
          {busy ? "Creating your payment account…" : "Continue to payment"}
        </button>
        <p className="small" style={{ marginTop: 14 }}>
          Next, you’ll get a dedicated account number for this order. Payments are processed by our payment partner, Pouch.
        </p>
      </aside>
    </form>
  );
}
