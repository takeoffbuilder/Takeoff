# Take Off Credit Builder

A modern credit-building platform built with Next.js, TypeScript, and Supabase.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account
- Stripe account (for payments)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
# or
pm2 start ecosystem.config.js
```

### Development Server

The application runs on `http://localhost:3000`

To restart the server:

```bash
pm2 restart all
```

## 📋 Development Workflow

### Resetting Your Development Environment

During development, you may need to reset your environment to test user flows from scratch:

**Quick Reset (Browser Only):**

```bash
# In browser console (F12)
localStorage.clear();
sessionStorage.clear();
window.location.href = '/';
```

**Full Reset (Browser + Database):**

```bash
# 1. Run the reset script
./scripts/reset-dev.sh --full

# 2. Follow the on-screen instructions
```

**After Environment Variable Changes:**

```bash
# Restart server to pick up .env.local changes
pm2 restart all

# Clear browser cache and reload
```

For detailed reset instructions and testing workflows, see **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)**

## 🔧 Configuration

### Required Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (create products in Stripe dashboard)
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_POWER_PRICE_ID=price_...
STRIPE_MAX_PRICE_ID=price_...
STRIPE_BLASTER_PRICE_ID=price_...
STRIPE_SUPER_PRICE_ID=price_...
STRIPE_STAR_PRICE_ID=price_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Stripe Setup

⚠️ **CRITICAL:** Before testing payments, you MUST configure Stripe webhooks!

See **[STRIPE_SETUP.md](./STRIPE_SETUP.md)** for complete Stripe configuration instructions.

Quick webhook setup for local development:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook secret and add to .env.local
# Restart server: pm2 restart all
```

## 📚 Documentation

- **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** - Development workflows, reset procedures, testing flows
- **[STRIPE_SETUP.md](./STRIPE_SETUP.md)** - Complete Stripe integration setup
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions

## 🎯 Key Features

- **Credit Building Plans:** 6 tiers from Starter to Star Boost
- **Stripe Integration:** Secure payment processing and subscription management
- **User Dashboard:** Account management, payment tracking, credit monitoring
- **Personal Information Management:** Secure storage of user data
- **Affiliate Program:** Earn commissions by referring new users
- **Educational Resources:** Credit-building courses and resources

## 💸 Referral / Affiliate System

The referral program awards a one-time payout when a referred user completes a paid conversion (successful Stripe payment recorded). After conversion, the referral is finalized (no recurring commissions).

### Data Model (Supabase Tables)

- `referrers`: stores referrer profile, referral_code, click/signup counters.
- `referral_clicks`: individual click events (IP + referral_code) with rate limiting.
- `referred_users`: links referred user to referrer and holds payout fields:
  - `payout_amount`, `payout_status` (`pending` | `approved` | `paid` | `rejected`), `paid_at` timestamp
  - `plan_slug` (underscored plan identifier used at conversion)
  - `anonymized_id` exposed in admin/referrer views (privacy)

### Per-Plan Payouts

Configure a JSON map of plan slugs to payout amounts via `REFERRAL_PAYOUT_PLAN_MAP`. Example:

```env
REFERRAL_PAYOUT_FLAT_AMOUNT=25            # Fallback if plan not in map
REFERRAL_PAYOUT_PLAN_MAP={"starter_boost":25,"power_boost":35,"max_boost":50}
```

If a plan slug exists in the map, that amount overrides `REFERRAL_PAYOUT_FLAT_AMOUNT`.

### Required / Optional Environment Variables

```env
# Referral core
REFERRAL_PAYOUT_FLAT_AMOUNT=25
REFERRAL_PAYOUT_PLAN_MAP={"starter_boost":25,"power_boost":35}
ADMIN_EMAILS=admin1@example.com,admin2@example.com

