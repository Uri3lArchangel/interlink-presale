import type { Metadata } from "next";
import { CheckoutForm } from "./form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <section className="page">
      <div className="wrap">
        <ol className="crumbs">
          <li><a className="link" href="/">Shop</a></li>
          <li aria-current="step">Details</li>
          <li>Payment</li>
        </ol>
        <h1 className="h1 page-h">
          Checkout
        </h1>
        <CheckoutForm />
      </div>
    </section>
  );
}
