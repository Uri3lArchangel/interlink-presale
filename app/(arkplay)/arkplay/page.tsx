import Image from "next/image";
import Link from "next/link";
import { BuildScene, BuyBox, HeroTurn } from "@/components/arkplay/home";
import { brands } from "@/lib/brands";
import { site } from "@/lib/site";

const brand = brands.arkplay;

const faqs = [
  {
    q: "When will my ArkPlay ship?",
    a: `${brand.batch} is estimated to dispatch in ${brand.estimatedDispatch}. Hardware schedules can move, so treat this as an estimate. We’ll email you if it changes, and again when your console leaves us.`,
  },
  {
    q: "What can I play on it?",
    a: "ArkPlay is built around Scripture: Bible stories and games you play with your hands, not just read. We’ll share the launch line-up before dispatch. If what ships is materially different from what you ordered, you can cancel for a full refund.",
  },
  {
    q: "Can I cancel?",
    a: `Yes, for any reason, until we send your dispatch notice. We refund the price you paid to the account it came from. If you cancel just because you changed your mind, the ${site.transactionFeePct}% transaction fee isn’t refunded; if we cause the cancellation, for example through a delay or a product change, you get everything back.`,
  },
  {
    q: "How do I pay?",
    a: `By bank transfer from any Nigerian bank, by card, bank app or USSD through Paystack, or in crypto (USDT, USDC, BTC, ETH, SOL and more) on the order page. A ${site.transactionFeePct}% transaction fee is added at checkout and shown before you pay. Checkout gives you an account number that belongs to your order alone. Send the exact total and your order confirms on its own, usually within a minute.`,
  },
  {
    q: "Can the price change after I pay?",
    a: `Not because our retail price goes up. The one exception: if exchange rates, import duties or tariffs raise our cost of supplying your order by more than ${site.presale.costAdjustThresholdPct}% before dispatch, we may ask for a cost adjustment. You choose whether to pay it or cancel for a full refund, and we never charge it without your agreement. Delivery is quoted separately before dispatch.`,
  },
  {
    q: "Is that what the final console looks like?",
    a: "The pictures and video are concept renders. Finish, colour, buttons and small details may change as manufacturing finishes.",
  },
];

export default function Home() {
  return (
    <>
      <section className="hero" aria-label="ArkPlay">
        <HeroTurn />
      </section>

      <section className="statement">
        <div className="wrap">
          <p>
            A handheld console built around Scripture. <span>Stories you step into, games you play with your hands, and a
            screen the whole family can gather round.</span>
          </p>
        </div>
      </section>

      <section id="inside" aria-labelledby="inside-title">
        <div className="wrap section-head">
          <h2 className="h2" id="inside-title">Small enough to carry. Built to be played.</h2>
          <p className="lede">Take it apart, put it back together. Scroll to see what’s inside.</p>
        </div>
        <BuildScene />
        <p className="small wrap note-center">Concept render. Final specifications are confirmed before dispatch.</p>
      </section>

      <section className="section" id="buy" aria-labelledby="buy-title">
        <div className="wrap buy-grid">
          <div className="buy-media">
            <Image
              src="/media/arkplay-console.jpg"
              alt="ArkPlay console, front view, with the ArkPlay logo on screen over mountains and palm trees"
              width={1600}
              height={750}
              sizes="(max-width: 900px) 100vw, 56vw"
            />
          </div>
          <div className="buy-panel glass">
            <p className="small">{brand.batch} · presale</p>
            <h2 className="h3" id="buy-title">ArkPlay</h2>
            <BuyBox />
            <ul className="perks">
              <li>Cancel any time before dispatch for a refund.</li>
              <li>Estimated dispatch: {brand.estimatedDispatch}.</li>
              <li>Pay by bank transfer, card or crypto. Delivery is quoted before we ship.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section" id="how" aria-labelledby="how-title">
        <div className="wrap">
          <div className="section-head">
            <h2 className="h2" id="how-title">Three steps to yours.</h2>
          </div>
          <ol className="steps-glass">
            <li className="glass">
              <h3>Check out</h3>
              <p>Tell us who you are and where to deliver. You lock in today’s presale price.</p>
            </li>
            <li className="glass">
              <h3>Pay</h3>
              <p>
                By bank transfer to an account made for your order, by card, or in crypto, within {site.presale.paymentWindowHours} hours.
              </p>
            </li>
            <li className="glass">
              <h3>Get your order number</h3>
              <p>We confirm by email as soon as the money lands, and write again before your ArkPlay ships.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="section" id="faq" aria-labelledby="faq-title">
        <div className="wrap faq">
          <div className="section-head">
            <h2 className="h2" id="faq-title">Questions</h2>
            <p className="lede">
              The full details are in the{" "}
              <Link className="link" href="/arkplay/terms">
                Terms of Sale
              </Link>
              .
            </p>
          </div>
          <div className="faq-list">
            {faqs.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
          <p className="small" style={{ marginTop: 32, textAlign: "center" }}>
            Still have a question? Email{" "}
            <a className="link" href={`mailto:${brand.supportEmail}`}>
              {brand.supportEmail}
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}
