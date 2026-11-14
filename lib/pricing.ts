import { site } from "./site";

export const FEE_PCT = site.transactionFeePct;

/** The transaction fee in whole naira for a hardware subtotal in naira, rounded to the nearest naira. */
export const transactionFee = (subtotalNaira: number) => Math.round((subtotalNaira * FEE_PCT) / 100);

export const feeLabel = `Transaction fee (${FEE_PCT}%)`;
