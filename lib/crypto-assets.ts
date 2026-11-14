/**
 * Stablecoins customers can pay with. Dextopus converts whatever arrives into USDC on Base
 * and pays it to our settlement wallet. Kept to dollar stablecoins so the amount is predictable.
 */
export type CryptoAsset = {
  key: string;
  symbol: "USDC" | "USDT";
  network: string;
  chainId: number;
  address: string; // token contract / mint on that chain
  decimals: number;
  vm: "evm" | "svm" | "tvm";
};

export const CRYPTO_ASSETS: CryptoAsset[] = [
  { key: "usdt-tron", symbol: "USDT", network: "Tron (TRC-20)", chainId: 728126428, address: "TR7NHqjeKQxGTCi8q8ZY4pxL8otSzgjLj6t", decimals: 6, vm: "tvm" },
  { key: "usdt-bsc", symbol: "USDT", network: "BNB Chain (BEP-20)", chainId: 56, address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18, vm: "evm" },
  { key: "usdc-base", symbol: "USDC", network: "Base", chainId: 8453, address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6, vm: "evm" },
  { key: "usdc-solana", symbol: "USDC", network: "Solana", chainId: 792703809, address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6, vm: "svm" },
  { key: "usdt-eth", symbol: "USDT", network: "Ethereum (ERC-20)", chainId: 1, address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6, vm: "evm" },
  { key: "usdc-eth", symbol: "USDC", network: "Ethereum (ERC-20)", chainId: 1, address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6, vm: "evm" },
  { key: "usdc-polygon", symbol: "USDC", network: "Polygon", chainId: 137, address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", decimals: 6, vm: "evm" },
  { key: "usdc-arbitrum", symbol: "USDC", network: "Arbitrum", chainId: 42161, address: "0xaf88d065e77c8cC2239327C5EDb473f08e7Fd2b6", decimals: 6, vm: "evm" },
];

/** Where all crypto payments settle: USDC on Base. */
export const SETTLEMENT = { chainId: 8453, asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 };

export const assetByKey = (key: string) => CRYPTO_ASSETS.find((a) => a.key === key);

/** Rough address-shape check so obvious typos are caught before calling the API. */
export function looksLikeAddress(vm: CryptoAsset["vm"], address: string) {
  if (vm === "evm") return /^0x[0-9a-fA-F]{40}$/.test(address);
  if (vm === "svm") return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
}

/** Format a smallest-unit amount for display, rounded UP to `maxFraction` decimals so the customer never sends too little. */
export function formatUnits(amount: string, decimals: number, maxFraction = 6) {
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
