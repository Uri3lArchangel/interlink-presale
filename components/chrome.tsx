"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MAX_QTY, formatNaira } from "@/lib/catalog";
import { useCart } from "./cart";

/** The Interlink "in" mark (silver on graphite), from the LinkBrowser app's icon. */
export function Mark({ size = 28 }: { size?: number }) {
  return <Image src="/brand/interlink-mark.png" alt="" width={size} height={size} priority />;
}

export function Header() {
  const { count, setOpen, ready } = useCart();
  const home = usePathname() === "/";
  const href = (id: string) => (home ? `#${id}` : `/#${id}`);
  return (
    <header className="header">
      <div className="wrap header-inner">
        <Link href="/" className="wordmark" aria-label="Interlink home">
          <Mark />
          Interlink
        </Link>
        <nav className="nav" aria-label="Primary">
          <Link href={href("routers")}>Routers</Link>
          <Link href={href("power")}>PowerBanks</Link>
          <Link href={href("how")}>How paying works</Link>
          <Link href={href("faq")}>Questions</Link>
          <Link href="/terms">Terms</Link>
        </nav>
        <button className="bag-btn" onClick={() => setOpen(true)} aria-label={`Bag, ${count} items`}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
            <path d="M3 5.5h12l-.8 10a1 1 0 0 1-1 .9H4.8a1 1 0 0 1-1-.9z" />
            <path d="M6.2 5.5V4.6a2.8 2.8 0 0 1 5.6 0v.9" />
          </svg>
          <span className="bag-count" data-full={ready && count > 0}>
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
          <h2 id="bag-title">Bag</h2>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close bag">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M1 1l10 10M11 1 1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="drawer-body">
          {lines.length === 0 ? (
            <div className="empty">
              <p style={{ margin: 0 }}>Nothing reserved yet. Add a router or PowerBank to start.</p>
              <button className="btn btn-quiet btn-sm" onClick={() => setOpen(false)}>
                Keep browsing
              </button>
            </div>
          ) : (
            lines.map((l) => (
              <div className="line" key={l.id}>
                <div className="thumb">
                  <Image src={l.image} alt="" width={76} height={76} />
                </div>
                <div>
                  <div className="line-name">{l.name}</div>
                  <div className="line-sub">{formatNaira(l.price)} each</div>
                  <div className="line-controls">
                    <div className="stepper">
                      <button onClick={() => setQty(l.id, l.quantity - 1)} aria-label={`One fewer ${l.name}`}>
                        −
                      </button>
                      <span aria-live="polite">{l.quantity}</span>
                      <button
                        onClick={() => setQty(l.id, l.quantity + 1)}
                        disabled={l.quantity >= MAX_QTY}
                        aria-label={`One more ${l.name}`}
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
            <p className="small">Delivery is quoted before dispatch. You can cancel for a refund until then.</p>
            <Link href="/checkout" className="btn btn-primary btn-block" onClick={() => setOpen(false)}>
              Check out
            </Link>
          </div>
        )}
      </dialog>
      {toast && (
        <div className="toast" role="status">
          <span className="led" aria-hidden="true" />
          {toast}
        </div>
      )}
    </>
  );
}

export function AddButton({ id, className = "btn btn-primary" }: { id: string; className?: string }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  return (
    <button
      className={className}
      onClick={() => {
        add(id);
        setAdded(true);
        setTimeout(() => setAdded(false), 1400);
      }}
    >
      {added ? "Added to bag" : "Add to bag"}
    </button>
  );
}
