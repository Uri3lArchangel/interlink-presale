"use client";

import Image from "next/image";
import { useState } from "react";
import { banks, formatNaira } from "@/lib/catalog";
import { AddButton } from "./chrome";

const USABLE = 0.65; // share of rated capacity that reaches the phone after conversion losses

export function PowerPicker() {
  const [i, setI] = useState(2);
  const [phone, setPhone] = useState(5000);
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
                aria-label={`${b.capacity!.toLocaleString("en-NG")} mAh`}
              >
                <b>{b.capacity! / 1000}K</b>
                <span>mAh</span>
              </button>
            ))}
          </div>
        </div>
        <label className="phone-row">
          <span className="head">
            Your phone’s battery <output>{phone.toLocaleString("en-NG")} mAh</output>
          </span>
          <input type="range" min={3000} max={6000} step={250} value={phone} onChange={(e) => setPhone(Number(e.target.value))} />
        </label>
        <div className="cells" aria-live="polite">
          <p className="cells-sum">About {charges.toFixed(1)} full charges</p>
          <div className="cells-row" aria-hidden="true">
            {Array.from({ length: cells }, (_, n) => (
              <span className="cell" key={n}>
                <i style={{ height: `${Math.min(1, charges - n) * 100}%` }} />
              </span>
            ))}
          </div>
          <p className="small">Assumes about 65% of rated capacity reaches your phone after conversion losses.</p>
        </div>
        <div className="power-buy">
          <span className="price">{formatNaira(bank.price)}</span>
          <AddButton id={bank.id} />
        </div>
      </div>
    </div>
  );
}
