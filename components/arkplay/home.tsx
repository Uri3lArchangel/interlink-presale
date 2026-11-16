"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MAX_QTY, arkplayConsole as consoleProduct, formatEspees, formatNaira } from "@/lib/catalog";
import { useCart } from "../cart";
import { ScrollSequence, ramp } from "./sequence";

/** Opening scene: the console rises and turns to face you as you scroll. */
export function HeroTurn() {
  const p = consoleProduct;
  return (
    <ScrollSequence
      dir="/media/arkplay-seq/turn"
      count={82}
      lengthVh={260}
      still={82}
      zoom={0.82}
      label="The ArkPlay console turns to face you, showing its screen, two grips, sticks and buttons"
    >
      {(t) => (
        <>
          <div className="hero-copy" style={{ opacity: 1 - ramp(t, 0.04, 0.22), transform: `translateY(${-ramp(t, 0.04, 0.22) * 24}px)`, pointerEvents: t > 0.2 ? "none" : undefined }}>
            <Image src="/brand/arkplay-logo.png" alt="ArkPlay" width={150} height={62} priority className="hero-logo" />
            <h1 className="hero-title">Bible stories you can play.</h1>
            <div className="hero-actions">
              <a href="#buy" className="btn btn-primary">
                Reserve for {formatNaira(p.price)}
              </a>
              <FilmButton />
            </div>
          </div>
          <p className="hero-end" style={{ opacity: ramp(t, 0.72, 0.95), transform: `translateY(${(1 - ramp(t, 0.72, 0.95)) * 16}px)` }}>
            A compact gaming experience, made for your blessed hands.
          </p>
          <div className="scroll-cue" style={{ opacity: 1 - ramp(t, 0, 0.08) }} aria-hidden="true">
            Scroll
          </div>
        </>
      )}
    </ScrollSequence>
  );
}

const callouts = [
  { at: [0.04, 0.3], side: "left", title: "Two grips", body: "A stick, a D-pad and four face buttons, split across both hands." },
  { at: [0.32, 0.58], side: "right", title: "A built-in battery", body: "Charge it once and take it to church, school or the back seat." },
  { at: [0.62, 0.9], side: "left", title: "A wide screen", body: "Right in the middle, where stories and games have room to breathe." },
] as const;

/** Second scene: the console apart, then coming back together, with glass callouts. */
export function BuildScene() {
  return (
    <ScrollSequence
      dir="/media/arkplay-seq/build"
      count={95}
      lengthVh={340}
      still={95}
      fit="cover"
      label="ArkPlay taken apart into its grips, screen, circuit board and battery, then assembled again"
    >
      {(t) =>
        callouts.map((c) => {
          const o = Math.min(ramp(t, c.at[0], c.at[0] + 0.06), 1 - ramp(t, c.at[1] - 0.06, c.at[1]));
          return (
            <div
              key={c.title}
              className={`callout glass callout-${c.side}`}
              style={{ opacity: o, transform: `translateY(${(1 - o) * 18}px)`, visibility: o > 0.01 ? "visible" : "hidden" }}
            >
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          );
        })
      }
    </ScrollSequence>
  );
}

/** "Watch the film" opens the full teaser in a glass sheet. */
export function FilmButton() {
  const ref = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      video.current?.play().catch(() => {});
    }
    if (!open && d.open) d.close();
    if (!open) video.current?.pause();
  }, [open]);
  return (
    <>
      <button className="btn btn-glass" onClick={() => setOpen(true)}>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.5 1.5v9l8-4.5z" fill="currentColor" />
        </svg>
        Watch the film
      </button>
      <dialog
        ref={ref}
        className="film"
        aria-label="ArkPlay film"
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      >
        <button className="film-close" onClick={() => setOpen(false)} aria-label="Close film">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M1 1l10 10M11 1 1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <video ref={video} src="/media/arkplay-teaser.mp4" poster="/media/arkplay-teaser-poster.jpg" controls playsInline preload="none" />
      </dialog>
    </>
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
          {qty} {qty === 1 ? "console" : "consoles"}
        </output>
        <button onClick={() => setLocal((q) => Math.min(MAX_QTY, q + 1))} disabled={qty >= MAX_QTY} aria-label="One more">
          +
        </button>
      </div>
      <div className="buy-actions">
        <button
          className="btn btn-primary"
          onClick={() => {
            setQty(p.id, qty);
            router.push("/arkplay/checkout");
          }}
        >
          Reserve {qty === 1 ? "yours" : `${qty} consoles`}
        </button>
        <button
          className="btn btn-glass"
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
