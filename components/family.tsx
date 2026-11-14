"use client";

import Image from "next/image";
import { useState } from "react";
import { formatNaira, productById } from "@/lib/catalog";
import { AddButton } from "./chrome";

/** One router family (standard + Pro) in a display case, with a switch between the two. */
export function Family({ standard, pro, title, intro }: { standard: string; pro: string; title: string; intro: string }) {
  const [isPro, setPro] = useState(false);
  const models = [productById(standard)!, productById(pro)!];
  const current = models[isPro ? 1 : 0];

  return (
    <article className="case family">
      <div className="family-top">
        <div>
          <h3 className="h3">{title}</h3>
          <p>{intro}</p>
        </div>
        <div className="switch" role="group" aria-label={`${title} model`}>
          <button aria-pressed={!isPro} onClick={() => setPro(false)}>
            Standard
          </button>
          <button aria-pressed={isPro} onClick={() => setPro(true)}>
            Pro
          </button>
        </div>
      </div>
      <div className="family-media">
        {models.map((m) => (
          <Image
            key={m.id}
            className="case-img"
            src={m.image}
            alt={m === current ? `${m.name}, concept render` : ""}
            aria-hidden={m !== current}
            data-on={m === current}
            width={m.id.startsWith("tier2") ? 764 : 768}
            height={m.id.startsWith("tier2") ? 1024 : 768}
            sizes="(max-width: 860px) 90vw, 40vw"
          />
        ))}
      </div>
      <p aria-live="polite">{current.summary}</p>
      <div className="family-buy">
        <span className="price">{formatNaira(current.price)}</span>
        <AddButton id={current.id} />
      </div>
    </article>
  );
}
