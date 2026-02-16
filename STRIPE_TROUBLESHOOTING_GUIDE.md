# 🔧 Stripe Checkout Error Troubleshooting Guide

## 🚨 YOUR CURRENT ISSUE

**Symptom:** Stripe checkout page shows: "Something went wrong. The page you were looking for could not be found. Please check the URL or contact the merchant."

**What This Means:**
- ✅ Payment processes successfully in Stripe
- ✅ User sees success page in Softgen (after delay)
- ❌ Stripe can't redirect to success URL properly
- ❌ Webhook doesn't create account
- ❌ No transaction visible in dashboard

---

## 🎯 ROOT CAUSE ANALYSIS

### Problem 1: Webhook Not Configured or Failing

**Evidence:**
- No accounts being created in database
- No transaction records in Supabase
- Active accounts shows 0 even after payment

**Why This Happens:**
The webhook endpoint needs to be configured in Stripe dashboard with the EXACT URL of your Softgen environment, and the webhook secret must match.

### Problem 2: Success URL Redirect Failing  

**Evidence:**
- "Page not found" error on Stripe checkout
- User eventually sees success page (suggests redirect works after retry)

**Why This Happens:**
- Softgen URL might change between deployments
- Success page might not be accessible when Stripe tries to redirect
- Query parameter format might be causing validation issues

---

## ✅ COMPLETE FIX - STEP BY STEP

### **STEP 1: Verify Your Current Environment**

**Check your `.env.local` file** (already visible in your editor):
```env
NEXT_PUBLIC_APP_URL=https://3000-8fd1de83-6345-4215-9986-9fb6ca974a09.softgen.dev
STRIPE_WEBHOOK_SECRET=whsec_1dYaEdL140UnBxMHh9OXLdUAFDW8f9Vy
```

**Your webhook endpoint URL should be:**
```
https://3000-8fd1de83-6345-4215-9986-9fb6ca974a09.softgen.dev/api/stripe/webhook
```

---

### **STEP 2: Configure Stripe Webhook (CRITICAL)**

**🚨 THIS IS WHY ACCOUNTS AREN'T BEING CREATED!**

1. **Go to Stripe Dashboard:**
   - Open: https://dashboard.stripe.com/test/webhooks

2. **Delete Any Old Webhooks:**
   - Look for webhooks with different URLs
   - Click **"..."** → **Delete** on any old ones

3. **Click "Add endpoint" (or "Create destination")**

4. **Endpoint URL - MUST BE EXACT:**
   ```
   https://3000-8fd1de83-6345-4215-9986-9fb6ca974a09.softgen.dev/api/stripe/webhook
   ```

5. **Description:** (Optional)
   ```
   Softgen Dev - Take Off Credit Builder
   ```

6. **Listen to:** Select **"Events on your account"** (NOT "connected accounts")

7. **Select events to send:**
   - ✅ `checkout.session.completed` **(CRITICAL - Creates accounts!)**
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

8. **Click "Add endpoint"**

9. **COPY THE SIGNING SECRET:**
   - After creating, click on the webhook
   - Click **"Reveal"** next to "Signing secret"
   - Copy the secret (starts with `whsec_`)

---

### **STEP 3: Update Environment Variable**

**In your `.env.local` file, replace the webhook secret:**

**OLD:**
```env
STRIPE_WEBHOOK_SECRET=whsec_1dYaEdL140UnBxMHh9OXLdUAFDW8f9Vy
```

**NEW:**
```env
STRIPE_WEBHOOK_SECRET=whsec_YOUR_NEW_SECRET_FROM_STEP_2
```

**⚠️ CRITICAL: Save the file!**

---

### **STEP 4: Restart Your Server**

**YOU MUST RESTART FOR THE NEW SECRET TO LOAD!**

**Option 1: Via Softgen Interface (Recommended)**
1. Click **Settings** (gear icon, top right)
2. Click **"Restart Server"** button
3. Wait for server to restart (~10-15 seconds)

**Option 2: Via Terminal**
```bash
pm2 restart all
```

**Verify server is running:**
```bash
pm2 list
```

Should show:
```
┌────┬───────────┬─────────┬─────────┬───────────┬──────────┐
│ id │ name      │ mode    │ status  │ cpu      │ mem      │
├────┼───────────┼─────────┼─────────┼──────────┼──────────┤
│ 0  │ nextjs    │ fork    │ online  │ 0%       │ XX.Xmb   │
└────┴───────────┴─────────┴─────────┴──────────┴──────────┘
```

---

### **STEP 5: Test the Fix**

**Now let's verify everything works:**

1. **Clear your browser cache/cookies (important!)**

2. **Start fresh with signup flow:**
   - Go to `/signup`
   - Create NEW account with NEW email
   - Complete email verification

3. **Choose a plan and make payment:**
   - Select any plan (Starter Boost for testing)
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC

