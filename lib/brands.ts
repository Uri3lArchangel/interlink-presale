/**
 * The storefronts that run on this one app. They share the seller, payment accounts, webhooks,
 * database and email sender; everything a customer sees (name, look, order numbers, emails,
 * Terms version, dispatch estimate) comes from the order's brand.
 *
 * Safe to import from client components: no secrets here.
 */
import { site } from "./site";

export type BrandKey = "interlink" | "arkplay";

export type Brand = {
  key: BrandKey;
  name: string;
  /** Order numbers start with this, e.g. IL-7K3F-9Q2A. */
  orderPrefix: string;
  /** Where this store lives on the site ("" is the root). */
  basePath: string;
  supportEmail: string;
  batch: string;
  estimatedDispatch: string;
  termsVersion: string;
  /** What the product is called in copy ("hardware", "console"). */
  goods: string;
  email: {
    logo: string; // file in public/email
    logoWidth: number;
    logoHeight: number;
    logoStyle: string;
    accent: string;
    thumbBg: string;
  };
};

export const brands: Record<BrandKey, Brand> = {
  interlink: {
    key: "interlink",
    name: "Interlink",
    orderPrefix: "IL",
    basePath: "",
    supportEmail: site.supportEmail,
    batch: site.presale.batch,
    estimatedDispatch: site.presale.estimatedDispatch,
    termsVersion: site.termsVersion,
    goods: "hardware",
    email: { logo: "logo.png", logoWidth: 44, logoHeight: 44, logoStyle: "border-radius:11px", accent: "#1e5aa8", thumbBg: "#0b0b0c" },
  },
  arkplay: {
    key: "arkplay",
    name: "ArkPlay",
    orderPrefix: "AP",
    basePath: "/arkplay",
    // TODO: an ArkPlay inbox, if it should differ from Interlink's.
    supportEmail: process.env.NEXT_PUBLIC_ARKPLAY_SUPPORT_EMAIL ?? site.supportEmail,
    batch: "Batch 01",
    // TODO: confirm with manufacturing.
    estimatedDispatch: "Q2 2027",
    termsVersion: "arkplay-2026-11-15.1",
    goods: "console",
    email: {
      logo: "arkplay-logo.png",
      logoWidth: 132,
      logoHeight: 54,
      logoStyle: "background:#0e0b1f;padding:10px 14px;border-radius:14px",
      accent: "#4b3bff",
      thumbBg: "#000000",
    },
  },
};

export const brandOf = (key?: string | null): Brand => brands[(key as BrandKey) ?? "interlink"] ?? brands.interlink;

/** Path inside a store, e.g. path(arkplay, "/checkout") -> "/arkplay/checkout". */
export const brandPath = (brand: Brand, p = "/") => (brand.basePath + (p === "/" ? "" : p)) || "/";
