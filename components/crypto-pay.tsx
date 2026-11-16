"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { DEFAULT_CHOICE, addressHint, formatUnits, isStablecoin, type CryptoChain, type Vm } from "@/lib/crypto-assets";
import { formatKobo } from "@/lib/catalog";
import type { PublicOrder } from "@/lib/orders";

function CopyBtn({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="copy"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {}
      }}
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

const stateText: Record<NonNullable<PublicOrder["crypto"]>["state"], string> = {
  waiting: "Waiting for your payment",
  processing: "Payment detected, confirming on the network…",
  completed: "Payment received",
  failed: "This payment didn’t go through. Get a new address and try again.",
  refunded: "Your payment didn’t match the amount and was refunded to your wallet. Get a new address to try again.",
};

type Token = { key: string; symbol: string; name?: string; address: string; decimals: number; vm: Vm; network: string; chainId: number };

const selectStyle = {
  height: 52,
  borderRadius: 12,
  padding: "0 14px",
  background: "#1c1c1e",
  color: "var(--on-dark)",
  border: "1px solid #3a3a3c",
  fontSize: 16,
} as const;

export function CryptoPay({
  order,
  token,
  testMode,
  onUpdate,
}: {
  order: PublicOrder;
  token: string;
  testMode: boolean;
  onUpdate: (o: PublicOrder) => void;
}) {
  const q = order.crypto;
  const [chains, setChains] = useState<CryptoChain[] | null>(null);
  const [tokens, setTokens] = useState<Token[] | null>(null);
  const [chainId, setChainId] = useState<number>(DEFAULT_CHOICE.chainId);
  const [tokenAddress, setTokenAddress] = useState<string>(DEFAULT_CHOICE.address);
  const [refundTo, setRefundTo] = useState(q?.refundTo ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const expired = q?.expiresAt ? Date.parse(q.expiresAt) < Date.now() : false;
  const showQuote = q && !expired && (q.state === "waiting" || q.state === "processing");
  const chain = chains?.find((c) => c.chainId === chainId);
  const coin = tokens?.find((t) => t.address.toLowerCase() === tokenAddress.toLowerCase());
  const vm: Vm = coin?.vm ?? chain?.vm ?? "evm";

  // Load every network Dextopus supports, then the coins on the chosen one.
  useEffect(() => {
    if (showQuote) return;
    let stop = false;
    fetch("/api/crypto/options")
      .then((r) => r.json())
      .then((d) => !stop && (d.chains ? setChains(d.chains) : setError(d.error ?? "Couldn’t load networks.")))
      .catch(() => !stop && setError("Couldn’t load networks. Check your connection and try again."));
    return () => {
      stop = true;
    };
  }, [showQuote]);
  useEffect(() => {
    if (showQuote) return;
    let stop = false;
    setTokens(null);
    fetch(`/api/crypto/options?chainId=${chainId}`)
      .then((r) => r.json())
      .then((d: { tokens?: Token[]; error?: string }) => {
        if (stop) return;
        if (!d.tokens) return setError(d.error ?? "Couldn’t load coins.");
        setTokens(d.tokens);
        setTokenAddress((cur) => (d.tokens!.some((t) => t.address.toLowerCase() === cur.toLowerCase()) ? cur : (d.tokens![0]?.address ?? "")));
      })
      .catch(() => !stop && setError("Couldn’t load coins. Check your connection and try again."));
    return () => {
      stop = true;
    };
  }, [chainId, showQuote]);

  useEffect(() => {
    if (!showQuote) return setQr(null);
    QRCode.toDataURL(q.depositAddress, { margin: 1, width: 220, color: { dark: "#000000", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [showQuote, q?.depositAddress]);

  async function getAddress() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/crypto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, chainId, address: tokenAddress, refundTo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      onUpdate(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function simulate() {
    await fetch("/api/dev/simulate-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: order.id, token, method: "crypto" }),
    });
    const res = await fetch(`/api/orders/${order.id}?t=${encodeURIComponent(token)}`, { cache: "no-store" });
    if (res.ok) onUpdate(await res.json());
  }

  if (showQuote) {
    const amount = formatUnits(q.amountIn, q.decimals);
    const volatile = !isStablecoin(q.symbol);
    return (
      <div className="case transfer">
        <p className="small">Send exactly</p>
        <p className="amount">
          {amount} {q.symbol}
        </p>
        <p className="small" style={{ marginTop: 10 }}>
          on <strong style={{ color: "var(--on-dark)" }}>{q.network}</strong> · covers {formatKobo(order.totalKobo)} at ₦
          {q.ngnPerUsd.toLocaleString("en-NG")}/$
        </p>
        <div style={{ display: "flex", gap: 20, alignItems: "center", marginTop: 24, flexWrap: "wrap" }}>
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="QR code of the deposit address" width={140} height={140} style={{ borderRadius: 12, background: "#fff" }} />
          )}
          <dl className="bank" style={{ flex: 1, minWidth: 240, marginTop: 0 }}>
            <div style={{ alignItems: "flex-start", flexDirection: "column", gap: 8 }}>
              <dt>Deposit address</dt>
              <dd style={{ width: "100%", justifyContent: "space-between", textAlign: "left" }}>
                <span style={{ wordBreak: "break-all", fontSize: 14 }}>{q.depositAddress}</span>
                <CopyBtn value={q.depositAddress} label="deposit address" />
              </dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>
                {amount} {q.symbol}
                <CopyBtn value={amount} label="amount" />
              </dd>
            </div>
          </dl>
        </div>
        <p className="small" style={{ marginTop: 18, color: "var(--on-dark)" }} role="status">
          {stateText[q.state]}
        </p>
        <ul className="tips">
          <li>
            Send <strong>only {q.symbol}</strong> on <strong>{q.network}</strong>. Other coins or networks can be lost.
          </li>
          {volatile && (
            <li>
              {q.symbol}’s price moves, so send it now. If the price moves too far before your payment lands, the swap can’t complete and
              your {q.symbol} is refunded to your wallet.
            </li>
          )}
          <li>Send at least this amount in one transfer. Too little is refunded in full; anything extra is refunded automatically.</li>
          <li>Network fees are paid by you, on top of this amount.</li>
          {q.expiresAt && (
            <li>
              This address is valid until{" "}
              {new Date(q.expiresAt).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })}. After that, get a new one.
            </li>
          )}
        </ul>
        <button className="btn btn-sm btn-quiet" style={{ marginTop: 20 }} onClick={() => onUpdate({ ...order, crypto: null })}>
          Use a different coin
        </button>
        {testMode && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #2c2c2e", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <span className="small">Test mode: no Dextopus key is set, so this address is simulated.</span>
            <button className="btn btn-sm btn-primary" onClick={simulate}>
              Simulate crypto payment
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="case transfer">
      <p className="small">Pay with crypto</p>
      <p className="amount" style={{ fontSize: "clamp(32px,4vw,44px)" }}>
        {formatKobo(order.totalKobo)}
      </p>
      {q && (q.state === "failed" || q.state === "refunded" || expired) && (
        <p className="small" style={{ marginTop: 10, color: "#ffb4a8" }}>
          {expired ? "Your last crypto address expired. Get a new one below." : stateText[q.state]}
        </p>
      )}
      <div style={{ display: "grid", gap: 16, marginTop: 24 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span className="small">Network</span>
          <select value={chainId} onChange={(e) => setChainId(Number(e.target.value))} disabled={!chains} style={selectStyle}>
            {!chains && <option>Loading networks…</option>}
            {chains?.map((c) => (
              <option key={c.chainId} value={c.chainId}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span className="small">Coin</span>
          <select value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} disabled={!tokens || !tokens.length} style={selectStyle}>
            {!tokens && <option>Loading coins…</option>}
            {tokens && !tokens.length && <option>No coins available on this network</option>}
            {tokens?.map((t) => (
              <option key={t.key} value={t.address}>
                {t.symbol}
                {t.name && t.name !== t.symbol ? ` · ${t.name}` : ""}
              </option>
            ))}
          </select>
          {coin && !isStablecoin(coin.symbol) && (
            <span className="small">{coin.symbol}’s price moves. You’ll see the exact amount to send, valid for a short time.</span>
          )}
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span className="small">Your {chain?.name ?? ""} wallet address, for refunds</span>
          <input
            value={refundTo}
            onChange={(e) => setRefundTo(e.target.value)}
            placeholder={addressHint(vm)}
            spellCheck={false}
            autoComplete="off"
            style={{ height: 52, borderRadius: 12, padding: "0 14px", background: "#1c1c1e", color: "var(--on-dark)", border: "1px solid #3a3a3c", fontSize: 15 }}
          />
          <span className="small">If you send a different amount, or the order is refunded, the money goes back here.</span>
        </label>
        {error && (
          <p className="small" style={{ color: "#ffb4a8" }} role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary" onClick={getAddress} disabled={busy || !refundTo.trim() || !coin}>
          {busy ? "Getting your address…" : "Get payment address"}
        </button>
      </div>
    </div>
  );
}
