import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { CartProvider } from "@/components/cart";
import { Drawer, Header, Mark, RevealObserver } from "@/components/chrome";
import { site } from "@/lib/site";
import "./globals.css";

const serif = Instrument_Serif({ weight: "400", style: ["normal", "italic"], subsets: ["latin"], variable: "--font-serif" });
const sans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Interlink — Presale", template: "%s · Interlink" },
  description: "Reserve Interlink routers, rooftop nodes and PowerBanks in the first presale batch.",
  openGraph: { title: "Interlink — Presale", images: ["/products/tier2-pro.webp"] },
};

export const viewport: Viewport = { themeColor: "#0b0a09" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <CartProvider>
          <div className="notice">
            <div className="wrap">
              <span className="dot" aria-hidden="true" />
              <span>Presale open · {site.presale.batch}</span>
              <span className="hide-sm">Estimated dispatch {site.presale.estimatedDispatch}</span>
              <span className="hide-sm">Cancel any time before dispatch</span>
            </div>
          </div>
          <Header />
          <main>{children}</main>
          <Footer />
          <Drawer />
          <RevealObserver />
        </CartProvider>
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-top">
          <div>
            <Link href="/" className="wordmark" aria-label="Interlink home">
              <Mark /> Interlink
            </Link>
            <p className="fine" style={{ maxWidth: "30em", marginTop: 20 }}>
              Product images are concept renders. Final hardware may differ in finish and detail. Prices are in Nigerian naira and
              include VAT where applicable.
            </p>
          </div>
          <div>
            <h4>Presale</h4>
            <ul>
              <li><Link href="/#network">Routers & nodes</Link></li>
              <li><Link href="/#power">PowerBanks</Link></li>
              <li><Link href="/#presale">How it works</Link></li>
              <li><Link href="/#faq">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><Link href="/terms">Terms of Sale</Link></li>
              <li><Link href="/privacy">Privacy Notice</Link></li>
              <li><a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-mark" aria-hidden="true">Interlink</div>
        <div className="footer-legal">
          <span>© {new Date().getFullYear()} {site.legalName} · {site.rcNumber}</span>
          <span>{site.address}</span>
        </div>
      </div>
    </footer>
  );
}
