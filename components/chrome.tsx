"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MAX_QTY, formatNaira } from "@/lib/catalog";
import { useCart } from "./cart";

/** Three linked nodes, one lit: the network with a device on it. */
export function Mark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="7" fill="currentColor" />
      <path d="M12 6.5 6.8 16h10.4Z" fill="none" stroke="var(--page, #e4e5e1)" strokeWidth="1.3" opacity=".6" />
      <circle cx="12" cy="6.5" r="2" fill="var(--page, #e4e5e1)" />
      <circle cx="6.8" cy="16" r="2" fill="var(--page, #e4e5e1)" />
      <circle cx="17.2" cy="16" r="2" fill="#1761e8" />
    </svg>
  );
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
        </nav>
        <button className="bag-btn" onClick={() => setOpen(true)} aria-label={`Bag, ${count} items`}>
          Bag
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
