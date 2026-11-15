import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./(interlink)/globals.css";

// Used for URLs that match no route at all. The app has two root layouts (Interlink and ArkPlay),
// so this page brings its own <html>, fonts and styles.
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function GlobalNotFound() {
  return (
    <html lang="en-NG" className={jakarta.variable}>
      <body>
        <main>
          <section className="page">
            <div className="wrap">
              <h1 className="h1 page-h">Page not found</h1>
              <p className="lede" style={{ marginTop: 24 }}>
                The page doesn’t exist, or the order link is incomplete. Order links are in your confirmation email.
              </p>
              <p style={{ marginTop: 32, display: "flex", gap: 14, flexWrap: "wrap" }}>
                <a href="/" className="btn btn-primary">Interlink store</a>
                <a href="/arkplay" className="btn btn-quiet">ArkPlay store</a>
              </p>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
