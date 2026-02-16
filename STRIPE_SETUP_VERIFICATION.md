# 🔍 Stripe Integration Setup Verification & Fix Guide

## ✅ Current Implementation Status

### What's Already Working:
1. ✅ **Stripe Checkout Sessions API** - Implemented in `/src/pages/api/stripe/create-checkout-session.ts`
2. ✅ **Stripe.js Client Library** - Implemented in `/src/lib/stripe-client.ts`
3. ✅ **Webhook Handler** - Implemented in `/src/pages/api/stripe/webhook.ts`
4. ✅ **All Stripe Keys Configured** - Found in `.env.local`

### What's NOT Working:
❌ **Webhook Signature Verification** - Your webhook secret is invalid/outdated

---

## 🚨 The Problem

Your current webhook secret: `whsec_1dYaEdL140UnBxMHh9OXLdUAFDW8f9Vy`

This secret is likely:
1. From an old/deleted webhook endpoint
2. For a different URL (not matching your current Softgen environment)
3. Needs to be regenerated

**Why This Matters:**
- Payments go through Stripe ✅
- Users see success page ✅
- **BUT** - Accounts aren't created because webhook fails ❌

---

## 🔧 Complete Fix - Step by Step

### **STEP 1: Get Your Current Webhook Endpoint URL**

Your webhook endpoint is:
```
https://3000-8fd1de83-6345-4215-9986-9fb6ca974a09.softgen.dev/api/stripe/webhook
```

**IMPORTANT:** This URL changes with each Softgen deployment!

### **STEP 2: Delete Old Webhook (If Exists)**

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Find any existing webhooks with outdated URLs
3. Click **"..."** menu → **Delete**

### **STEP 3: Create NEW Webhook Endpoint**

1. Go to: https://dashboard.stripe.com/test/webhooks/create
2. Click **"Add endpoint"** button

**Endpoint URL:**
```
https://3000-8fd1de83-6345-4215-9986-9fb6ca974a09.softgen.dev/api/stripe/webhook
```

**Description:** (Optional)
```
Softgen Development - Take Off Credit Builder
```

**Listen to:** Select **"Events on your account"**

**Select events to listen to:**
Click **"Select events"** and choose:

✅ **checkout.session.completed** (CRITICAL - Creates accounts!)
✅ **customer.subscription.created**
✅ **customer.subscription.updated** 
✅ **customer.subscription.deleted**
✅ **invoice.payment_succeeded** (Recurring payments)
✅ **invoice.payment_failed** (Failed payments)

**API Version:** Use latest (default)

3. Click **"Add endpoint"**

### **STEP 4: Copy NEW Webhook Signing Secret**

After creating the webhook, Stripe will show:

**Signing secret:** `whsec_XXXXXXXXXXXXXXXXXXXX`

Click **"Reveal"** to see the full secret, then copy it.

### **STEP 5: Update .env.local File**

**IN YOUR CODE EDITOR (VS Code):**

Open `.env.local` and replace the old webhook secret:

**OLD:**
```
STRIPE_WEBHOOK_SECRET=whsec_1dYaEdL140UnBxMHh9OXLdUAFDW8f9Vy
```

**NEW:**
```
STRIPE_WEBHOOK_SECRET=whsec_YOUR_NEW_SECRET_HERE
```

**⚠️ SAVE THE FILE!**

### **STEP 6: Restart Your Server**

**CRITICAL:** You MUST restart the server for the new secret to load!

**In Softgen Interface:**
1. Click **Settings** (gear icon, top right)
2. Click **"Restart Server"** button

**OR via Terminal:**
```bash
pm2 restart all
```

### **STEP 7: Test Webhook Connection (UPDATED)**

**Back in Stripe Dashboard:**

1. Go to your webhook endpoint details page
2. Click **"Send test event"** button (NOT "Send test webhook")
3. **Note:** Stripe will suggest using CLI - you can ignore this for web testing
4. Select event: `checkout.session.completed`
5. Click **"Send test event"**

**Expected Result:**
- ✅ Status: **200 OK**
- ✅ Response body: `{"received":true}`

**If you see an error:**
- ❌ **400 Error:** Webhook secret doesn't match → Update `.env.local` and restart server
- ❌ **404 Error:** Webhook URL is wrong → Verify URL matches your Softgen environment
- ❌ **500 Error:** Server error → Check `pm2 logs` for details

**Alternative:** Skip test event and proceed directly to Step 8 (real test payment)

### **STEP 8: Make a Real Test Payment**

1. Go to: `/choose-plan` in your app
2. Select a plan (use Starter Boost for testing)
3. Complete payment with test card: `4242 4242 4242 4242`
4. You should be redirected to success page
5. **Check your dashboard** - Active Accounts should now show **1**!

