/**
 * Crypto payment options. The full list of chains and tokens comes live from Dextopus
 * (see lib/crypto-catalog.ts); Dextopus swaps whatever arrives into USDC on Base and pays our
 * settlement wallet. This file holds the shared types and helpers, safe for client components.
 */
export type Vm = "evm" | "svm" | "tvm" | "btc";

export type CryptoAsset = {
  key: string; // `${chainId}:${address}`
  symbol: string;
  name?: string;
  network: string;
  chainId: number;
  address: string; // token contract / mint on that chain (0xEeee… for the native coin)
  decimals: number;
  vm: Vm;
  logoUrl?: string;
};

export type CryptoChain = { chainId: number; name: string; vm: Vm; logoUrl?: string; native: string };

/** Where all crypto payments settle: USDC on Base. */
export const SETTLEMENT = { chainId: 8453, asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 };

export const NATIVE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

/** Chains that aren't EVM, by Dextopus chain id. Everything else uses 0x addresses. */
const NON_EVM: Record<number, Vm> = {
  792703809: "svm", // Solana
  9286185: "svm", // Eclipse (Solana VM)
  9286186: "svm", // Soon (Solana VM)
  728126428: "tvm", // Tron
  195: "tvm",
  8253038: "btc", // Bitcoin
};
export const vmForChain = (chainId: number): Vm => NON_EVM[chainId] ?? "evm";

/** Shown first in the network list, in this order. The rest follow alphabetically. */
export const FEATURED_CHAINS = [728126428, 56, 1, 8453, 792703809, 8253038, 137, 42161, 10, 43114];

/** Within a network, these come first: dollar stablecoins keep the amount predictable. */
const STABLES = ["USDT", "USDC", "DAI", "USDe", "PYUSD", "FDUSD", "USDS"];
export const tokenRank = (symbol: string) => {
  const i = STABLES.indexOf(symbol);
  return i === -1 ? STABLES.length : i;
};
export const isStablecoin = (symbol: string) => STABLES.includes(symbol);

export const assetKey = (chainId: number, address: string) => `${chainId}:${address.toLowerCase()}`;

/** Default choice for a new crypto payment: USDT on Tron, the most common in Nigeria. */
export const DEFAULT_CHOICE = { chainId: 728126428, address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t" };

/**
 * Orders created before the live catalogue stored only a short key. Kept so their order pages still render.
 * (The old Tron USDT address had a typo; the live catalogue uses the correct contract.)
 */
const LEGACY: Record<string, Omit<CryptoAsset, "key">> = {
  "usdt-tron": { symbol: "USDT", network: "Tron (TRC-20)", chainId: 728126428, address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", decimals: 6, vm: "tvm" },
  "usdt-bsc": { symbol: "USDT", network: "BNB Chain (BEP-20)", chainId: 56, address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18, vm: "evm" },
  "usdc-base": { symbol: "USDC", network: "Base", chainId: 8453, address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6, vm: "evm" },
  "usdc-solana": { symbol: "USDC", network: "Solana", chainId: 792703809, address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6, vm: "svm" },
  "usdt-eth": { symbol: "USDT", network: "Ethereum (ERC-20)", chainId: 1, address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6, vm: "evm" },
  "usdc-eth": { symbol: "USDC", network: "Ethereum (ERC-20)", chainId: 1, address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6, vm: "evm" },
  "usdc-polygon": { symbol: "USDC", network: "Polygon", chainId: 137, address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", decimals: 6, vm: "evm" },
  "usdc-arbitrum": { symbol: "USDC", network: "Arbitrum", chainId: 42161, address: "0xaf88d065e77c8cC2239327C5EDb473f08e7Fd2b6", decimals: 6, vm: "evm" },
};
export const legacyAsset = (key: string): CryptoAsset | undefined => (LEGACY[key] ? { key, ...LEGACY[key] } : undefined);

/** Address-shape check so obvious typos are caught before calling the API. Dextopus validates again. */
export function looksLikeAddress(vm: Vm, address: string) {
  if (vm === "evm") return /^0x[0-9a-fA-F]{40}$/.test(address);
  if (vm === "svm") return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  if (vm === "tvm") return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
  // Bitcoin: bech32 (bc1…) or legacy base58 (1… / 3…).
  return /^(bc1[02-9ac-hj-np-z]{11,71}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/.test(address);
}

export const addressHint = (vm: Vm) => (vm === "evm" ? "0x…" : vm === "svm" ? "Solana address" : vm === "tvm" ? "T…" : "bc1… or 1… / 3…");

/**
 * Format a smallest-unit amount for display, rounded UP so the customer never sends too little.
 * Dextopus refunds any excess automatically, so a tiny round-up is safe.
 */
export function formatUnits(amount: string, decimals: number, maxFraction = Math.min(decimals, 8)) {
  let v = BigInt(amount);
  let d = decimals;
  if (d > maxFraction) {
    const step = 10n ** BigInt(d - maxFraction);
    v = (v + step - 1n) / step;
    d = maxFraction;
  }
  const base = 10n ** BigInt(d);
  const frac = (v % base).toString().padStart(d, "0").replace(/0+$/, "");
  return frac ? `${v / base}.${frac}` : `${v / base}`;
}
