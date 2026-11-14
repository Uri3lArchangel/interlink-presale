# Interlink Presale

Next.js storefront for the Interlink hardware presale. Customers pay by bank transfer into a
per-order virtual account from [Pouch](https://fiat-api.pouchfinance.xyz/llms.txt); verified
payments trigger a confirmation email with the order number.

## Run locally

```bash
npm install
npm run dev
```

With no `POUCH_SECRET_KEY` set, payments run in **test mode**: checkout issues a fake account
number and the order page shows a "Simulate transfer" button that runs the real webhook path.
Emails are printed to the terminal instead of sent. Orders are stored in `.data/store.json`.

## Production setup

Copy `.env.example` to `.env.local` (or your host's env settings) and fill in:

| Variable | Purpose |
| --- | --- |
| `POUCH_SECRET_KEY` | Pouch `sk_live_…` key |
| `POUCH_WEBHOOK_SECRET` | Optional; see note below |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Order storage (required in production) |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Confirmation emails from a Gmail account (no domain needed) |
| `RESEND_API_KEY`, `EMAIL_FROM` | Alternative: confirmation emails via Resend; needs a verified domain |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPPORT_EMAIL` | Links and contact address |

Then set your Pouch webhook URL to `https://<your-domain>/api/webhooks/pouch`.

Before launch, fill in the TODOs in `lib/site.ts` (legal name, RC number, address, dispatch
window). The Terms of Sale read these values.

## How payment verification works

1. `POST /api/checkout` prices the bag on the server, creates a Pouch customer and a virtual
   account capped at the order total (`funding_limit`), and stores the order.
2. Pouch sends `virtual_account.credited` to `/api/webhooks/pouch`. The handler re-reads the
   credit from `GET /inbound-transfers/{id}/trace` with our secret key and checks it landed on
   this order's account. The webhook body is never trusted on its own.
3. Each credit is counted once (keyed by transfer id, under a lock). When the total is covered
   the order is marked paid and the confirmation email is sent exactly once.
4. If a webhook is missed, the order page polls `/api/orders/[id]`, which reconciles against
   `GET /inbound-transfers` at most every 20 seconds.

**Open question for Pouch:** their docs name the `X-Liquifia-Signature` header but not the
algorithm. `lib/pouch.ts` assumes HMAC-SHA256 over the raw body when `POUCH_WEBHOOK_SECRET`
is set. Confirm with Pouch before setting it; until then leave it empty (step 2 still protects you).

## Legal

`/terms` and `/privacy` are drafted for Nigerian law (FCCPA 2018, NDPA 2023, Arbitration and
Mediation Act 2023). Have a Nigerian lawyer review them before launch.
