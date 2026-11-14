"use client";

import Image from "next/image";
import { useState } from "react";
import { banks, formatNaira } from "@/lib/catalog";
import { AddButton } from "./chrome";

const USABLE = 0.65; // share of rated capacity that reaches the phone after conversion losses

// Typical phone battery sizes, so shoppers pick a phone size instead of a mAh figure.
const PHONES = [
  { label: "Small", mah: 3000 },
  { label: "Average", mah: 4500 },
  { label: "Large", mah: 5500 },
];

export function PowerPicker() {
  const [i, setI] = useState(2);
  const [phoneIdx, setPhoneIdx] = useState(1);
  const phone = PHONES[phoneIdx].mah;
  const bank = banks[i];
  const charges = (bank.capacity! * USABLE) / phone;
  const cells = Math.ceil(charges);

  return (
    <div className="power">
      <div className="case power-media">
        {banks.map((b, n) => (
          <Image
            key={b.id}
            className="case-img"
            src={b.image}
            alt={n === i ? `${b.name}, concept render` : ""}
            aria-hidden={n !== i}
            data-on={n === i}
            width={512}
            height={512}
            sizes="(max-width: 900px) 80vw, 45vw"
          />
        ))}
      </div>
      <div className="power-body">
        <div>
          <p className="opt-label">Capacity</p>
          <div className="caps" role="group" aria-label="Capacity">
            {banks.map((b, n) => (
              <button
                key={b.id}
                aria-pressed={n === i}
                onClick={() => setI(n)}
                aria-label={`${b.capacity! / 1000}K PowerBank`}
              >
                <b>{b.capacity! / 1000}K</b>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="opt-label">Your phone</p>
          <div className="caps" role="group" aria-label="Your phone size" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {PHONES.map((p, n) => (
              <button key={p.label} aria-pressed={n === phoneIdx} onClick={() => setPhoneIdx(n)} style={{ height: 52 }}>
                <b style={{ fontSize: 16 }}>{p.label}</b>
              </button>
            ))}
          </div>
        </div>
        <div className="cells" aria-live="polite">
          <p className="cells-sum">About {charges.toFixed(1)} full charges</p>
          <div className="cells-row" aria-hidden="true">
            {Array.from({ length: cells }, (_, n) => (
              <span className="cell" key={n}>
                <i style={{ height: `${Math.min(1, charges - n) * 100}%` }} />
              </span>
            ))}
          </div>
          <p className="small">An estimate. The real number depends on your phone and how you use it.</p>
        </div>
        <div className="power-buy">
          <span className="price">{formatNaira(bank.price)}</span>
          <AddButton id={bank.id} />
        </div>
      </div>
    </div>
  );
}
