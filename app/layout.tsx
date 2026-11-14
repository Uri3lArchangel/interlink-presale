import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Archivo } from "next/font/google";
import { CartProvider } from "@/components/cart";
import { Drawer, Header, Mark } from "@/components/chrome";
import { site } from "@/lib/site";
import "./globals.css";

// One variable family: the width axis gives expanded headlines and normal-width body text.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Interlink presale", template: "%s | Interlink" },
  description: "Reserve Interlink routers, rooftop nodes and PowerBanks from the first production run.",
  openGraph: { title: "Interlink presale", images: ["/products/tier2-pro.webp"] },
};

export const viewport: Viewport = { themeColor: "#e4e5e1" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className={archivo.variable}>
      <body>
        <CartProvider>
          <div className="banner">
            <div className="wrap">
              <span className="led" aria-hidden="true" />
              <span>Presale open. Estimated dispatch {site.presale.estimatedDispatch}.</span>
            </div>
          </div>
          <Header />
          <main>{children}</main>
          <Footer />
          <Drawer />
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
            <p className="small" style={{ maxWidth: "30em", marginTop: 18, color: "inherit" }}>
              Product images are concept renders, and final hardware may differ in finish and detail. Prices are in naira and include
              VAT where it applies.
            </p>
          </div>
          <div>
            <h2>Shop</h2>
            <ul>
              <li><Link href="/#routers">Routers and nodes</Link></li>
              <li><Link href="/#power">PowerBanks</Link></li>
              <li><Link href="/#how">How paying works</Link></li>
              <li><Link href="/#faq">Questions</Link></li>
            </ul>
          </div>
          <div>
            <h2>Help</h2>
            <ul>
              <li><Link href="/terms">Terms of Sale</Link></li>
              <li><Link href="/privacy">Privacy Notice</Link></li>
              <li><a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-legal">
          <span>
            © {new Date().getFullYear()} {site.legalName}, {site.rcNumber}
          </span>
          <span>{site.address}</span>
        </div>
      </div>
    </footer>
  );
}