# Optional Redis for rate limiting (improves click spam resistance)
REDIS_URL=redis://localhost:6379
```

### Rate Limiting

- If `REDIS_URL` is set: Redis `SET NX EX 60` prevents duplicate IP+code clicks within 60s.
- Without Redis: fallback database query checks for a click in the last 60 seconds.
  Responses include `rate_limited: true` when throttled.

### Conversion Flow

1. User visits referral link (`?ref=<code>`); click logged with rate limiting.
2. User signs up; `/api/referral/attach` ties auth user to referrer.
3. On paid Stripe completion (webhook + internal payment record), backend calls conversion logic (`/api/referral/convert`) with `plan_slug`.
4. System assigns `payout_amount` based on plan map or flat fallback and sets `payout_status='pending'`.
5. Admin reviews payout in `admin/referral-payouts` and may approve → pay.
6. Payment verification ensures at least one legitimate paid `payments` row exists before approval/pay transitions.

### Admin Dashboard (`/admin/referral-payouts`)

- Lists pending and approved payouts with anonymized referred user IDs.
- Actions: Approve, Reject, Mark Paid (records `paid_at`).
- Prevents approval/payment if no verified payment exists.

### Testing the Referral Flow Locally

```bash
# 1. Ensure migrations applied (Supabase CLI or studio) for referral tables.
# 2. Set referral env vars in .env.local and restart server.
pm2 restart all

# 3. (Optional) Start Redis for better rate limiting
docker run -p 6379:6379 -d redis:7-alpine

# 4. Start Stripe webhook listener (critical for payment confirmation)
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 5. Create a referrer (from app UI or direct API)
curl -X POST http://localhost:3000/api/referrer/create -H 'Authorization: Bearer <JWT>'

# 6. Simulate referral click
open "http://localhost:3000/?ref=<REFERRAL_CODE>"

# 7. Complete signup and run a test payment (Stripe test card)

# 8. After webhook processes, call convert (if not auto-triggered)
curl -X POST http://localhost:3000/api/referral/convert -H 'Authorization: Bearer <ADMIN_JWT>' \
	-H 'Content-Type: application/json' \
	-d '{"user_id":"<REFERRED_USER_ID>","plan_slug":"starter_boost"}'

# 9. Visit admin dashboard to approve then mark paid.
```

### Troubleshooting

- Payout remains `pending`: Ensure Stripe webhook created a `payments` row; check `STRIPE_WEBHOOK_SECRET`.
- `rate_limited: true` constantly: Verify Redis TTL (60s) or overlapping rapid test clicks.
- Admin actions blocked: Confirm your email is in `ADMIN_EMAILS` and that auth token reflects that user.

### Future Enhancements (Planned)

- Redis-based per-referrer daily quotas.
- Tiered commission (commission_rate) & dynamic plan rules.
- Extended analytics (aggregate sums, filtering by plan_slug, date ranges).

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (Pages Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Payments:** Stripe
- **Server Management:** PM2

## 📊 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── StarField.tsx   # Background animation
│   └── LandingPage.tsx # Homepage component
├── pages/              # Next.js pages
│   ├── api/           # API routes
│   ├── auth/          # Auth pages
│   ├── index.tsx      # Homepage
│   ├── dashboard.tsx  # User dashboard
│   └── ...            # Other pages
├── services/          # API service layer
│   ├── authService.ts
│   ├── profileService.ts
│   └── boosterAccountService.ts
├── lib/               # Utilities
├── types/             # TypeScript types
└── styles/            # Global styles

supabase/
└── migrations/        # Database migrations
```

## 🧪 Testing

### Test Cards (Stripe)

- **Visa:** `4242 4242 4242 4242`
- **Mastercard:** `5555 5555 5555 4444`
- **American Express:** `3782 8224 6310 005`

**Test Details:**

- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (or 4 for Amex)
- ZIP: Any 5 digits

### Testing User Flows

See **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** for complete testing workflows.

## 🚨 Common Issues

### Dashboard Shows 0 Accounts After Payment

**Cause:** Stripe webhook not configured

**Solution:**

1. Configure webhook secret in `.env.local`
2. Restart server: `pm2 restart all`
3. See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for details

### Personal Info Not Saving

**Cause:** Database connection or RLS policies

**Solution:**

1. Check Supabase connection
2. Verify RLS policies in Supabase dashboard
3. Check browser console for errors

For more issues and solutions, see **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**

## 🤝 Support

If you encounter issues:

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review server logs: `pm2 logs`
3. Check browser console for errors
4. Verify environment variables are correct
5. Contact Softgen support if issues persist

## 📄 License

© 2025 Take Off Credit Inc. All Rights Reserved.
