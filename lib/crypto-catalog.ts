import "server-only";
import { FEATURED_CHAINS, NATIVE, assetKey, tokenRank, vmForChain, type CryptoAsset, type CryptoChain } from "./crypto-assets";

/**
 * Live list of every chain and token Dextopus can take deposits in, cached for 30 minutes per
 * server instance. These endpoints are public; the API key is sent when we have one.
 */

const BASE = (process.env.DEXTOPUS_API_URL ?? "https://swap-api.dextopus.com").replace(/\/$/, "") + "/api";
const TTL = 30 * 60_000;

type Cached<T> = { at: number; value: T };
const g = globalThis as unknown as { __dxChains?: Cached<CryptoChain[]>; __dxTokens?: Map<number, Cached<CryptoAsset[]>> };
const tokenCache = (g.__dxTokens ??= new Map());

async function get<T>(path: string): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (process.env.DEXTOPUS_API_KEY) headers["x-api-key"] = process.env.DEXTOPUS_API_KEY;
  const res = await fetch(BASE + path, { headers, cache: "no-store", signal: AbortSignal.timeout(15_000) });
  const json = (await res.json().catch(() => ({}))) as T & { success?: boolean; message?: string };
  if (!res.ok || json.success === false) throw new Error(json.message ?? `Dextopus request failed (${res.status})`);
  return json;
}

/** Every supported network: popular ones first, then A to Z. */
export async function listChains(): Promise<CryptoChain[]> {
  if (g.__dxChains && Date.now() - g.__dxChains.at < TTL) return g.__dxChains.value;
  const data = await get<{ chains: { chainId: number; name: string; logoUrl?: string; nativeCurrency?: { symbol?: string } }[] }>("/deposit/chains");
  const chains = data.chains
    .filter((c) => Number.isFinite(c.chainId) && c.name)
    .map((c) => ({ chainId: c.chainId, name: c.name, vm: vmForChain(c.chainId), logoUrl: c.logoUrl, native: c.nativeCurrency?.symbol ?? "" }));
  const rank = (id: number) => {
    const i = FEATURED_CHAINS.indexOf(id);
    return i === -1 ? FEATURED_CHAINS.length : i;
  };
  chains.sort((a, b) => rank(a.chainId) - rank(b.chainId) || a.name.localeCompare(b.name));
  g.__dxChains = { at: Date.now(), value: chains };
  return chains;
}

/** Every token Dextopus accepts on one network: stablecoins first, then the native coin, then A to Z. */
export async function listTokens(chainId: number): Promise<CryptoAsset[]> {
  const hit = tokenCache.get(chainId);
  if (hit && Date.now() - hit.at < TTL) return hit.value;
  const chain = (await listChains()).find((c) => c.chainId === chainId);
  if (!chain) return [];
  const data = await get<{ tokens: { address: string; symbol: string; name?: string; decimals: number; logoUrl?: string }[] }>(
    `/deposit/tokens?chainId=${chainId}`,
  );
  const seen = new Set<string>();
  const tokens: CryptoAsset[] = [];
  for (const t of data.tokens ?? []) {
    if (!t.address || !t.symbol || !Number.isInteger(t.decimals)) continue;
    const key = assetKey(chainId, t.address);
    if (seen.has(key)) continue;
    seen.add(key);
    tokens.push({ key, symbol: t.symbol, name: t.name, network: chain.name, chainId, address: t.address, decimals: t.decimals, vm: chain.vm, logoUrl: t.logoUrl });
  }
  const isNative = (a: CryptoAsset) => a.address.toLowerCase() === NATIVE.toLowerCase();
  tokens.sort((a, b) => tokenRank(a.symbol) - tokenRank(b.symbol) || Number(isNative(b)) - Number(isNative(a)) || a.symbol.localeCompare(b.symbol));
  tokenCache.set(chainId, { at: Date.now(), value: tokens });
  return tokens;
}

/** Look up a customer's choice in the live list, so we only ever quote tokens Dextopus supports. */
export async function resolveAsset(chainId: number, address: string): Promise<CryptoAsset | undefined> {
  if (!Number.isFinite(chainId) || !address) return undefined;
  const key = assetKey(chainId, address);
  return (await listTokens(chainId)).find((t) => t.key === key);
}
