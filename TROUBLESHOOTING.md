# Troubleshooting Guide

## ⚠️ CRITICAL: Webhook Configuration Required

**Before testing payments, you MUST configure the Stripe webhook secret.**

Without this configuration:
- ❌ Payments will complete in Stripe
- ❌ Money will be charged successfully  
- ❌ But NO account will be created in your database
- ❌ Dashboard will show 0 accounts
- ❌ You'll lose track of which users paid

### Quick Fix for Local Testing

**Option 1: Stripe CLI (Recommended for Development)**

1. **Install Stripe CLI**:
   ```bash
   # Mac/Linux
   brew install stripe/stripe-cli/stripe
   
   # Windows
   # Download from: https://github.com/stripe/stripe-cli/releases
   ```

2. **Login to Stripe CLI**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to your local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   
4. **Copy the webhook signing secret** shown (starts with `whsec_`)

5. **Add to .env.local**:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...your_secret_here...
   ```

6. **Restart server**:
   ```bash
   pm2 restart all
   ```

7. **Keep the Stripe CLI running** while you test payments

**Option 2: Public Webhook URL (For Production-Like Testing)**

If you need to test without keeping Stripe CLI running:

1. **Expose your local server using ngrok**:
   ```bash
   # Install ngrok: https://ngrok.com/download
   ngrok http 3000
   ```

2. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`)

3. **Configure webhook in Stripe Dashboard**:
   - Go to https://dashboard.stripe.com/test/webhooks/create
   - Endpoint URL: `https://abc123.ngrok.io/api/stripe/webhook`
   - Select events:
     * `checkout.session.completed` (CRITICAL)
     * `customer.subscription.updated`
     * `customer.subscription.deleted`
     * `invoice.payment_succeeded`
     * `invoice.payment_failed`
   - Copy the "Signing secret"

4. **Add to .env.local**:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...your_secret_here...
   ```

5. **Restart server**:
   ```bash
   pm2 restart all
   ```

### Verify Webhook is Working

After configuration, test a payment and check:

1. **Server Logs** (`pm2 logs`):
   ```
   ✅ Webhook signature verified for event: checkout.session.completed
   📦 Processing checkout completion...
   ✅ Successfully created booster account: [UUID]
   ```

2. **Stripe Dashboard**:
   - Go to: https://dashboard.stripe.com/test/webhooks
   - Click on your webhook
   - Check "Events" tab for delivery status
   - Should show "Succeeded" status

3. **Database**:
   - Open Supabase dashboard
   - Check `user_booster_accounts` table
   - Should see new record for your user

## Dashboard Shows 0 Active Accounts After Payment

**Problem:** After completing payment, the dashboard shows 0 active accounts instead of showing your new account.

**Root Cause:** The Stripe webhook is not properly configured. After successful payment, Stripe sends a webhook event to create the account in your database. Without the webhook secret configured, this fails silently.

**Solution:**

1. **Configure Stripe Webhook (REQUIRED)**:
   ```bash
   # Step 1: Go to Stripe Dashboard
   https://dashboard.stripe.com/test/webhooks/create
   
   # Step 2: Add your webhook endpoint URL
   # For development: Use ngrok or similar tool to expose localhost
   # For production: https://your-domain.com/api/stripe/webhook
   
   # Step 3: Select these events:
   - checkout.session.completed
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
   
   # Step 4: Copy the "Signing secret" (starts with whsec_)
   
   # Step 5: Add to .env.local:
   STRIPE_WEBHOOK_SECRET=whsec_your_signing_secret_here
   
   # Step 6: Restart server
   pm2 restart all
   ```

2. **Verify Webhook is Working**:
   - Make a test payment
   - Check server logs: `pm2 logs` - you should see "✅ Webhook signature verified"
   - Check Stripe dashboard webhook logs for delivery status

3. **After Webhook is Configured**:
   - Complete the signup flow again
   - Your payment will process successfully through Stripe
   - The webhook will automatically create your account in the database
   - Dashboard will show your active account

## Testing Webhooks Locally

For local development, you can use Stripe CLI to forward webhooks:

```bash
# Install Stripe CLI
# Visit: https://stripe.com/docs/stripe-cli#install

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook signing secret shown and add to .env.local
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Complete Stripe Setup (see STRIPE_SETUP.md):
   - Create products in Stripe dashboard
   - Add price IDs to .env.local
   - Restart server with `pm2 restart all`

