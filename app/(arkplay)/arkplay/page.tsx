import Image from "next/image";
import Link from "next/link";
import { BuyBox, Teaser } from "@/components/arkplay/home";
import { arkplayConsole as consoleProduct, formatNaira } from "@/lib/catalog";
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

const parts = [
  { colour: "sun", title: "Two grips", body: "A stick, a D-pad and four face buttons, split across both hands like a proper handheld." },
  { colour: "palm", title: "A wide screen", body: "Sits in the middle, so stories and games have room to breathe." },
  { colour: "berry", title: "A built-in battery", body: "Charge it up and take it to church, school or the back seat of the car." },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="chip">
              <span className="led" aria-hidden="true" />
              {brand.batch} presale is open
            </span>
            <h1 className="h1">Bible stories you can play.</h1>
            <p className="lede">
              ArkPlay is a handheld console made for your blessed hands. A new way to experience Scripture, for kids, teens and anyone
              who still loves a good game.
            </p>
            <div className="hero-actions">
              <a href="#buy" className="btn btn-primary btn-press">
                Reserve for {formatNaira(consoleProduct.price)}
              </a>
              <a href="#inside" className="btn btn-ghost">
                See inside
              </a>
            </div>
          </div>
          <Teaser />
        </div>
      </section>

      <section className="section" id="buy">
        <div className="wrap buy-grid">
          <div className="sticker buy-media">
            <Image
              src="/media/arkplay-console.jpg"
              alt="ArkPlay console, front view, with the ArkPlay logo on screen over mountains and palm trees"
              width={1600}
              height={750}
              priority
              sizes="(max-width: 900px) 100vw, 58vw"
            />
          </div>
          <div className="buy-copy">
            <h2 className="h2">Get yours from the first batch.</h2>
            <p className="lede">One console, ready to play out of the box. Pay by bank transfer, card or crypto.</p>
            <BuyBox />
            <ul className="perks">
              <li>Cancel any time before dispatch for a refund.</li>
              <li>Estimated dispatch: {brand.estimatedDispatch}.</li>
              <li>Delivery is quoted before we ship.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section section-night" id="inside">
        <div className="wrap">
          <div className="section-head">
            <h2 className="h2">Small enough to carry. Built to be played.</h2>
            <p className="lede">A compact gaming experience, taken apart so you can see what you’re getting.</p>
          </div>
          <div className="inside-img">
            <Image
              src="/media/arkplay-inside.jpg"
              alt="ArkPlay taken apart: two controller grips, the screen, the main circuit board and the battery"
              width={1600}
              height={875}
              sizes="(max-width: 1200px) 100vw, 1100px"
            />
          </div>
          <ul className="parts">
            {parts.map((p) => (
              <li key={p.title} data-c={p.colour}>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </li>
            ))}
          </ul>
          <p className="small inside-note">Concept render. Final specifications are confirmed before dispatch.</p>
        </div>
      </section>

      <section className="section" id="how">
        <div className="wrap">
          <div className="section-head">
            <h2 className="h2">Three levels to your console.</h2>
            <p className="lede">Transfer, card or crypto. One payment reserves it.</p>
          </div>
          <ol className="levels">
            <li>
              <span className="lv">Lv 1</span>
              <h3>Check out</h3>
              <p>Tell us who you are and where to deliver. You lock in today’s presale price.</p>
            </li>
            <li>
              <span className="lv">Lv 2</span>
              <h3>Send the money</h3>
              <p>
                You get an account number made for your order. Send the exact amount within {site.presale.paymentWindowHours} hours, or pay
                by card or in crypto.
              </p>
            </li>
            <li>
              <span className="lv">Lv 3</span>
              <h3>Get your order number</h3>
              <p>We confirm by email as soon as the money lands, and write again before your ArkPlay ships.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="section section-tint" id="faq">
        <div className="wrap faq">
          <div className="section-head">
            <h2 className="h2">Questions? Answers.</h2>
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
