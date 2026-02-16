# Copilot Instructions — Take Off Credit Builder

These rules help AI agents work productively in this codebase. Keep guidance terse, actionable, and specific to this repo.

## Architecture and data flow

- Next.js 15 (Pages Router) with TypeScript; UI via Tailwind + shadcn/ui in `src/components/ui/*`.
- Routing in `src/pages/*`; server endpoints in `src/pages/api/*`.
- Services layer in `src/services/*` wraps Supabase and other APIs for client-side use.
- Supabase clients:
  - Public browser client: `src/integrations/supabase/client.ts` (anon key, RLS enforced) — used from services/components.
  - Admin server client: `src/integrations/supabase/admin-client.ts` (service role) — use only in API routes and server code.
- Stripe integration:
  - Server SDK in `src/lib/stripe.ts`; client loader in `src/lib/stripe-client.ts`.
  - Checkout session created in `pages/api/stripe/create-checkout-session.ts` using plan slug → env price ID map.
  - Webhooks handled in `pages/api/stripe/webhook.ts`; on `checkout.session.completed` it writes to `user_booster_accounts` and `payments` via admin client and logs activities, Mailchimp tags, etc.
- Local UX store: `src/lib/account-store.ts` mirrors a subset of account/payment state in `localStorage` to keep the app usable when Stripe/Supabase aren’t configured; don’t treat it as source of truth.

## Key conventions and patterns

- Plan slugs in the UI use underscores (e.g., `starter_boost` in `pages/choose-plan.tsx`). Server maps these to Stripe price IDs via `STRIPE_PRICE_MAP` in `create-checkout-session.ts` using env vars like `STRIPE_STARTER_PRICE_ID`.
- Cross-page flow persists selection in storage:
  - `localStorage.setItem('selectedPlan', ...)` for signup flow; `sessionStorage` for add-ons (see `choose-plan.tsx`, `payment.tsx`).
- Client services call:
  - Supabase directly for reads/mutations under user auth: e.g., `boosterAccountService.getActiveAccounts`.
  - First-party API routes for privileged ops: e.g., `paymentService.createCheckoutSession` → `/api/stripe/create-checkout-session`.
- Only use `createAdminClient()` inside API routes or server-only modules. Never in client components.
- Supabase types live in `src/integrations/supabase/types.ts`; reference table shapes via `Database["public"].Tables[...]` like in `boosterAccountService.ts`.
- Toasts via `use-toast` and `<Toaster />` in `_app.tsx`. Styling helpers via `cn()` in `src/lib/utils.ts`.

## Critical setup and workflows

- Env vars required (see `README.md`): Supabase URL/keys, Stripe keys, webhook secret, Stripe price IDs, optional Mailchimp/PartnerStack keys.
- Stripe is non-optional for paid flows:
  - Webhook secret `STRIPE_WEBHOOK_SECRET` must be set or the dashboard will show 0 accounts after payment (see `TROUBLESHOOTING.md`).
  - For local testing, run Stripe CLI to forward webhooks to `/api/stripe/webhook` and paste the `whsec_*` into `.env.local`.
  - Validate price IDs with `scripts/verify-stripe-prices.js`.
- Dev server: `npm run dev` (Turbopack). Prod-like via PM2 with `ecosystem.config.js`; view logs with `pm2 logs`.
- Fast reset flows: use `scripts/reset-dev.sh` (`--quick` clears browser state; `--env` restarts to pick up `.env.local`; see `DEVELOPMENT_GUIDE.md`).

## When implementing features

- New paid plan:
  - Add the plan card in `pages/choose-plan.tsx` (underscore slug).
  - Create a Stripe Price; set `STRIPE_<PLAN>_PRICE_ID` in `.env.local`.
  - Extend `STRIPE_PRICE_MAP` in `pages/api/stripe/create-checkout-session.ts`.
  - If plan metadata is needed in webhooks, include it in `metadata` when creating the Checkout session.
- Data writes from the client should go through:
  - Supabase browser client when RLS allows the operation; otherwise create an API route and use the admin client server-side.
- Keep webhook handlers idempotent and defensive (see logging style in `webhook.ts`); prefer appending activity logs via `activityService` over throwing for non-critical integrations (Mailchimp).

## Integration notes

- Mailchimp: `src/services/mailchimpService.ts` is optional; guard with `mailchimpService.isConfigured()`.
- PartnerStack: `src/lib/partnerstack.ts` loads SDK on the client and tracks signups/revenue when `NEXT_PUBLIC_PARTNERSTACK_PUBLIC_KEY` is set.
- Vercel deployment uses `vercel.json`; Next config in `next.config.mjs`.

## Examples in this repo

- Checkout creation with plan mapping: `pages/api/stripe/create-checkout-session.ts`.
- Webhook → DB write of account/payment: `pages/api/stripe/webhook.ts`.
- Reading typed rows: `services/boosterAccountService.ts` uses `Database` types.
- Client-side redirect to Stripe with fallback: `pages/payment.tsx` using `getStripe()`.

If any of the above is unclear or you spot a pattern that differs in practice, leave a short note in PR and we’ll iterate these instructions.
