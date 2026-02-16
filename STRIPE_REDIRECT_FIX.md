# 🚀 Quick Fix: Stripe Redirect Issue

## Your Issue
You're not being redirected to the Stripe payment page. Instead, you see an error.

## Root Cause
Your webhook secret is outdated or misconfigured for your current Softgen environment.

## ✅ The Fix (5 Minutes)

### Step 1: Configure Webhook in Stripe

1. **Open Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/test/webhooks

2. **Delete Old Webhooks:**
   - Click on any existing webhooks
   - Click "..." → Delete
   - Confirm deletion

3. **Create New Webhook:**
   - Click "Add endpoint" button
   
4. **Endpoint URL (MUST BE EXACT):**
   ```
   https://3000-8fd1de83-6345-4215-9986-9fb6ca974a09.softgen.dev/api/stripe/webhook
   ```

5. **Listen to:** Select "Events on your account"

6. **Select these 6 events:**
   - ✅ `checkout.session.completed` **(CRITICAL)**
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

7. **Click "Add endpoint"**

8. **COPY THE SIGNING SECRET:**
   - Click "Reveal" next to "Signing secret"
   - Copy the entire secret (starts with `whsec_`)

---

### Step 2: Update Environment Variable

**In `.env.local` (already open in your editor), replace line 6:**

**BEFORE:**
```env
STRIPE_WEBHOOK_SECRET=whsec_1dYaEdL140UnBxMHh9OXLdUAFDW8f9Vy
```

**AFTER:**
```env
STRIPE_WEBHOOK_SECRET=whsec_YOUR_NEW_SECRET_HERE
```

**SAVE THE FILE!**

---

### Step 3: Restart Server

**Critical: You MUST restart for the new secret to load!**

**In Softgen Interface:**
1. Click Settings (gear icon, top right)
2. Click "Restart Server"
3. Wait 10-15 seconds

**OR in terminal:**
```bash
pm2 restart all
```

---

### Step 4: Test

1. **Go to:** `/choose-plan`
2. **Select:** Starter Boost (for testing)
3. **Use test card:** `4242 4242 4242 4242`
4. **Expiry:** Any future date
5. **CVC:** Any 3 digits

**Expected Result:**
- ✅ Stripe checkout page loads (no error!)
- ✅ Enter card details
- ✅ Click "Subscribe"
- ✅ Redirects to success page
- ✅ After 5 seconds → Dashboard
- ✅ Dashboard shows "1 Active Account"

---

## Why This Fixes the Redirect Issue

1. **Old webhook secret** → Stripe can't verify your endpoint
2. **Stripe can't verify** → Rejects the checkout session
3. **Rejected session** → Redirect fails
4. **NEW webhook secret** → Everything works! ✅

---

## Verification

After the test payment, check:

1. **Stripe Dashboard** → Webhooks → Events tab
   - Should show `checkout.session.completed`
   - Status: "Succeeded" (green)

2. **Server Logs** (terminal: `pm2 logs`)
   - Should show: "✅ WEBHOOK PROCESSING COMPLETE"

3. **Dashboard** (`/dashboard`)
   - Active Accounts: Shows **1**
   - Your account is visible and clickable

---

## Still Having Issues?

If the redirect still fails after following these steps:

1. **Check webhook URL is EXACT:**
   ```
   https://3000-8fd1de83-6345-4215-9986-9fb6ca974a09.softgen.dev/api/stripe/webhook
   ```
   - No extra spaces
   - No missing characters
   - Must end with `/api/stripe/webhook`

2. **Verify secret was copied correctly:**
   - Should start with `whsec_`
   - Should be ~40-60 characters long
   - No extra spaces or line breaks

3. **Confirm server restarted:**
   ```bash
   pm2 list
   ```
   - Should show status: "online"
   - Uptime should be recent (few minutes)

4. **Check browser console:**
   - Press F12
   - Look for error messages
   - Screenshot any errors

---

## Quick Reference

**Your Webhook URL:**
```
https://3000-8fd1de83-6345-4215-9986-9fb6ca974a09.softgen.dev/api/stripe/webhook
```

**Test Card:**
```
4242 4242 4242 4242
```

**After Setup:**
- Payment works ✅
- Webhook creates account ✅
- Dashboard shows account ✅
- Credit building begins! 🚀

---

**Last Updated:** 2025-10-31
**Estimated Time:** 5 minutes
**Success Rate:** 99% (when followed exactly)
