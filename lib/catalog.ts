import type { BrandKey } from "./brands";

export type Product = {
  id: string;
  /** Which storefront sells it. A cart and an order only ever hold one store's products. */
  store: BrandKey;
  name: string;
  family: "router" | "power" | "console";
  line: string;
  summary: string;
  price: number; // naira, whole units
  image: string;
  pro?: boolean;
  capacity?: number; // mAh, PowerBanks only
};

const powerBanks: Product[] = Array.from({ length: 5 }, (_, i) => {
  const capacity = (i + 1) * 10000;
  return {
    id: `power-${i + 1}`,
    store: "interlink",
    name: `Personal PowerBank ${capacity / 1000}K`,
    family: "power",
    line: "Personal PowerBank",
    summary: "Portable power that only unlocks with your fingerprint.",
    price: 29000 + i * 10000,
    image: `/products/power-${i + 1}.jpg`,
    capacity,
  };
});

const catalog: Product[] = [
  {
    id: "tier1",
    store: "interlink",
    name: "Tier 1 Router",
    family: "router",
    line: "Desk",
    summary: "Brings the Interlink network to your home or small office.",
    price: 120000,
    image: "/products/tier1.webp",
  },
  {
    id: "tier1-pro",
    store: "interlink",
    name: "Tier 1 Router Pro",
    family: "router",
    line: "Desk",
    summary: "The desk router for busier homes and offices, with room for more people.",
    price: 270000,
    image: "/products/tier1-pro.webp",
    pro: true,
  },
  {
    id: "tier2",
    store: "interlink",
    name: "Tier 2 Rooftop Node",
    family: "router",
    line: "Rooftop",
    summary: "Built for the outdoors, to carry the network across your street.",
    price: 499999,
    image: "/products/tier2.webp",
  },
  {
    id: "tier2-pro",
    store: "interlink",
    name: "Tier 2 Rooftop Node Pro",
    family: "router",
    line: "Rooftop",
    summary: "Four antennas on a steel pole, for the widest reach.",
    price: 699999,
    image: "/products/tier2-pro.webp",
    pro: true,
  },
  ...powerBanks,
  {
    id: "arkplay",
    store: "arkplay",
    name: "ArkPlay console",
    family: "console",
    line: "ArkPlay",
    summary: "A handheld console with Bible games and stories built in, made for your blessed hands.",
    price: 849999,
    image: "/media/arkplay-console.jpg",
  },
];

/**
 * Test pricing: set NEXT_PUBLIC_TEST_PRICE_NAIRA (e.g. 100) to charge that amount for every item,
 * so the real payment flow can be tried cheaply. Remove it and redeploy to restore real prices.
 * It is read at build time on both server and browser, so both always agree on the price.
 */
export const testPrice = Math.max(0, Math.floor(Number(process.env.NEXT_PUBLIC_TEST_PRICE_NAIRA) || 0));

export const products: Product[] = testPrice ? catalog.map((p) => ({ ...p, price: testPrice })) : catalog;

export const routers = products.filter((p) => p.family === "router");
export const arkplayConsole = products.find((p) => p.id === "arkplay")!;
export const productsFor = (store: BrandKey) => products.filter((p) => p.store === store);
export const banks = products.filter((p) => p.family === "power");

export const productById = (id: string) => products.find((p) => p.id === id);

export const MAX_QTY = 20;

export const formatNaira = (amount: number) =>
  "₦" + amount.toLocaleString("en-NG", { maximumFractionDigits: 0 });

export const formatKobo = (kobo: number) =>
  "₦" + (kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/**
 * Naira per Espee, used only to show an approximate Espees price next to the naira price.
 * Customers still pay in naira (bank transfer) or crypto. Update NEXT_PUBLIC_NGN_PER_ESPEE as the rate moves.
 */
export const NGN_PER_ESPEE = Number(process.env.NEXT_PUBLIC_NGN_PER_ESPEE) || 2050;

export const formatEspees = (naira: number) =>
  (naira / NGN_PER_ESPEE).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " Espees";
