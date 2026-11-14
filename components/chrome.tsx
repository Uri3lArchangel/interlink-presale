"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { MAX_QTY, formatNaira } from "@/lib/catalog";
import { useCart } from "./cart";

export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11.25" fill="none" stroke="currentColor" strokeWidth="1" opacity=".45" />
      <path d="M12 5.5 6 16.5h12Z" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="12" cy="5.5" r="1.7" fill="currentColor" />
      <circle cx="6" cy="16.5" r="1.7" fill="currentColor" />
      <circle cx="18" cy="16.5" r="1.7" fill="var(--accent)" />
    </svg>
  );
}

export function Header() {
  const { count, setOpen, ready } = useCart();
  const pathname = usePathname();
  const home = pathname === "/";
  return (
    <header className="header">
      <div className="wrap header-inner">
        <Link href="/" className="wordmark" aria-label="Interlink home">
          <Mark />
          Interlink
        </Link>
        <nav className="nav" aria-label="Primary">
          <Link href={home ? "#network" : "/#network"}>Network</Link>
          <Link href={home ? "#power" : "/#power"}>Power</Link>
          <Link href={home ? "#presale" : "/#presale"}>How it works</Link>
          <Link href={home ? "#faq" : "/#faq"}>FAQ</Link>
        </nav>
        <button className="bag-btn" onClick={() => setOpen(true)} aria-label={`Open bag, ${count} items`}>
          Bag
          <span className="bag-count" data-empty={!ready || count === 0}>
            {ready ? count : 0}
          </span>
        </button>
      </div>
    </header>
  );
}

export function Drawer() {
  const { lines, subtotal, open, setOpen, setQty, toast } = useCart();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      <dialog
        ref={ref}
        className="drawer"
        aria-labelledby="bag-title"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
      >
        <div className="drawer-head">
          <h2 id="bag-title">Your bag</h2>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close bag">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M1 1l12 12M13 1 1 13" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </button>
        </div>
        <div className="drawer-body">
          {lines.length === 0 ? (
            <div className="empty">
              <p>Your bag is empty.</p>
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
                Continue browsing
              </button>
            </div>
          ) : (
            lines.map((l) => (
              <div className="line" key={l.id}>
                <Image src={l.image} alt="" width={72} height={72} />
                <div>
                  <div className="line-name">{l.name}</div>
                  <div className="line-sub">{formatNaira(l.price)}</div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div className="stepper">
                      <button onClick={() => setQty(l.id, l.quantity - 1)} aria-label={`Remove one ${l.name}`}>
                        −
                      </button>
                      <span aria-live="polite">{l.quantity}</span>
                      <button
                        onClick={() => setQty(l.id, l.quantity + 1)}
                        disabled={l.quantity >= MAX_QTY}
                        aria-label={`Add one ${l.name}`}
                      >
                        +
                      </button>
                    </div>
                    <button className="remove" onClick={() => setQty(l.id, 0)}>
                      Remove
                    </button>
                  </div>
                </div>
                <div className="price">{formatNaira(l.price * l.quantity)}</div>
              </div>
            ))
          )}
        </div>
        {lines.length > 0 && (
          <div className="drawer-foot">
            <div className="sum">
              <span>Subtotal</span>
              <strong>{formatNaira(subtotal)}</strong>
            </div>
            <p className="fine">Delivery is quoted before dispatch. Presale items ship in the order reservations are paid.</p>
            <Link href="/checkout" className="btn btn-primary btn-block" onClick={() => setOpen(false)}>
              Reserve and pay <span className="arrow">→</span>
            </Link>
          </div>
        )}
      </dialog>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}

export function AddButton({ id, label = "Reserve", className = "btn btn-primary" }: { id: string; label?: string; className?: string }) {
  const { add } = useCart();
  return (
    <button className={className} onClick={() => add(id)}>
      {label} <span className="arrow">→</span>
    </button>
  );
}

/** Fades sections in as they scroll into view. Content stays visible without JavaScript. */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight) continue; // already on screen, don't hide it
      el.classList.add("reveal");
      io.observe(el);
    }
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
