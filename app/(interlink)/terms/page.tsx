import type { Metadata } from "next";
import Link from "next/link";
import { MAX_QTY } from "@/lib/catalog";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of Sale" };

const S = site.legalName;
const P = site.presale;

const sections: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: "about",
    title: "About these Terms",
    body: (
      <>
        <p>
          These Terms of Sale (the <strong>“Terms”</strong>) govern every reservation and purchase made through this website during
          the Interlink presale. They form a binding agreement between you and {S} ({site.rcNumber}), {site.address}, the
          company that makes and sells Interlink products (<strong>“we”</strong>, <strong>“us”</strong>).
        </p>
        <p>
          You accept these Terms by ticking the agreement box at checkout. We record the version you accepted ({site.termsVersion}),
          the date and time, and the device details sent by your browser. The version you accepted applies to that order. We may
          update these Terms for future orders; changes never apply retroactively to an order you have already placed.
        </p>
        <p>
          You must be at least 18 years old and able to enter into a binding contract to place an order. If you order on behalf of a
          business, you confirm you are authorised to bind it.
        </p>
      </>
    ),
  },
  {
    id: "presale",
    title: "What a presale order is",
    body: (
      <>
        <p>
          A presale order is an advance purchase of hardware that is <strong>still being designed, manufactured or certified</strong>{" "}
          at the time you pay. By placing a presale order you acknowledge that:
        </p>
        <ol>
          <li>the products do not yet exist in final, shippable form, and their completion depends on suppliers, manufacturers, regulators and logistics providers outside our control;</li>
          <li>dispatch dates are estimates made in good faith, not guaranteed delivery dates;</li>
          <li>product images on this website are concept renders; and</li>
          <li>you are buying a product for your own use. Your order does not give you any share, equity, token, revenue right, network reward, profit share or other investment interest in Interlink or any network, and you should not buy for any of those reasons.</li>
        </ol>
      </>
    ),
  },
  {
    id: "orders",
    title: "Orders, acceptance and limits",
    body: (
      <>
        <p>
          Submitting checkout is an offer to buy. A contract is formed only when your full payment has arrived in our account
          and we confirm your order with an order number, by email or on your order page, whichever comes first. Until then we
          may decline any order and refund anything you paid.
        </p>
        <p>
          We may limit quantities per product, per customer, per address or per payment account (currently {MAX_QTY} units per product per
          order). We may cancel orders that appear to be placed for resale, placed using automated tools, placed in breach of these
          limits, or linked to fraud or suspicious payment activity. If we cancel an order for any of these reasons we will refund
          what you paid, and that refund is our only liability for the cancellation.
        </p>
        <p>
          If a product is listed at an obviously incorrect price because of a typographical or technical error, we are not bound to
          supply at that price, even if your order has been confirmed, as long as it has not been dispatched. We will tell you and
          offer either to proceed at the correct price or to cancel with a full refund.
        </p>
      </>
    ),
  },
  {
    id: "price",
    title: "Price and payment",
    body: (
      <>
        <p>
          Prices are in Nigerian naira and include any VAT that applies. The hardware price is fixed when you pay, and we will not ask
          you for more because our retail price rises before dispatch. The only exception is a cost adjustment, described below.
          Delivery charges are not included in the presale price and will be quoted to you before dispatch (see{" "}
          <a className="link" href="#delivery">Delivery</a>).
        </p>
        <p>
          <strong>Transaction fee.</strong> A transaction fee of {site.transactionFeePct}% of the hardware price is added to every
          order. It covers the cost of processing your payment and running the presale. It is shown in your bag and at checkout,
          and included in the total you transfer, before you pay.
        </p>
        <p className="key">
          <strong>Cost adjustment.</strong> If, before dispatch, events outside our control increase our cost of supplying your order
          by more than {P.costAdjustThresholdPct}%, we may ask you to pay a cost adjustment. Such events are a change in the naira
          exchange rate, new or increased import duties, tariffs or levies, or a change in law. We will email you the amount, the reason
          and a deadline of at least {P.costAdjustNoticeDays} days. You may either pay the adjustment or cancel for a full refund of
          everything you paid. If you do neither by the deadline, we will cancel your order and refund you in full. We will never take
          an adjustment without your agreement, and we will ask for an adjustment no more than once per order.
        </p>
        <p>
          Payment is by bank transfer to an account number created just for your order by our payment partner, Pouch,
          or by card, bank app or USSD through our payment partner, Paystack. Card payments are confirmed only when Paystack approves
          them; card refunds are made to the card or account used, and timing depends on your bank. For bank transfers, you must transfer the exact amount shown, to the account shown for that order, within {P.paymentWindowHours} hours. Unpaid
          reservations lapse after that time and we may release the stock.
        </p>
        <ul>
          <li>
            <strong>Underpayment:</strong> your order is not confirmed until the full amount is received. If the balance is not paid
            within 7 days of the first transfer, we may cancel the order and refund what you paid.
          </li>
          <li>
            <strong>Late payment:</strong> a transfer received after a reservation lapses will either be applied to your order, if
            stock remains, or refunded.
          </li>
          <li>
            <strong>Wrong account or reference:</strong> we are responsible only for funds that reach the account issued for your
            order. We will help trace misdirected transfers but cannot refund money that never reached us.
          </li>
          <li>
            <strong>Overpayment:</strong> if you pay more than the amount due, we will refund the difference to the account it came
            from.
          </li>
          <li>
            <strong>Bank charges:</strong> any charge your own bank applies to a transfer you make is yours to bear.
          </li>
        </ul>
        <p className="key">
          <strong>Paying in crypto.</strong> Where offered, you may pay in USDC or USDT through our payment partner, Dextopus. The
          naira total is converted to US dollars at the rate shown when you request a payment address, and that address and amount
          are valid only until the time shown. You must send the exact amount, in the coin and on the network shown, in one
          transfer. Network fees are yours to pay. A different amount is returned automatically to the refund wallet you give us. We
          are not responsible for coins sent on the wrong network, to the wrong address or in the wrong token, and may not be able to
          recover them. Refunds on crypto orders are paid in USDC or USDT to your refund wallet, for the US dollar value we
          received, less any network fees; we do not refund in naira for crypto payments. Accepting crypto is not investment
          advice, and nothing in your order is a digital asset or security.
        </p>
        <p>
          We will never ask you to pay into any account other than the one shown on your order page. Treat any such request as fraud
          and report it to {site.supportEmail}.
        </p>
      </>
    ),
  },
  {
    id: "dispatch",
    title: "Estimated dispatch and delays",
    body: (
      <>
        <p>
          The current estimated dispatch window for {P.batch} is <strong>{P.estimatedDispatch}</strong>. Orders are fulfilled broadly
          in the order in which they were paid, but we may ship by product, region or batch where that is more efficient.
        </p>
        <p>
          If we expect dispatch to move, we will email you a revised estimate and the reason in general terms. You may then either keep
          your reservation or cancel for a full refund. If you do not respond, your reservation stays in place.
        </p>
        <p>
          <strong>Long-stop date.</strong> If we have not begun dispatching your order within {P.longStopDays} days after the end of
          the estimated window shown at the time you ordered, you may cancel for a full refund of everything you paid, in addition to
          your right to cancel before dispatch. Except as stated in{" "}
          <a className="link" href="#statutory">Your statutory rights</a>, cancellation and refund are your remedy for delay, and we
          are not liable for any other loss caused by a change in the estimated date.
        </p>
      </>
    ),
  },
  {
    id: "cancel",
    title: "Your right to cancel and refunds",
    body: (
      <>
        <p>
          You may cancel your order <strong>for any reason, at any time before we send your dispatch notice</strong>, by emailing{" "}
          {site.supportEmail} from the address used at checkout and quoting your order number. If you cancel for your own reasons,
          we refund the hardware price you paid; the transaction fee is not refunded, because the payment has already been
          processed. Whenever these Terms give you a full refund because of something on our side (a delay, a product change, a
          cost adjustment, a pricing error, or us cancelling your order), the transaction fee is refunded too. Once your dispatch notice is sent,
          the order can no longer be cancelled for a change of mind and the return rules in{" "}
          <a className="link" href="#returns">Returns</a> apply instead.
        </p>
        <p>
          Refunds are paid to the Nigerian bank account the payment came from, or to another account in your name, within{" "}
          <strong>30 days</strong> of a valid cancellation. We may ask you to verify your identity and the account before releasing a
          refund, to protect you from fraud. We do not refund to anyone else, and we do not pay interest on amounts held.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to the products",
    body: (
      <>
        <p>
          Because the products are still in development, we may change design, materials, finish, colour, packaging, components,
          built-in software, software features, suppliers and specifications before dispatch. We will only make changes that are needed for
          manufacturing, safety, regulatory approval, component availability or product improvement, and that do not materially reduce
          the core function of what you ordered.
        </p>
        <p>
          If a change would materially reduce the core function, capacity or performance of the product you ordered, we will tell you
          before dispatch and you may cancel for a full refund. We may discontinue a product or a variant before dispatch; if we do, we
          will offer you a comparable alternative or a full refund, at your choice.
        </p>
      </>
    ),
  },
  {
    id: "delivery",
    title: "Delivery and collection",
    body: (
      <>
        <p>
          Before dispatch we will confirm your delivery address and quote the delivery charge. You may pay it, choose a collection point
          where we offer one, or cancel for a full refund, including the transaction fee. We deliver within Nigeria only unless we agree
          otherwise in writing.
        </p>
        <p>
          You are responsible for giving us a correct, complete address and for being available to receive the delivery. If delivery
          fails because of incorrect details or because no one is available after reasonable attempts, we may charge reasonable
          redelivery or storage costs. If you cannot be reached for 90 days after your dispatch notice despite reasonable efforts, we may
          cancel the order and refund what you paid less those costs.
        </p>
        <p>
          Risk of loss passes to you when the product is delivered to your address or collected. Ownership passes to you on delivery,
          provided full payment has been received.
        </p>
      </>
    ),
  },
  {
    id: "returns",
    title: "Returns after delivery",
    body: (
      <>
        <p>
          Please inspect your products on delivery. If a product arrives damaged or is not what you ordered, tell us within{" "}
          <strong>7 days</strong> of delivery with your order number and photos, so we can claim against the delivery company. If a
          product is faulty or does not match its description, tell us as soon as you notice; the{" "}
          <a className="link" href="#warranty">Limited warranty</a> and your statutory rights apply, and this 7-day window does not
          limit them. We will, at our cost, repair or replace the product, or refund the price paid for it.
        </p>
        <p>
          Change-of-mind returns after delivery are not accepted, except where the law requires otherwise. Returned products must be
          complete, with accessories and packaging where reasonably possible.
        </p>
      </>
    ),
  },
  {
    id: "warranty",
    title: "Limited warranty",
    body: (
      <>
        <p>
          We warrant that each product will be free from defects in materials and workmanship under normal use for{" "}
          <strong>12 months</strong> from delivery. If a covered defect appears, we will repair it, replace the product, or refund the
          price paid, at our option.
        </p>
        <p>The warranty does not cover:</p>
        <ul>
          <li>normal wear and tear, cosmetic damage, or gradual battery capacity loss consistent with normal ageing;</li>
          <li>damage from accidents, misuse, liquid, power surges, lightning, improper installation or mounting, or use outside published operating conditions;</li>
          <li>products opened, modified or repaired by anyone other than us or our authorised agents;</li>
          <li>third-party software, SIM cards, internet service, or network coverage.</li>
        </ul>
        <p className="key">
          Except for this limited warranty and your statutory rights, the products are supplied without other express warranties, and
          to the extent permitted by law we exclude implied warranties of fitness for a particular purpose.
        </p>
      </>
    ),
  },
  {
    id: "network",
    title: "Network, connectivity and installation",
    body: (
      <>
        <p>
          Routers and nodes connect you only where the Interlink network reaches, where any internet service they rely on is available,
          and where they can be set up properly. Speed, range, reliability and coverage depend on where you are, buildings and terrain,
          weather, power supply, other service providers and how many people are using the network, and are not guaranteed. Any figures we publish are typical results under
          test conditions.
        </p>
        <p>
          Rooftop and outdoor equipment must be installed safely and in compliance with building rules, landlord consent and any
          applicable regulation. You are responsible for obtaining permissions for installation at your premises. Installation work
          involving height or electrical connections should be done by a qualified installer.
        </p>
        <p>
          Network services, built-in software and app features may be provided under separate terms, and may change, be suspended or be
          discontinued. Your purchase of hardware does not include a right to any particular network service.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <>
        <p className="key">
          To the fullest extent permitted by law: (a) our total liability arising out of or in connection with any order, whether in
          contract, tort (including negligence), statute or otherwise, is limited to the total amount you paid us for that order; and
          (b) we are not liable for any loss of profit, revenue, business, data, opportunity or goodwill, or for any indirect, special,
          incidental or consequential loss.
        </p>
        <p>
          Nothing in these Terms limits or excludes liability for death or personal injury caused by negligence, for fraud, or for any
          liability that cannot be limited or excluded by law.
        </p>
      </>
    ),
  },
  {
    id: "force-majeure",
    title: "Events outside our control",
    body: (
      <p>
        We are not in breach of these Terms, and not liable for delay or failure to perform, to the extent caused by events beyond our
        reasonable control. These include component shortages, manufacturing or supplier failures, port, customs or shipping delays,
        changes in law or regulation, delays in regulatory approval, currency or foreign-exchange restrictions, power or
        telecommunications failures, strikes, epidemics, civil unrest, fire, flood or acts of government. Your rights to cancel for a
        refund under these Terms are not affected.
      </p>
    ),
  },
  {
    id: "conduct",
    title: "Fraud, chargebacks and misuse",
    body: (
      <p>
        You confirm that the funds you use are yours or that you are authorised to use them, and that the information you give us is
        accurate. If a payment is reversed, recalled or disputed through your bank after we have accepted your order, we may suspend
        or cancel the order until the matter is resolved. You agree to indemnify us for reasonable costs we incur because of a
        fraudulent payment or false information you provide.
      </p>
    ),
  },
  {
    id: "statutory",
    title: "Your statutory rights",
    body: (
      <p>
        These Terms are subject to your rights under the Federal Competition and Consumer Protection Act 2018 and other applicable
        Nigerian law. Nothing in these Terms removes or reduces any right that the law says cannot be excluded, including your right
        to return defective goods or goods that do not match their description. Where any clause would do so, it applies only to the
        extent the law allows.
      </p>
    ),
  },
  {
    id: "privacy",
    title: "Your information",
    body: (
      <p>
        We use the personal information you give at checkout to process your order, take payment, deliver your products and
        contact you about your order, as described in our <Link className="link" href="/privacy">Privacy Notice</Link>, in line with
        the Nigeria Data Protection Act 2023. We share it with our payment partner and delivery providers only as needed for those
        purposes.
      </p>
    ),
  },
  {
    id: "disputes",
    title: "Complaints and disputes",
    body: (
      <>
        <p>
          If something goes wrong, please contact {site.supportEmail} first with your order number. We will acknowledge your complaint
          within 5 business days and try to resolve it within 30 days.
        </p>
        <p>
          These Terms are governed by the laws of the Federal Republic of Nigeria. If a dispute is not resolved within 30 days of your
          complaint, either party may refer it to mediation in Lagos and, if mediation fails, to arbitration in Lagos under the
          Arbitration and Mediation Act 2023 before a sole arbitrator. For claims by individual customers, we will pay the
          mediator’s and arbitrator’s fees, and each side pays its own lawyers. Disputes will be resolved on an individual basis and not as a
          class or representative action, to the extent permitted by law. Nothing in this clause stops you from making a complaint to
          the Federal Competition and Consumer Protection Commission or bringing a claim that falls within the jurisdiction of a small
          claims court.
        </p>
      </>
    ),
  },
  {
    id: "general",
    title: "General",
    body: (
      <ul>
        <li>These Terms, your order confirmation and our Privacy Notice are the entire agreement between us about your order.</li>
        <li>If any clause is found unenforceable, the rest of these Terms remain in effect and that clause applies to the extent it can.</li>
        <li>If we do not enforce a right immediately, we have not waived it.</li>
        <li>You may not transfer your order or your rights under these Terms without our written consent. We may transfer our rights and obligations to another company that takes over the presale, provided your rights are not reduced.</li>
        <li>We may send notices to the email address you used at checkout. Notices are treated as received 24 hours after sending.</li>
      </ul>
    ),
  },
];

export default function TermsPage() {
  return (
    <section className="page">
      <div className="wrap">
        <p className="small">
          Version {site.termsVersion} · {site.legalName}
        </p>
        <h1 className="h1 page-h" style={{ marginTop: 12 }}>
          Terms of Sale
        </h1>
        <p className="lede" style={{ marginTop: 24 }}>
          The short version: you are paying now for hardware that is still being made. Dispatch dates are estimates. You can cancel for
          a refund any time before we dispatch. The full terms below are the ones that apply.
        </p>
        <div className="legal">
          <nav className="legal-toc" aria-label="Sections">
            <ol>
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>
                    {String(i + 1).padStart(2, "0")}&nbsp;&nbsp;{s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="legal-body">
            {sections.map((s, i) => (
              <section key={s.id} aria-labelledby={s.id}>
                <h2 id={s.id}>
                  {i + 1}. {s.title}
                </h2>
                {s.body}
              </section>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
