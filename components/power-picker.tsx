"use client";

import Image from "next/image";
import { useState } from "react";
import { banks, formatNaira } from "@/lib/catalog";
import { AddButton } from "./chrome";

export function PowerPicker() {
  const [i, setI] = useState(2);
  const [phone, setPhone] = useState(5000);
  const bank = banks[i];
  const charges = (bank.capacity! * 0.65) / phone;

  return (
    <div className="picker">
      <div className="picker-media">
        <span className="tag cap">
          <span className="pro">{bank.capacity!.toLocaleString("en-NG")} mAh</span>
        </span>
        {banks.map((b, n) => (
          <Image
            key={b.id}
            src={b.image}
            alt={n === i ? `${b.name}, concept render` : ""}
            width={512}
            height={512}
            style={{
              gridArea: "1 / 1",
              opacity: n === i ? 1 : 0,
              transform: n === i ? "none" : "scale(.96)",
            }}
            aria-hidden={n !== i}
          />
        ))}
      </div>
      <div className="picker-body">
        <div>
          <p className="eyebrow">Personal PowerBank · Fingerprint lock</p>
          <h3 style={{ marginTop: 14 }}>Choose the capacity that fits your day.</h3>
        </div>
        <div className="seg" role="group" aria-label="Capacity">
          {banks.map((b, n) => (
            <button key={b.id} aria-pressed={n === i} onClick={() => setI(n)} aria-label={`${b.capacity!.toLocaleString("en-NG")} mAh`}>
              {b.capacity! / 1000}K
            </button>
          ))}
        </div>
        <label className="range">
          <span className="range-head">
            Your phone’s battery <output>{phone.toLocaleString("en-NG")} mAh</output>
          </span>
          <input type="range" min={3000} max={6000} step={250} value={phone} onChange={(e) => setPhone(Number(e.target.value))} />
        </label>
        <div className="estimate" aria-live="polite">
          <strong>≈{charges.toFixed(1)}</strong>
          <span>full phone charges</span>
        </div>
        <p className="fine">Estimate assumes roughly 65% of rated capacity reaches your phone after conversion losses.</p>
        <div className="picker-buy">
          <span className="price">{formatNaira(bank.price)}</span>
          <AddButton id={bank.id} />
        </div>
      </div>
    </div>
  );
}
