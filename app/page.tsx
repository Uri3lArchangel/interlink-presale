import Image from "next/image";
import Link from "next/link";
import { AddButton } from "@/components/chrome";
import { PowerPicker } from "@/components/power-picker";
import { formatNaira, productById, routers } from "@/lib/catalog";
import { site } from "@/lib/site";

const faqs = [
  {
    q: "When will my order ship?",
    a: `We are currently estimating ${site.presale.estimatedDispatch} for ${site.presale.batch}. Hardware schedules can move, so this is an estimate, not a promise. We will email you with any change and again when your order is dispatched.`,
  },
  {
    q: "Can I cancel my reservation?",
    a: "Yes. You can cancel at any time before we send your dispatch notice and we will refund what you paid to the account it came from. If dispatch has not started within the long-stop period in our Terms, you can also cancel for a full refund.",
  },
  {
    q: "How do I pay?",
    a: "By bank transfer. At checkout we create a dedicated account number for your order through our payment partner. Transfer the exact total from any Nigerian bank and your order is confirmed automatically, usually within a minute.",
  },
  {
    q: "Is the price locked in?",
    a: "Yes. The price you pay at reservation is the price of the hardware, even if the retail price changes later. Delivery is quoted separately before dispatch.",
  },
  {
    q: "Do the images show the final product?",
    a: "They are concept renders. The final hardware may differ in finish, colour and minor detail as we complete manufacturing and certification. Any change that materially affects what you ordered gives you the right to cancel for a full refund.",
  },
];

export default function Home() {
  const hero = productById("tier2-pro")!;
  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <div className="hero-in">
              <p className="eyebrow">
                <b>●</b>&nbsp; Interlink Presale — {site.presale.batch}
              </p>
              <h1 className="display">
                Hardware for
                <br />
                <em>staying</em> connected.
              </h1>
              <p className="lede">
                Desk routers, rooftop nodes and personal power, made for the Interlink network. Reserve yours from the first
                production batch at presale pricing.
              </p>
              <div className="hero-actions">
                <Link href="#network" className="btn btn-primary">
                  Explore the hardware <span className="arrow">→</span>
                </Link>
                <Link href="#presale" className="btn btn-ghost">
                  How the presale works
                </Link>
              </div>
            </div>
            <dl className="hero-meta">
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
          <div className="hero-media">
            <Image
              src={hero.image}
              alt={`${hero.name}, concept render`}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 50vw"
              className="fade-in"
            />
            <div className="hero-caption">
              <p className="eyebrow">{hero.name}</p>
              <p className="price" style={{ margin: "6px 0 0" }}>
                {formatNaira(hero.price)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="network">
        <div className="wrap">
          <div className="section-head" data-reveal>
            <p className="eyebrow">01 — Network</p>
            <h2 className="display">
              Routers <em>&amp;</em> nodes
            </h2>
            <p className="lede">
              Two tiers. Tier 1 sits on a desk and serves a home or office. Tier 2 goes on the roof and carries the network down the
              street.
            </p>
          </div>
          <div className="rows">
            {routers.map((p, n) => (
              <article className="row" key={p.id} data-reveal>
                <span className="row-index">0{n + 1}</span>
                <div className="row-copy">
                  <span className="tag">
                    {p.line} · Tier {p.id.startsWith("tier1") ? "1" : "2"}
                    {p.pro && <span className="pro">Pro</span>}
                  </span>
                  <h3>{p.name}</h3>
                  <p>{p.summary}</p>
                  <div className="row-buy">
                    <AddButton id={p.id} />
                    <span className="price">{formatNaira(p.price)}</span>
                  </div>
                </div>
                <div className="row-media">
                  <Image src={p.image} alt={`${p.name}, concept render`} fill sizes="(max-width: 900px) 100vw, 45vw" />
                  <span className="note">Concept render</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="power">
        <div className="wrap">
          <div className="section-head" data-reveal>
            <p className="eyebrow">02 — Power</p>
            <h2 className="display">
              Power, <em>personal.</em>
            </h2>
            <p className="lede">
              Five capacities, one design. A fingerprint lock keeps it yours, and the display tells you exactly what’s left.
            </p>
          </div>
          <div data-reveal>
            <PowerPicker />
          </div>
        </div>
      </section>

      <section className="section" id="presale">
        <div className="wrap">
          <div className="section-head" data-reveal>
            <p className="eyebrow">03 — The presale</p>
            <h2 className="display">
              How it <em>works.</em>
            </h2>
            <p className="lede">Reserve today, pay once by bank transfer, and keep your place in the first batch.</p>
          </div>
          <div className="steps" data-reveal>
            <div className="step">
              <div className="num">i.</div>
              <h3>Reserve</h3>
              <p>Choose your hardware and tell us where to deliver it. Prices are locked at the presale rate.</p>
            </div>
            <div className="step">
              <div className="num">ii.</div>
              <h3>Pay by transfer</h3>
              <p>
                We issue a dedicated account number for your order. Transfer the exact amount within {site.presale.paymentWindowHours}{" "}
                hours and you’ll receive an email confirmation with your order number.
              </p>
            </div>
            <div className="step">
              <div className="num">iii.</div>
              <h3>We build, then ship</h3>
              <p>
                Batch 01 is estimated to dispatch in {site.presale.estimatedDispatch}. We email you with progress, and you can cancel for a
                refund any time before dispatch.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="wrap faq">
          <div data-reveal>
            <p className="eyebrow">04 — Questions</p>
            <h2 className="display" style={{ marginTop: 24 }}>
              Before you <em>reserve.</em>
            </h2>
            <p className="lede" style={{ marginTop: 24 }}>
              Everything else is in the <Link className="link" href="/terms">Terms of Sale</Link>. Still unsure? Write to{" "}
              <a className="link" href={`mailto:${site.supportEmail}`}>
                {site.supportEmail}
              </a>
              .
            </p>
          </div>
          <div className="faq-list" data-reveal>
            {faqs.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
