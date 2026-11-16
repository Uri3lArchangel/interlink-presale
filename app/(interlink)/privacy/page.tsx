import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Notice" };

export default function PrivacyPage() {
  return (
    <section className="page">
      <div className="wrap">
        <p className="small">Version {site.termsVersion}</p>
        <h1 className="h1 page-h" style={{ marginTop: 12 }}>
          Privacy Notice
        </h1>
        <div className="legal">
          <div />
          <div className="legal-body">
            <section>
              <h2>Who we are</h2>
              <p>
                {site.legalName} ({site.rcNumber}), {site.address}, is the data controller for personal data collected through this
                presale website, under the Nigeria Data Protection Act 2023. Contact: {site.supportEmail}.
              </p>
            </section>
            <section>
              <h2>What we collect and why</h2>
              <ul>
                <li><strong>Contact details</strong> (name, email, phone): to confirm your order and contact you about it. Basis: performance of our contract with you.</li>
                <li><strong>Delivery address</strong>: to deliver your products. Basis: contract.</li>
                <li><strong>Payment details</strong> (the account number created for your order, and the name, bank and amount of each transfer into it): to match and verify payment and to process refunds. We never see your card or online banking credentials. Basis: contract and legal obligation.</li>
                <li><strong>Agreement record</strong> (Terms version, time, IP address, browser details): to evidence the terms you accepted. Basis: legitimate interest and legal obligation.</li>
              </ul>
            </section>
            <section>
              <h2>Who we share it with</h2>
              <p>
                Our payment partners: Pouch and its banking partners, to create your payment account number and process transfers; Paystack, to process card, bank app and USSD payments (Paystack collects your card details directly; we never see or store them); and Dextopus, if you pay in crypto;
                Google (Gmail), to send order emails; Vercel and Upstash, which host this website and store order records; and delivery partners, at dispatch. We do
                not sell your data or use it for third-party advertising. Some providers may process data outside Nigeria under
                safeguards permitted by the NDPA.
              </p>
            </section>
            <section>
              <h2>How long we keep it</h2>
              <p>
                Order and payment records are kept for six years after your order is completed or cancelled, to meet tax and
                accounting obligations. Other data is deleted when no longer needed.
              </p>
            </section>
            <section>
              <h2>Your rights</h2>
              <p>
                You can ask to access, correct, delete or port your personal data, object to or restrict its processing, or withdraw
                consent where we rely on it, by writing to {site.supportEmail}. You may also complain to the Nigeria Data Protection
                Commission.
              </p>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
