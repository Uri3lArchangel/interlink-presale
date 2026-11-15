import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Silkscreen } from "next/font/google";
import { CartProvider } from "@/components/cart";
import { Drawer, Header } from "@/components/arkplay/chrome";
import { brands } from "@/lib/brands";
import { NGN_PER_ESPEE, formatNaira, testPrice } from "@/lib/catalog";
import { site } from "@/lib/site";
import "./arkplay.css";

const brand = brands.arkplay;

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-body" });
const pixel = Silkscreen({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-pixel" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "ArkPlay presale", template: "%s | ArkPlay" },
  description: "Reserve ArkPlay, the handheld console that makes Scripture something you play. First batch now open.",
  openGraph: { title: "ArkPlay presale", images: ["/media/arkplay-console.jpg"] },
};

export const viewport: Viewport = { themeColor: "#0e0b1f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className={`${bricolage.variable} ${pixel.variable}`}>
      <body>
        <CartProvider store="arkplay">
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
          Images and video are concept renders; the final console may differ in finish, controls and detail. Prices are in Nigerian naira and include
          VAT where it applies. Espees amounts are a guide at ₦{NGN_PER_ESPEE.toLocaleString("en-NG")} per Espee; you pay in naira by
          bank transfer, or in crypto. Dispatch dates are estimates. See the <Link href="/arkplay/terms">Terms of Sale</Link> for cancellation and
          refund rights.
        </p>
        <div className="footer-top">
          <div>
            <h2>Shop</h2>
            <ul>
              <li><Link href="/arkplay#buy">Reserve ArkPlay</Link></li>
              <li><Link href="/arkplay#inside">What&rsquo;s inside</Link></li>
              <li><Link href="/arkplay#how">How paying works</Link></li>
              <li><a href="/">Interlink routers</a></li>
            </ul>
          </div>
          <div>
            <h2>Help</h2>
            <ul>
              <li><Link href="/arkplay#faq">Questions</Link></li>
              <li><a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a></li>
            </ul>
          </div>
          <div>
            <h2>Legal</h2>
            <ul>
              <li><Link href="/arkplay/terms">Terms of Sale</Link></li>
              <li><Link href="/arkplay/privacy">Privacy Notice</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-legal">
          <span>
            ArkPlay is sold by {site.legalName}. Copyright © {new Date().getFullYear()} {site.legalName}, {site.rcNumber}.
            All rights reserved.
          </span>
          <span>{site.address}</span>
        </div>
      </div>
    </footer>
  );
}
