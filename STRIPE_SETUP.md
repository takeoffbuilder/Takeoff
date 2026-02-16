# Stripe Integration Setup Guide

## ⚠️ CRITICAL: Why Your Paid Plans Aren't Showing Up

**Problem:** Users pay successfully, but no account appears in the dashboard.

**Root Cause:** The Stripe webhook secret (`STRIPE_WEBHOOK_SECRET`) is not configured in your `.env.local` file.

**What Happens Without It:**

```
✅ User completes payment → Money is charged
❌ Webhook fails → Account is NOT created in database
❌ Dashboard shows 0 accounts → User paid but got nothing
```

**This MUST be fixed before any payment testing!**

## Complete Setup Checklist

Before testing payments, you MUST complete ALL of these steps:

## Step 0: Configure Webhook (DO THIS FIRST!)

**Why this is absolutely critical:**

Without the webhook secret configured:

1. Stripe charges the customer's card successfully ✅
2. Your webhook endpoint receives the event ❌
3. Your code rejects it (no secret to verify signature) ❌
4. Account is NEVER created in your database ❌
5. User paid but dashboard shows 0 accounts ❌

**This is the #1 cause of "paid but no account" issues.**

### Quick Setup for Local Development:

**Option 1: Stripe CLI (Easiest - Recommended)**

```bash
# 1. Install Stripe CLI
brew install stripe/stripe-cli/stripe  # Mac
# Or download from: https://github.com/stripe/stripe-cli/releases

# 2. Login to Stripe
stripe login

# 3. Forward webhooks to your local server (KEEP THIS RUNNING!)
stripe listen --forward-to localhost:3000/api/stripe/webhook

# You'll see output like:
# > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
#
# Copy that secret (starts with whsec_)

# 4. Add to .env.local
STRIPE_WEBHOOK_SECRET=whsec_...paste_your_secret_here...

# 5. Restart server
pm2 restart all

# 6. IMPORTANT: Keep the Stripe CLI running while testing!
# Open a new terminal for other commands
```

**Option 2: ngrok + Stripe Dashboard (For Production-Like Testing)**

```bash
# 1. Install and run ngrok
ngrok http 3000

# 2. Copy the HTTPS URL shown (e.g., https://abc123.ngrok.io)

# 3. Go to Stripe Dashboard:
https://dashboard.stripe.com/test/webhooks/create

# 4. Add endpoint URL:
https://abc123.ngrok.io/api/stripe/webhook

# 5. Select these events (REQUIRED):

# 6. Copy the "Signing secret" (starts with whsec_)

# 7. Add to .env.local:

# 8. Restart server
pm2 restart all
```

# <<<<<<< HEAD

> > > > > > > c5e564f (Initial commit)

```
✅ Webhook signature verified for event: checkout.session.completed
📦 Processing checkout completion...
Creating booster account for user xxx with plan xxx
✅ Successfully created booster account: [UUID]
✅ Successfully recorded initial payment
```

**2. Stripe Dashboard:**

**3. Database (Supabase):**

**4. User Dashboard:**

## Step 1: Create Products in Stripe Dashboard

Now that webhooks are configured, create the 6 Booster plan products:

1. Go to [Stripe Dashboard - Products](https://dashboard.stripe.com/test/products)
2. Click "Add product" for each plan below
3. **IMPORTANT:** Copy each Price ID (starts with `price_`)

### Create These Products:

**Starter Boost**

**Power Boost**

**Max Boost**

**Blaster Boost**

**Super Boost**

**Star Boost**

## Step 2: Add All Configuration to .env.local

Your `.env.local` file should look like this:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Configuration
STRIPE_SECRET_KEY=your_webhook_secret_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_webhook_secret_here

# CRITICAL: Stripe Webhook Secret (REQUIRED for account creation!)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs (replace with your actual price IDs from Stripe dashboard)
STRIPE_STARTER_PRICE_ID=price_XXXXXXXXXX
STRIPE_POWER_PRICE_ID=price_XXXXXXXXXX
STRIPE_MAX_PRICE_ID=price_XXXXXXXXXX
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 3: Restart Your Development Server

**After adding ALL variables to `.env.local`:**

```bash
pm2 restart all
```

**Verify server started successfully:**

```bash
pm2 logs
# Should see no errors about missing environment variables
```

## Testing Payments

Once fully configured, test with Stripe's test cards:

### Test Cards

### Test Details

````bash
# Clear browser data
# Browser console (F12): localStorage.clear(); sessionStorage.clear();
- Navigate to http://localhost:3000
- Click "Get Started" → Complete signup
- Verify email
- Payment info → Enter test card → Submit

4. **Complete Stripe checkout:**
- Redirects to Stripe checkout page
- Use test card: `4242 4242 4242 4242`
- Complete payment

5. **Verify success:**
- Should redirect to success page
- Click "Go to Dashboard"
- **Dashboard should show 1 active account** ✅

✅ Webhook signature verified
📦 Processing checkout completion
✅ Successfully created booster account

## Troubleshooting Webhook Issues

### Issue: "Webhook Configuration Error: STRIPE_WEBHOOK_SECRET not configured"

**Cause:** Environment variable is missing or not loaded

**Solution:**

```bash
# 1. Verify .env.local has STRIPE_WEBHOOK_SECRET
cat .env.local | grep STRIPE_WEBHOOK_SECRET

# 2. Restart server
pm2 restart all

# 3. Check logs
pm2 logs
````

### Issue: "Webhook signature verification failed"

**Cause:** Wrong webhook secret or Stripe CLI not running

**Solution:**

```bash
# Option 1: If using Stripe CLI
# Make sure it's still running in another terminal
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Option 2: If using ngrok
# Get a fresh ngrok URL and update Stripe dashboard webhook
```

### Issue: Payment succeeds but no account created

**Cause:** Webhook event not reaching your server

**Solution:**

```bash
# 1. Check webhook delivery in Stripe dashboard
https://dashboard.stripe.com/test/webhooks

# 2. Look for failed deliveries or errors
# 4. Verify webhook endpoint is accessible
```

### Issue: Dashboard still shows 0 accounts after payment

2. Webhook event failed to process
3. Database insert failed

**Debug steps:**

```bash
pm2 logs

# 2. Check Supabase for account record
# Check browser console: supabase.auth.getUser()
# 4. Check for database errors in logs
pm2 logs --err
```

## Current Status Summary

**What you have:**

- ✅ Stripe test keys configured
- ✅ Database tables created
- ✅ 6 Booster plans in database

**What you need to complete:**

**After completing these steps:**

## Quick Reference: Complete .env.local Template

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe Keys
STRIPE_SECRET_KEY=your_webhook_secret_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_webhook_secret_here

# CRITICAL: Get this from Stripe CLI or Dashboard
STRIPE_WEBHOOK_SECRET=your_webhook_secret_here

# Create products in Stripe, then add their price IDs here
STRIPE_STARTER_PRICE_ID=price_
STRIPE_POWER_PRICE_ID=price_
STRIPE_MAX_PRICE_ID=price_
STRIPE_BLASTER_PRICE_ID=price_
STRIPE_SUPER_PRICE_ID=price_
STRIPE_STAR_PRICE_ID=price_

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For additional help, see:
