"use client";

import Image from "next/image";
import { useState } from "react";
import { formatNaira, productById } from "@/lib/catalog";
import { AddButton } from "./chrome";

/** A router family (standard + Pro) as a centred product tile, with a switch between the two models. */
export function Family({
  standard,
  pro,
  title,
  tagline,
  wide = false,
}: {
  standard: string;
  pro: string;
  title: string;
  tagline: string;
  wide?: boolean;
}) {
  const [isPro, setPro] = useState(false);
  const models = [productById(standard)!, productById(pro)!];
  const current = models[isPro ? 1 : 0];

  return (
    <article className={`case tile${wide ? " wide" : ""}`}>
      <h3 className="h3">{title}</h3>
      <p className="lede">{tagline}</p>
      <div className="switch" role="group" aria-label={`${title} model`}>
        <button aria-pressed={!isPro} onClick={() => setPro(false)}>
          Standard
        </button>
        <button aria-pressed={isPro} onClick={() => setPro(true)}>
          Pro
        </button>
      </div>
      <div className="tile-buy">
        <span className="price" aria-live="polite">
          {current.name}, {formatNaira(current.price)}
        </span>
        <AddButton id={current.id} />
      </div>
      <div className="tile-media">
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
            sizes={wide ? "(max-width: 860px) 90vw, 50vw" : "(max-width: 860px) 90vw, 40vw"}
          />
        ))}
      </div>
    </article>
  );
}
