export type Product = {
  id: string;
  name: string;
  family: "router" | "power";
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
    name: `Personal PowerBank ${capacity / 1000}K`,
    family: "power",
    line: "Personal PowerBank",
    summary: "Fingerprint-locked portable power with a live charge display.",
    price: 29000 + i * 10000,
    image: `/products/power-${i + 1}.webp`,
    capacity,
  };
});

const catalog: Product[] = [
  {
    id: "tier1",
    name: "Tier 1 Router",
    family: "router",
    line: "Desk",
    summary: "The Interlink access point for the home and the small office.",
    price: 120000,
    image: "/products/tier1.webp",
  },
  {
    id: "tier1-pro",
    name: "Tier 1 Router Pro",
    family: "router",
    line: "Desk",
    summary: "The desk router, built for heavier traffic and more devices.",
    price: 270000,
    image: "/products/tier1-pro.webp",
    pro: true,
  },
  {
    id: "tier2",
    name: "Tier 2 Rooftop Node",
    family: "router",
    line: "Rooftop",
    summary: "A weather-sealed node that carries the network across a street.",
    price: 499999,
    image: "/products/tier2.webp",
  },
  {
    id: "tier2-pro",
    name: "Tier 2 Rooftop Node Pro",
    family: "router",
    line: "Rooftop",
    summary: "Four sector antennas on a steel mast, for the widest reach.",
    price: 699999,
    image: "/products/tier2-pro.webp",
    pro: true,
  },
  ...powerBanks,
];

/**
 * Test pricing: set NEXT_PUBLIC_TEST_PRICE_NAIRA (e.g. 100) to charge that amount for every item,
 * so the real payment flow can be tried cheaply. Remove it and redeploy to restore real prices.
 * It is read at build time on both server and browser, so both always agree on the price.
 */
export const testPrice = Math.max(0, Math.floor(Number(process.env.NEXT_PUBLIC_TEST_PRICE_NAIRA) || 0));

export const products: Product[] = testPrice ? catalog.map((p) => ({ ...p, price: testPrice })) : catalog;

export const routers = products.filter((p) => p.family === "router");
export const banks = products.filter((p) => p.family === "power");

export const productById = (id: string) => products.find((p) => p.id === id);

export const MAX_QTY = 20;

export const formatNaira = (amount: number) =>
  "₦" + amount.toLocaleString("en-NG", { maximumFractionDigits: 0 });

export const formatKobo = (kobo: number) =>
  "₦" + (kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