4. **Watch for these success indicators:**

   **✅ Expected Flow:**
   - Stripe checkout page loads
   - Enter card details
   - Click "Subscribe"
   - **NEW:** Should redirect cleanly to success page (no error!)
   - Success page shows for 5 seconds
   - Auto-redirects to dashboard
   - Dashboard shows **1 Active Account**

   **❌ If you still see error:**
   - Check pm2 logs immediately: `pm2 logs`
   - Check Stripe webhook logs in dashboard
   - Continue to Step 6

---

### **STEP 6: Monitor Logs During Test**

**Keep terminal open with logs running:**
```bash
pm2 logs --lines 200
```

**What you should see when payment completes:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔔 WEBHOOK REQUEST RECEIVED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Endpoint: /api/stripe/webhook
✅ Webhook signature verified successfully
📨 Event type: checkout.session.completed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 PROCESSING CHECKOUT COMPLETION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ All required metadata present
🎯 Creating account for user: [user-id]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 CREATING BOOSTER ACCOUNT IN DATABASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ BOOSTER ACCOUNT CREATED SUCCESSFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Successfully recorded initial payment
✅ Activity logged: Plan added
✅ Activity logged: Payment made
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ WEBHOOK PROCESSING COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**If you DON'T see these logs:**
- Webhook is not reaching your server
- Check Stripe webhook configuration (Step 2)
- Verify webhook URL is EXACTLY correct
- Check server is running: `pm2 list`

---

## 🔍 VERIFICATION CHECKLIST

After completing all steps, verify:

### ✅ In Stripe Dashboard:

1. **Go to:** https://dashboard.stripe.com/test/webhooks
2. **Click on your webhook endpoint**
3. **Check "Events" tab** - Should show recent events

**What to look for:**
- ✅ Event: `checkout.session.completed`
- ✅ Status: **Succeeded** (green checkmark)
- ✅ Response: 200 OK
- ✅ Time: Recent (within last few minutes)

**If status is "Failed":**
- Click on the failed event
- Check the error message
- Most common: "Webhook signature verification failed"
- Solution: Update webhook secret in `.env.local` and restart server

### ✅ In Supabase Database:

1. **Go to:** Supabase Dashboard → Table Editor
2. **Check these tables:**

**`user_booster_accounts` table:**
- Should have 1 new row
- `status` should be `'active'`
- `user_id` should match your user
- `plan_id` should match chosen plan
- `stripe_subscription_id` should be filled

**`payments` table:**
- Should have 1 new row
- `status` should be `'completed'`
- `amount` should match plan price
- `user_id` should match your user

**`activity_logs` table:**
- Should have 2 new rows:
  - "Plan added"
  - "Payment made"

**If tables are empty:**
- Webhook didn't process successfully
- Check server logs for errors
- Verify webhook secret is correct

### ✅ In Your Dashboard:

1. **Navigate to:** `/dashboard`
2. **Should see:**
   - **Active Accounts:** Shows **1** (not 0!)
   - **Your Booster Accounts** section visible
   - Plan name and details displayed
   - **Upcoming Payments** section shows next payment

**If still shows 0:**
- Click "Refresh Dashboard" button
- Check Supabase database (see above)
- If database has account but dashboard doesn't:
  - Clear browser cache
  - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

---

## 🚨 COMMON ISSUES & SOLUTIONS

### Issue 1: "Webhook signature verification failed"

**Symptom:** Stripe webhook events show "Failed" status

**Cause:** Webhook secret in `.env.local` doesn't match Stripe

**Solution:**
1. Go to Stripe Dashboard → Webhooks
2. Click on your webhook endpoint
3. Click "Reveal" next to signing secret
4. Copy the FULL secret (starts with `whsec_`)
5. Update `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```
6. Restart server: `pm2 restart all`
7. Test again

---

### Issue 2: Still see "Page not found" on Stripe checkout

**Symptom:** Checkout completes but shows error page

**Cause:** Success URL redirect issue

**Solution:**

**A. Verify success page exists:**
```bash
# Check file exists
ls -la src/pages/success.tsx
```
Should show file details, not "No such file"

**B. Test success page directly:**
```
https://3000-8fd1de83-6345-4215-9986-9fb6ca974a09.softgen.dev/success
```
Should load the success page (even without payment)

**C. Check for build errors:**
```bash
pm2 logs --err
```
Look for TypeScript or build errors

**D. Restart server fresh:**
```bash
pm2 delete all
pm2 start ecosystem.config.js
```

---

### Issue 3: Webhook events not appearing in Stripe

**Symptom:** No events listed in Stripe webhook dashboard

**Cause:** Webhook endpoint not properly configured

**Solution:**
1. Delete old webhook in Stripe dashboard
2. Create NEW webhook (see Step 2 above)
3. **CRITICAL:** Use exact URL:
   ```
   https://3000-8fd1de83-6345-4215-9986-9fb6ca974a09.softgen.dev/api/stripe/webhook
   ```
4. Ensure "Events on your account" is selected
5. Select all 6 critical events
6. Save and test

---

### Issue 4: Active Accounts still shows 0 after successful payment

