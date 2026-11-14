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
    q: "Is the price fixed?",
    a: "Yes. What you pay now is the hardware price, even if the retail price goes up later. Delivery is quoted separately before dispatch.",
  },
  {
    q: "Are the pictures the final product?",
    a: "They’re concept renders. Finish, colour and small details may change as manufacturing and certification finish. If a change materially affects what you ordered, you can cancel for a full refund.",
  },
];

const lineup = [
  { id: "tier1-pro", label: "Desk routers", from: 120000, href: "#routers" },
  { id: "tier2-pro", label: "Rooftop nodes", from: 499999, href: "#routers", center: true },
  { id: "power-3", label: "PowerBanks", from: 29000, href: "#power" },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="hero-top">
            <h1 className="h1">Hardware for the Interlink network</h1>
            <div className="hero-side">
              <p className="lede">
                Reserve routers, rooftop nodes and PowerBanks from the first production run, at presale prices.
              </p>
              <div className="hero-actions">
                <Link href="#routers" className="btn btn-primary">
                  Shop the presale
                </Link>
                <Link href="#how" className="btn btn-quiet">
                  How paying works
                </Link>
              </div>
            </div>
          </div>

          <div className="case lineup">
            {lineup.map((item) => {
              const p = productById(item.id)!;
              const tall = item.id.startsWith("tier2");
              return (
                <a key={item.id} href={item.href} className={item.center ? "center" : undefined}>
                  <Image
                    className="case-img"
                    src={p.image}
                    alt={`${p.name}, concept render`}
                    width={tall ? 764 : 768}
                    height={tall ? 1024 : 768}
                    priority
                    sizes="(max-width: 560px) 50vw, 30vw"
                  />
                  <span className="placard">
                    <strong>{item.label}</strong>
                    <span>From {formatNaira(item.from)}</span>
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section" id="routers">
        <div className="wrap">
          <div className="section-head">
            <h2 className="h2">Routers and rooftop nodes</h2>
            <p className="lede">
              A desk router serves a home or office. A rooftop node carries the network down the street. Each comes in a standard and a
              Pro model.
            </p>
          </div>
          <div className="families">
            <Family
              standard="tier1"
              pro="tier1-pro"
              title="Tier 1 Router"
              intro="For the desk at home or in a small office."
            />
            <Family
              standard="tier2"
              pro="tier2-pro"
              title="Tier 2 Rooftop Node"
              intro="Weather-sealed and pole-mounted, for the roof."
            />
          </div>
        </div>
      </section>

      <section className="section" id="power">
        <div className="wrap">
          <div className="section-head">
            <h2 className="h2">PowerBanks</h2>
            <p className="lede">Five capacities in one design. Pick a size, then see how many times it charges your phone.</p>
          </div>
          <PowerPicker />
        </div>
      </section>

      <section className="section" id="how">
        <div className="wrap">
          <div className="section-head">
            <h2 className="h2">How paying works</h2>
            <p className="lede">One bank transfer reserves your hardware. There are no cards and no third-party checkout pages.</p>
          </div>
          <ol className="steps">
            <li>
              <h3>Check out</h3>
              <p>Tell us who you are and where to deliver. Your price is fixed from this point.</p>
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
              <p>
                We confirm by email as soon as the money lands. We’ll write again before your order ships.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="wrap faq">
          <div>
            <h2 className="h2">Questions</h2>
            <p className="lede" style={{ marginTop: 20 }}>
              The full details are in the{" "}
              <Link className="link" href="/terms">
                Terms of Sale
              </Link>
              . Anything else, write to{" "}
              <a className="link" href={`mailto:${site.supportEmail}`}>
                {site.supportEmail}
              </a>
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
        </div>
      </section>
    </>
  );
}
