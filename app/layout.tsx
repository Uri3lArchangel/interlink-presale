import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import { CartProvider } from "@/components/cart";
import { Drawer, Header } from "@/components/chrome";
import { formatNaira, testPrice } from "@/lib/catalog";
import { site } from "@/lib/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Interlink presale", template: "%s | Interlink" },
  description: "Reserve Interlink routers, rooftop nodes and PowerBanks from the first batch.",
  openGraph: { title: "Interlink presale", images: ["/products/tier2-pro.webp"] },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className={jakarta.variable}>
      <body>
        <CartProvider>
          {testPrice > 0 && (
            <div className="banner" role="status">
              <div className="wrap">
                <span className="led" aria-hidden="true" />
                <span>Test pricing is on: every item costs {formatNaira(testPrice)} while we test payments.</span>
              </div>
            </div>
          )}
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
        <p className="footer-note">
          Product images are concept renders; final hardware may differ in finish and detail. Prices are in Nigerian naira and include
          VAT where it applies. Dispatch dates are estimates. See the <Link href="/terms">Terms of Sale</Link> for cancellation and
          refund rights.
        </p>
        <div className="footer-top">
          <div>
            <h2>Shop</h2>
            <ul>
              <li><Link href="/#routers">Routers and nodes</Link></li>
              <li><Link href="/#power">PowerBanks</Link></li>
              <li><Link href="/#how">How paying works</Link></li>
            </ul>
          </div>
          <div>
            <h2>Help</h2>
            <ul>
              <li><Link href="/#faq">Questions</Link></li>
              <li><a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a></li>
            </ul>
          </div>
          <div>
            <h2>Legal</h2>
            <ul>
              <li><Link href="/terms">Terms of Sale</Link></li>
              <li><Link href="/privacy">Privacy Notice</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-legal">
          <span>
            Copyright © {new Date().getFullYear()} {site.legalName}, {site.rcNumber}. All rights reserved.
          </span>
          <span>{site.address}</span>
        </div>
      </div>
    </footer>
  );
}
