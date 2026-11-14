import Image from "next/image";
import Link from "next/link";
import { Family } from "@/components/family";
import { PowerPicker } from "@/components/power-picker";
import { formatNaira, productById } from "@/lib/catalog";
import { site } from "@/lib/site";

const faqs = [
  {
    q: "When will my order ship?",
    a: `${site.presale.batch} is estimated to dispatch in ${site.presale.estimatedDispatch}. Hardware schedules can move, so treat this as an estimate. We’ll email you if it changes, and again when your order leaves us.`,
  },
  {
    q: "Can I cancel?",
    a: "Yes, for any reason, until we send your dispatch notice. We refund what you paid to the account it came from. If dispatch is badly delayed, you can cancel even later.",
  },
  {
    q: "How do I pay?",
    a: "By bank transfer from any Nigerian bank. Checkout gives you an account number that belongs to your order alone. Send the exact total and your order confirms on its own, usually within a minute.",
  },
  {
    q: "Can the price change after I pay?",
    a: `Not because our retail price goes up. The one exception: if exchange rates, import duties or tariffs raise our cost of supplying your order by more than ${site.presale.costAdjustThresholdPct}% before dispatch, we may ask for a cost adjustment. You choose whether to pay it or cancel for a full refund, and we never charge it without your agreement. Delivery is quoted separately before dispatch.`,
  },
  {
    q: "Are the pictures the final product?",
    a: "They’re concept renders. Finish, colour and small details may change as manufacturing and certification finish. If a change materially affects what you ordered, you can cancel for a full refund.",
  },
];

const Icon = ({ d }: { d: string }) => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const reasons = [
  {
    title: "Presale pricing",
    body: "Pay today’s presale price. If import costs ever force a change, you decide: pay it or cancel for a full refund.",
    icon: "M8 18V12a12 12 0 0 1 24 0v6M6 18h28v16H6zM20 24v4",
  },
  {
    title: "Cancel before dispatch",
    body: "Changed your mind? Cancel any time before your dispatch notice for a full refund.",
    icon: "M8 20a12 12 0 1 0 4-9M8 6v6h6",
  },
  {
    title: "Pay by bank transfer",
    body: "No card needed. You get an account number made for your order alone.",
    icon: "M5 16h30M8 16v14M16 16v14M24 16v14M32 16v14M4 34h32M20 4 4 12h32Z",
  },
  {
    title: "First production run",
    body: `${site.presale.batch} ships from an estimated ${site.presale.estimatedDispatch}, ahead of general sale.`,
    icon: "M4 30h22M26 30V14h6l4 8v8h-10M4 12h22v18M10 34a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM30 34a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  },
];

export default function Home() {
  const hero = productById("tier2-pro")!;
  return (
    <>
      <section className="hero dark">
        <div className="wrap">
          <p className="kicker">Presale now open</p>
          <h1 className="h1">
            The network,
            <br />
            in your hands.
          </h1>
          <p className="lede">
            Routers, rooftop nodes and PowerBanks for the Interlink network. Reserve yours from the first production run.
          </p>
          <div className="actions">
            <Link href="#routers" className="btn btn-primary">
              Shop the presale
            </Link>
            <Link href="#how" className="more">
              How paying works
            </Link>
          </div>
          <Image
            className="hero-img"
            src={hero.image}
            alt={`${hero.name}, concept render`}
            width={764}
            height={1024}
            priority
            sizes="(max-width: 700px) 86vw, 560px"
          />
          <dl className="hero-facts">
            <div>
              <dt>Batch</dt>
              <dd>01</dd>
            </div>
            <div>
              <dt>Est. dispatch</dt>
              <dd>{site.presale.estimatedDispatch}</dd>
            </div>
            <div>
              <dt>From</dt>
              <dd>{formatNaira(29000)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section id="routers" className="wrap tiles" aria-label="Routers and rooftop nodes">
        <Family
          wide
          standard="tier2"
          pro="tier2-pro"
          title="Tier 2 Rooftop Node"
          tagline="Carries the network down the street."
        />
        <Family standard="tier1" pro="tier1-pro" title="Tier 1 Router" tagline="The network, at your desk." />
        <article className="case tile">
          <h3 className="h3">Personal PowerBank</h3>
          <p className="lede">Five sizes. One fingerprint.</p>
          <div className="tile-buy" style={{ marginTop: 22 }}>
            <span className="price">From {formatNaira(29000)}</span>
            <Link href="#power" className="btn btn-primary">
              Choose a size
            </Link>
          </div>
          <div className="tile-media">
            <Image
              className="case-img"
              src="/products/power-3.webp"
              alt="Personal PowerBank, concept render"
              width={512}
              height={512}
              sizes="(max-width: 860px) 90vw, 40vw"
            />
          </div>
        </article>
      </section>

      <section className="section" id="power">
        <div className="wrap">
          <div className="section-head">
            <h2 className="h2">Which PowerBank is right for you?</h2>
            <p className="lede">Pick a capacity, set your phone’s battery, and see how many full charges you get.</p>
          </div>
          <PowerPicker />
        </div>
      </section>

      <section className="section grey">
        <div className="wrap">
          <div className="section-head" style={{ textAlign: "left", marginLeft: 0 }}>
            <h2 className="h2">Why reserve now.</h2>
          </div>
          <div className="reasons">
            {reasons.map((r) => (
              <div className="reason" key={r.title}>
                <Icon d={r.icon} />
                <h3>{r.title}</h3>
                <p>{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="how">
        <div className="wrap">
          <div className="section-head">
            <h2 className="h2">How paying works.</h2>
            <p className="lede">One bank transfer reserves your hardware.</p>
          </div>
          <ol className="steps">
            <li>
              <h3>Check out</h3>
              <p>Tell us who you are and where to deliver. You pay today’s presale price.</p>
            </li>
            <li>
              <h3>Transfer the total</h3>
              <p>
                You get an account number made for your order. Send the exact amount within {site.presale.paymentWindowHours} hours from
                any Nigerian bank.
              </p>
            </li>
            <li>
              <h3>Get your order number</h3>
              <p>We confirm by email as soon as the money lands, and write again before your order ships.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="section grey" id="faq">
        <div className="wrap faq">
          <div className="section-head">
            <h2 className="h2">Questions? Answers.</h2>
            <p className="lede">
              The full details are in the{" "}
              <Link className="link" href="/terms">
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
            <a className="link" href={`mailto:${site.supportEmail}`}>
              {site.supportEmail}
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}