2. **After Stripe is configured:**
   - Complete the signup flow again
   - Your payment will process successfully through Stripe
   - The webhook will create your account in the database
   - Dashboard will show your active account

## Multiple Accounts Appearing When Clicking "Add First Account"

**Problem:** Clicking "Add First Account" creates multiple accounts or shows 3 accounts (paid, current balance, pending).

**Root Cause:** This happens when:
1. Stripe webhook is not configured, so the payment flow creates mock data
2. The app falls back to the test data system when webhooks aren't working
3. Multiple clicks or navigation issues cause duplicate mock entries

**Solution:**

1. **Configure Stripe webhook first** (see above)
2. **Clear mock/test data**:
   - The 3 accounts you're seeing are from the mock data system
   - Once webhook is configured, real accounts will be created instead
3. **Follow the proper flow:**
   - Sign up → Verify email → Personal info → Payment info → Confirmation → Stripe checkout → Success → Dashboard

## First Name Not Showing on Dashboard

**Problem:** Dashboard shows "Welcome to Your Dashboard" instead of "Welcome back, [Your Name]!"

**Root Cause:** Personal information wasn't saved to the database, or the dashboard isn't loading it properly.

**Solution:**

1. **Check that personal info was submitted:**
   - Go through the signup flow completely
   - Make sure you filled out the personal info form
   - Personal info should be saved before payment

2. **If the problem persists:**
   - Sign out and sign in again
   - Check that your profile data exists in the Supabase dashboard

## Payment Errors

**Common Error Messages:**

### "No such price: 'price_...'"
- **Meaning:** The Stripe price ID in your environment variables doesn't exist in your Stripe account
- **Solution:** Create the product in Stripe dashboard and update the price ID in .env.local

### "Configuration Error: No Stripe price ID configured"
- **Meaning:** The environment variable for this plan is missing or empty
- **Solution:** Add the correct STRIPE_[PLAN]_PRICE_ID to .env.local

### "Invalid Stripe price configuration"
- **Meaning:** The price ID exists in .env.local but is invalid or doesn't exist in Stripe
- **Solution:** Verify the price ID in Stripe dashboard and update .env.local

### "Webhook Configuration Error"
- **Meaning:** STRIPE_WEBHOOK_SECRET is not set in .env.local
- **Solution:** Follow webhook setup instructions above

## Preventing Issues

**Best Practices:**

1. **Complete Stripe setup BEFORE testing payments** (including webhook configuration)
2. **Use test mode in Stripe** for development
3. **Use Stripe test cards** for testing (see STRIPE_SETUP.md)
4. **Monitor webhook logs** in Stripe dashboard and server logs (`pm2 logs`)
5. **Wait for redirects** - don't click buttons multiple times
6. **Check webhook logs** in Stripe dashboard if issues persist

## Checking Server Logs

To see detailed webhook processing logs:

```bash
# View all logs
pm2 logs

# View only error logs
pm2 logs --err

# Clear logs and start fresh
pm2 flush
```

Look for these indicators:
- ✅ Success messages (green checkmarks in logs)
- ❌ Error messages (red X marks in logs)
- 📨 Webhook event processing
- 📦 Account creation confirmations

## Still Having Issues?

If problems continue after following this guide:

1. Check browser console for errors
2. Check server logs: `pm2 logs` for webhook processing
3. Check Stripe dashboard webhook logs for delivery status
4. Verify all environment variables are set correctly
5. Check Supabase tables for data consistency
6. Contact support with error messages and steps to reproduce
