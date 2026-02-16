# Referral / Affiliate Tracking System

Production-ready lightweight schema & API layer.

## Tables

- `referrers`: one row per user who becomes a referrer (unique referral_code, counters, status).
- `referral_clicks`: raw click events (optional referrer_id if code resolved).
- `referred_users`: maps referred user accounts to referrers + conversion state plus one-time payout fields (`payout_amount`, `payout_status`, `paid_at`).
- `referral_payouts` (legacy/optional): historical monthly aggregates; not required for one-time payouts.

## Flow (One-Time Payout Model)

1. User opts-in: POST `/api/referrer/create` -> generates unique `referral_code`.
2. Referrer shares `https://app/signup?ref=CODE`.
3. Landing page logs click: POST `/api/referral/click`.
4. After successful signup: POST `/api/referral/attach` associates new user with referrer.
5. Qualifying paid action (plan purchase) triggers POST `/api/referral/convert`.
6. Conversion sets `converted=true`, stamps `conversion_at`, assigns one-time `payout_amount` and leaves `payout_status='pending'`.
7. Admin or automated job approves / pays: execute `mark_referral_payout_paid(referred_user_id)` (future API route optional).
8. (Optional) Monthly aggregation for reporting only: POST `/api/referrer/cron/aggregate`.

## Security & RLS

- Direct writes to event/counter tables performed via server admin client or SECURITY DEFINER functions.
- RLS allows owners to read their own referrer row and payouts; inserts for `referrers` require auth user matches `user_id`.
- Clicks table locked (no client select) to prevent leaking IPs.
- Aggregation & payouts restricted via `REFERRAL_CRON_SECRET` header.

## Functions

- `generate_referral_code(len)` ensures uniqueness.
- `bump_referrer_click(code)` / `bump_referrer_signup(code)` adjust counters.
- `mark_referral_converted(referred_user)` legacy basic conversion fallback.
- `convert_and_queue_payout(referred_user, amount)` sets conversion + one-time payout fields.
- `mark_referral_payout_paid(referred_user)` marks payout settled.
- `refresh_referral_month(year, month)` (legacy) aggregates conversions for historical reporting.

## Suggested Scheduled Task

Run on first day of month (UTC) for previous month:

```bash
curl -X POST \
  -H "X-Cron-Secret: $REFERRAL_CRON_SECRET" \
  https://yourdomain.com/api/referrer/cron/aggregate
```

(Body optional to override year/month.)

## API Routes Overview

| Route                          | Method | Auth   | Purpose                                         |
| ------------------------------ | ------ | ------ | ----------------------------------------------- |
| `/api/referrer/create`         | POST   | User   | Create/return referral code.                    |
| `/api/referrer/me`             | GET    | User   | Fetch referrer stats (lifetime counters).       |
| `/api/referral/click`          | POST   | None   | Log click event.                                |
| `/api/referral/attach`         | POST   | User   | Attach referred user post-signup.               |
| `/api/referral/convert`        | POST   | User   | One-time conversion & payout queuing.           |
| `/api/referrer/cron/aggregate` | POST   | Secret | (Optional) legacy monthly aggregation (report). |

## Client Helpers

`referralService.ts` abstracts ensuring referrer, attaching code, marking conversion, building links.

## Notes

- One-time payout tracked on `referred_users` (payout_amount, payout_status, paid_at).
- Flat payout amount via env `REFERRAL_PAYOUT_FLAT_AMOUNT` (0 disables auto assignment).
- Consider rate limiting `/api/referral/click` (IP + code) to mitigate spam.
- Add attribution (utm params) into `attribution` JSON for analytics.
- Monthly aggregation now optional; retained for historical summaries only.

## Extending

- Add `commission_rate` (tier logic) to `referrers`.
- Add dynamic payout amounts per purchased plan.
- Add approval workflow (`approved_at`) for payout moderation.

## Troubleshooting

- If referral codes collide, verify function exists and extension `pgcrypto` enabled.
- Ensure `REFERRAL_CRON_SECRET` env present before triggering cron route.
- For missing conversions, inspect `referred_users.converted` and confirm conversion RPC executed.
