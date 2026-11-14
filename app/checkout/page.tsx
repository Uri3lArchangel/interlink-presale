import type { Metadata } from "next";
import { CheckoutForm } from "./form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <section className="page">
      <div className="wrap">
        <p className="eyebrow">Checkout · Step 1 of 2</p>
        <h1 className="display page-title">
          Your <em>reservation.</em>
        </h1>
        <CheckoutForm />
      </div>
    </section>
  );
}