**Symptom:** Payment succeeded, webhook processed, but dashboard shows 0

**Possible Causes:**

**A. Frontend not refreshing:**
- Click "Refresh Dashboard" button
- Wait 5 seconds (auto-polling active)
- Hard refresh browser (Ctrl+Shift+R)

**B. Account created but status not 'active':**
1. Check Supabase `user_booster_accounts` table
2. Look for your user's records
3. Check `status` column - should be `'active'`
4. If status is 'pending' or null:
   - Webhook partially failed
   - Check server logs for database errors

**C. Wrong user_id in database:**
1. Get your user_id from Supabase auth.users table
2. Check if `user_booster_accounts` has matching user_id
3. If user_ids don't match:
   - Authentication issue
   - Sign out and sign in again
   - Try test payment again

---

### Issue 5: "No accounts yet" but payment charged

**Symptom:** Stripe charged card, but no account anywhere

**Cause:** Webhook failed silently

**Solution:**

**Immediate:**
1. Check server logs: `pm2 logs --err --lines 500`
2. Look for these errors:
   - "Missing essential metadata"
   - "Failed to create user booster account"
   - "Database error"

**If you see "Missing essential metadata":**
- Plan configuration issue
- Check `booster_plans` table has all plans
- Verify price IDs in `.env.local` match Stripe

**If you see database errors:**
- Check Supabase connection
- Verify service role key is correct
- Check RLS policies allow webhook inserts

**Recovery:**
1. Note the Stripe payment intent ID
2. Manually create account in Supabase:
   - Open Table Editor → `user_booster_accounts`
   - Insert row with your user_id and plan details
3. Or request refund from Stripe and retry

---

## 📊 EXPECTED FLOW DIAGRAM

### Before Fix:
```
User → Checkout → Payment ✅ → Redirect ❌ (Page not found)
                              ↓
                           Webhook ❌ (Not configured)
                              ↓
                           Account ❌ (Not created)
                              ↓
                        Dashboard: 0 accounts
```

### After Fix:
```
User → Checkout → Payment ✅ → Redirect ✅ (Success page)
                              ↓
                           Webhook ✅ (Processed)
                              ↓
                           Account ✅ (Created)
                              ↓
                        Dashboard: 1 account 🎉
```

---

## 🎯 FINAL CHECKLIST

Before declaring victory:

- [ ] Webhook configured in Stripe with correct URL
- [ ] All 6 events selected (especially `checkout.session.completed`)
- [ ] Webhook signing secret copied to `.env.local`
- [ ] Server restarted after updating `.env.local`
- [ ] Test payment completed successfully
- [ ] Stripe webhook events show "Succeeded"
- [ ] Server logs show webhook processing
- [ ] Supabase has account record
- [ ] Dashboard shows 1 active account
- [ ] Can click on account to see details
- [ ] Can make second payment successfully

**All checked? You're ready to build credit! 🚀**

---

## 🆘 STILL STUCK?

If you've followed all steps and it's still not working:

### Provide to Support:

1. **Stripe Webhook Event Log:**
   - Screenshot from Stripe Dashboard → Webhooks → Events
   - Include event status (succeeded/failed)

2. **Server Logs:**
   ```bash
   pm2 logs --lines 500 > logs.txt
   ```
   - Attach logs.txt

3. **Environment Variables (REDACTED):**
   - Confirm these are set (don't share actual values):
     - STRIPE_WEBHOOK_SECRET: `whsec_...` ✅/❌
     - NEXT_PUBLIC_APP_URL: `https://3000-...` ✅/❌
     - SUPABASE_SERVICE_ROLE_KEY: Set ✅/❌

4. **Database State:**
   - Screenshot of `user_booster_accounts` table
   - Screenshot of `payments` table

5. **Exact Steps Taken:**
   - What worked
   - Where it failed
   - Any error messages seen

---

## 💡 PRO TIPS

### Tip 1: Monitor Everything During Test

**Terminal Window 1: Logs**
```bash
pm2 logs
```

**Terminal Window 2: Commands**
```bash
# Check server status
pm2 list

# Restart if needed
pm2 restart all
```

**Browser Tab 1: Stripe Dashboard**
- Webhooks → Events tab
- Refresh to see new events

**Browser Tab 2: Supabase Dashboard**
- Table Editor → `user_booster_accounts`
- Refresh to see new records

**Browser Tab 3: Your App**
- Dashboard page
- Ready to test

### Tip 2: Test with Fresh User Each Time

When debugging, use a NEW email for each test:
- `test1@example.com`
- `test2@example.com`
- `test3@example.com`

This ensures no cached data interferes.

### Tip 3: Webhook Event History

Stripe keeps webhook event history for 30 days.

To replay a failed event:
1. Stripe Dashboard → Webhooks
2. Click on webhook endpoint
3. Click on failed event
4. Click "Resend event"

Useful if webhook was misconfigured during a real payment.

---

**Last Updated:** 2025-10-31
**Environment:** Softgen Development
**Stripe Mode:** Test Mode