---

## 📊 Verification Checklist

After completing the setup, verify:

### ✅ In Stripe Dashboard:
- [ ] Webhook endpoint exists with correct Softgen URL
- [ ] Webhook has all 6 critical events selected
- [ ] Webhook status shows **"Enabled"**
- [ ] Test webhook returns **200 OK**

### ✅ In Your .env.local:
- [ ] `STRIPE_WEBHOOK_SECRET` matches new signing secret
- [ ] All price IDs are correct (already set)
- [ ] All product IDs are correct (already set)

### ✅ In Server Logs (pm2 logs):
After a test payment, you should see:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔔 WEBHOOK REQUEST RECEIVED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Webhook signature verified successfully
📨 Event type: checkout.session.completed
📦 Processing checkout completion...
✅ Successfully created booster account: [account-id]
✅ Successfully recorded initial payment
✅ Activity logged: Plan added
✅ Activity logged: Payment made
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ WEBHOOK PROCESSING COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### ✅ In Supabase Database:
After test payment, check these tables have records:
- [ ] `user_booster_accounts` - New account row
- [ ] `payments` - Initial payment row
- [ ] `activity_logs` - "Plan added" and "Payment made" entries

### ✅ In Your Dashboard:
- [ ] Active Accounts shows **1** (not 0)
- [ ] Your Booster Accounts section shows the purchased plan
- [ ] Recent Activity shows plan addition and payment

---

## 🎯 Common Issues & Solutions

### Issue 1: "Webhook signature verification failed"
**Cause:** Webhook secret doesn't match or server wasn't restarted
**Fix:** 
1. Copy signing secret from Stripe dashboard again
2. Update `.env.local`
3. Restart server with `pm2 restart all`

### Issue 2: "Webhook endpoint not found (404)"
**Cause:** URL is wrong or server isn't running
**Fix:** 
1. Verify webhook URL matches your Softgen preview URL exactly
2. Ensure `/api/stripe/webhook` is appended
3. Check server is running: `pm2 status`

### Issue 3: "No such price: price_xxx"
**Cause:** Price IDs in `.env.local` don't match Stripe dashboard
**Fix:** 
1. Go to: https://dashboard.stripe.com/test/prices
2. Find each plan's price
3. Update price IDs in `.env.local`
4. Restart server

### Issue 4: Active Accounts Still Shows 0
**Cause:** Webhook processed but frontend hasn't refreshed
**Fix:**
1. Click **"Refresh Dashboard"** button
2. Wait 3-5 seconds (auto-polling active)
3. Check Supabase database directly to verify account was created

### Issue 5: Webhook Events Not Listed
**Cause:** You selected "Events on connected accounts" instead of "Events on your account"
**Fix:**
1. Edit webhook in Stripe dashboard
2. Change to **"Events on your account"**
3. Re-select the 6 critical events

---

## 🔐 Security Notes

### Webhook Signing Secret:
- **NEVER** commit webhook secrets to Git
- Keep `.env.local` in `.gitignore`
- Regenerate secrets if they're exposed

### Environment-Specific Secrets:
- **Test Mode Secret:** Use for Softgen development
- **Live Mode Secret:** Use only in production (different URL)
- Never mix test and live secrets

---

## 📞 Still Having Issues?

### Check These First:
1. **Server Logs:** `pm2 logs` - Look for webhook processing errors
2. **Stripe Logs:** Dashboard → Developers → Logs - See webhook attempts
3. **Supabase Logs:** Supabase Dashboard → Logs → Check for database errors
4. **Browser Console:** F12 → Check for payment redirect errors

### Debug Webhook Issues:
```bash
# View live server logs
pm2 logs --lines 100

# Check if server is running
pm2 status

# Restart server (do this after ANY .env.local changes)
pm2 restart all
```

---

## 🎉 Success Indicators

When everything is working, you'll see:

1. ✅ **Stripe Dashboard:** All webhook events show 200 OK
2. ✅ **Server Logs:** "WEBHOOK PROCESSING COMPLETE" messages
3. ✅ **Dashboard:** Active Accounts increments immediately
4. ✅ **Supabase:** All 3 tables have new records (accounts, payments, activity)
5. ✅ **User Experience:** Smooth payment → redirect → dashboard shows account

---

## 🚀 Ready to Test!

Once you've completed all steps:

1. Make a test payment
2. Watch the magic happen! 🎉
3. Your dashboard should show your active account within 5 seconds

**Test Card:** `4242 4242 4242 4242` (any future date, any 3-digit CVC)

---

**Last Updated:** 2025-10-26
**Environment:** Softgen Development
**Stripe Mode:** Test Mode
