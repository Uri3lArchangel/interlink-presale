/**
 * Business details used across the storefront, emails and legal pages.
 * Every value marked TODO must be confirmed before launch: the Terms of Sale
 * name the seller by these details, and a wrong legal name or address weakens them.
 */
export const site = {
  // Identifies this storefront in payment metadata and when sharing webhooks with the sister site.
  key: "interlink",
  name: "Interlink",
  // Interlink is a product of Arkmarket Place Limited (CAC certificate, registered 13 Aug 2026), the seller named in the Terms.
  legalName: "Arkmarket Place Limited",
  rcNumber: "RC 9771887",
  // TODO: registered office address.
  address: "Lagos, Nigeria",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "info@interlinknetwork.link",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  presale: {
    batch: "Batch 01",
    // TODO: confirm with manufacturing. Shown at checkout and in the Terms as an estimate only.
    estimatedDispatch: "Q2 2027",
    // Customers may cancel for a full refund if dispatch has not started this many days after the window ends.
    longStopDays: 180,
    // Unpaid reservations are released after this many hours.
    paymentWindowHours: 48,
    // Cost adjustment (Terms, "Price and payment"): only when supply costs rise by more than this share, outside our control.
    costAdjustThresholdPct: 10,
    // Minimum days a customer gets to decide whether to pay an adjustment or cancel.
    costAdjustNoticeDays: 14,
  },
  // Added to every order at checkout and shown before payment. Covers payment processing plus a margin.
  transactionFeePct: 2.5,
  termsVersion: "2026-11-15.1",
} as const;
