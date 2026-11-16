"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-driven 3D view: a pinned stage that scrubs through frames of the ArkPlay render as you scroll,
 * so the console turns (or comes apart) under your thumb. Frames load lazily, nearest-first.
 * With reduced motion, it shows a single still frame and no scrubbing.
 */
export function ScrollSequence({
  dir,
  count,
  lengthVh = 300,
  still,
  label,
  fit = "contain",
  zoom = 1,
  children,
}: {
  dir: string; // e.g. "/media/arkplay-seq/turn"
  count: number;
  lengthVh?: number; // how much scrolling the sequence takes
  still?: number; // frame shown with reduced motion (1-based)
  label: string;
  fit?: "contain" | "cover";
  zoom?: number; // extra scale on top of the fit, e.g. 0.8 to leave room for text
  children?: (progress: number) => React.ReactNode;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const frames = useRef<(HTMLImageElement | null)[]>([]);
  const currentProgress = useRef(0);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);
  const src = (i: number) => `${dir}/${String(i + 1).padStart(3, "0")}.jpg`;

  // Draw the frame for a progress value, falling back to the nearest loaded frame.
  const draw = (p: number) => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const want = Math.min(count - 1, Math.max(0, Math.round(p * (count - 1))));
    let img: HTMLImageElement | null = null;
    for (let d = 0; d < count && !img; d++) {
      const a = frames.current[want - d];
      const b = frames.current[want + d];
      img = a?.complete && a.naturalWidth ? a : b?.complete && b.naturalWidth ? b : null;
    }
    if (!img) return;
    const w = c.width;
    const h = c.height;
    const contain = Math.min(w / img.naturalWidth, h / img.naturalHeight);
    const cover = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    // On tall phone screens "contain" makes the console tiny, so zoom in part of the way.
    const portrait = w < h;
    const scale = fit === "cover" && !portrait ? cover : Math.min(cover, contain * (portrait ? 1.5 : 1));
    const dw = img.naturalWidth * scale * zoom;
    const dh = img.naturalHeight * scale * zoom;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  };

  useEffect(() => {
    const r = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(r);
    frames.current = new Array(count).fill(null);
    const load = (i: number) => {
      if (frames.current[i]) return;
      const img = new Image();
      img.decoding = "async";
      img.src = src(i);
      img.onload = () => draw(currentProgress.current);
      frames.current[i] = img;
    };
    const first = r ? (still ?? count) - 1 : 0;
    load(first);
    if (r) return;

    // Fetch the rest only when the section is getting close.
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        for (let i = 0; i < count; i++) load(i);
      },
      { rootMargin: "150% 0px" },
    );
    if (wrap.current) io.observe(wrap.current);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dir, count]);

  useEffect(() => {
    let raf = 0;
    const size = () => {
      const c = canvas.current;
      if (!c) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(c.clientWidth * dpr);
      c.height = Math.round(c.clientHeight * dpr);
      draw(currentProgress.current);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = wrap.current;
        if (!el) return;
        if (reduced) {
          currentProgress.current = ((still ?? count) - 1) / (count - 1);
        } else {
          const rect = el.getBoundingClientRect();
          const total = el.offsetHeight - window.innerHeight;
          currentProgress.current = Math.min(1, Math.max(0, -rect.top / Math.max(1, total)));
        }
        setProgress(currentProgress.current);
        draw(currentProgress.current);
      });
    };
    size();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", size);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", size);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  return (
    <div ref={wrap} className="seq" style={{ height: reduced ? "100vh" : `${lengthVh}vh` }}>
      <div className="seq-stage">
        <canvas ref={canvas} className="seq-canvas" role="img" aria-label={label} />
        {children?.(progress)}
      </div>
    </div>
  );
}

/** 0 → 1 as progress moves from a to b, clamped. Handy for fading overlays in and out. */
export const ramp = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));
