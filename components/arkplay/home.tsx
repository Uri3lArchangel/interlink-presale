"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MAX_QTY, arkplayConsole as consoleProduct, formatEspees, formatNaira } from "@/lib/catalog";
import { useCart } from "../cart";

/** The launch teaser in a console-style bezel. Pauses itself for people who prefer less motion. */
export function Teaser() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ref.current?.pause();
      setPlaying(false);
    }
  }, []);

  return (
    <div className="bezel">
      <video
        ref={ref}
        className="bezel-screen"
        src="/media/arkplay-teaser.mp4"
        poster="/media/arkplay-teaser-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        aria-label="ArkPlay teaser: the console comes apart to show its parts, then the ArkPlay logo"
      />
      <span className="bezel-dpad" aria-hidden="true" />
      <button
        className="bezel-btn"
        onClick={() => {
          const v = ref.current;
          if (!v) return;
          if (v.paused) {
            v.play();
            setPlaying(true);
          } else {
            v.pause();
            setPlaying(false);
          }
        }}
        aria-label={playing ? "Pause video" : "Play video"}
      >
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <rect x="2" y="1" width="3.5" height="12" rx="1" fill="currentColor" />
            <rect x="8.5" y="1" width="3.5" height="12" rx="1" fill="currentColor" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M3 1.5v11l9.5-5.5z" fill="currentColor" />
          </svg>
        )}
      </button>
    </div>
  );
}

/** Pick how many, then go straight to checkout. */
export function BuyBox() {
  const p = consoleProduct;
  const { lines, setQty, add } = useCart();
  const router = useRouter();
  const [qty, setLocal] = useState(1);
  const inBag = lines.find((l) => l.id === p.id)?.quantity ?? 0;

  return (
    <div className="buy">
      <div className="buy-price">
        <span className="price-big">{formatNaira(p.price * qty)}</span>
        <span className="small">≈ {formatEspees(p.price * qty)}</span>
      </div>
      <div className="qty" role="group" aria-label="How many consoles">
        <button onClick={() => setLocal((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="One fewer">
          −
        </button>
        <output aria-live="polite">
          {qty} <span>{qty === 1 ? "console" : "consoles"}</span>
        </output>
        <button onClick={() => setLocal((q) => Math.min(MAX_QTY, q + 1))} disabled={qty >= MAX_QTY} aria-label="One more">
          +
        </button>
      </div>
      <div className="buy-actions">
        <button
          className="btn btn-primary btn-press"
          onClick={() => {
            setQty(p.id, qty);
            router.push("/arkplay/checkout");
          }}
        >
          Reserve {qty === 1 ? "yours" : `${qty} consoles`}
        </button>
        <button
          className="btn btn-quiet"
          onClick={() => {
            for (let i = 0; i < qty; i++) add(p.id);
          }}
        >
          Add to bag
        </button>
      </div>
      {inBag > 0 && <p className="small">You have {inBag} in your bag.</p>}
    </div>
  );
}
