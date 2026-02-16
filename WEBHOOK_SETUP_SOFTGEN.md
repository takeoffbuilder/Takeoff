
# Stripe Webhook Setup for Softgen Development Environment

## 🚨 CRITICAL ISSUE

**Your payments are completing successfully, but no accounts are being created in the database.**

**Root Cause:** Stripe webhooks are not reaching your Softgen development server.

**Evidence from logs:**
```
No webhook activity found in logs
```

This means:
- ✅ User pays → Money charged successfully
- ❌ Webhook event never arrives → Account NOT created
- ❌ Dashboard shows 0 accounts → User paid but got nothing

---

## ✅ SOLUTION: Configure Webhook in Stripe Dashboard

### Step 1: Get Your Webhook Endpoint URL

Your Softgen development server webhook endpoint is:
```
https://3000-8fd1de83-6345-4215-9986-9fb6ca974a09.softgen.dev/api/stripe/webhook
```

### Step 2: Configure in Stripe Dashboard

1. **Open Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/test/webhooks

2. **Click "Add endpoint"**

3. **Endpoint URL:**
   ```
   https://3000-8fd1de83-6345-4215-9986-9fb6ca974a09.softgen.dev/api/stripe/webhook
   ```

4. **Select Events to Listen To:**
   - ✅ `checkout.session.completed` **(CRITICAL - Creates account after payment)**
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

5. **Click "Add endpoint"**

6. **Copy the Signing Secret:**
   - After creating the endpoint, click on it
   - Click "Reveal" next to "Signing secret"
   - Copy the secret (starts with `whsec_`)

### Step 3: Update Your Environment Variable

1. **Check your current .env.local:**
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_1dYaEdL140UnBxMHh9OXLdUAFDW8f9Vy
   ```

2. **Replace with the NEW secret you just copied:**
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_NEW_SECRET_HERE
   ```

3. **Restart the server:**
   ```bash
   pm2 restart all
   ```

---

## ✅ VERIFY WEBHOOK IS WORKING

### Test 1: Make a Test Payment

1. Complete the signup flow
2. Make a payment using test card: `4242 4242 4242 4242`
3. Check server logs immediately:
   ```bash
   pm2 logs
   ```

**You should see:**
```
🔔 Webhook request received!
✅ Webhook signature verified for event: checkout.session.completed
📦 Processing checkout completion...
✅ Successfully created booster account: [UUID]
```

### Test 2: Check Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. Check "Events" tab
4. You should see recent events with "Succeeded" status

### Test 3: Check Database

1. Open Supabase dashboard
2. Go to Table Editor → `user_booster_accounts`
3. You should see a new record with `status = 'active'`

### Test 4: Check Dashboard

1. Navigate to your dashboard: `/dashboard`
2. Should show "1 Active Account" (or more)
3. Account details should be visible

---

## 🚨 COMMON ISSUES

### Issue: Webhook shows "Failed" in Stripe dashboard

**Cause:** Server returned an error or timeout

**Solution:**
1. Check server logs: `pm2 logs --err`
2. Verify webhook secret matches
3. Check server is running: `pm2 list`

### Issue: Webhook shows "Succeeded" but no account created

**Cause:** Webhook processed but database insert failed

**Solution:**
1. Check server logs for database errors
2. Verify Supabase connection
3. Check RLS policies allow inserts
4. Check `SUPABASE_SERVICE_ROLE_KEY` is set

### Issue: Still no webhook logs after configuration

**Cause:** Webhook endpoint URL is incorrect or not accessible

**Solution:**
1. Verify the endpoint URL exactly matches your Softgen dev URL
2. Test the endpoint directly:
   ```bash
   curl -I https://3000-8fd1de83-6345-4215-9986-9fb6ca974a09.softgen.dev/api/stripe/webhook
   ```
3. Should return `405 Method Not Allowed` (expected for GET request)
4. If it returns connection error, the URL is not accessible

---

## 📊 EXPECTED FLOW AFTER SETUP

### Before Webhook Setup:
```
User completes payment → ✅ Stripe charges card
                       → ❌ No webhook received
                       → ❌ No account created
                       → ❌ Dashboard shows 0
```

### After Webhook Setup:
```
User completes payment → ✅ Stripe charges card
                       → ✅ Webhook sent to your server
                       → ✅ Account created in database
                       → ✅ Dashboard shows active account
```

---

## 🎯 QUICK CHECKLIST

Before testing payments again:

- [ ] Webhook endpoint added in Stripe dashboard
- [ ] Endpoint URL matches your Softgen dev URL exactly
- [ ] All 6 events selected (`checkout.session.completed` is critical)
- [ ] Signing secret copied to `.env.local`
- [ ] Server restarted: `pm2 restart all`
- [ ] Server logs are clean: `pm2 logs` shows no errors
- [ ] Ready to test!

---

## 💡 PRO TIP

Keep two terminal windows open during testing:

**Terminal 1: Server Logs (Real-time monitoring)**
```bash
pm2 logs
```

**Terminal 2: Commands**
```bash
# Restart server when needed
pm2 restart all

# Check server status
pm2 list
```

This way you can see webhook events arrive in real-time as you test!

---

## ✅ SUCCESS INDICATORS

When everything is working correctly, you'll see:

1. **Server Logs:**
   ```
   🔔 Webhook request received!
   ✅ Webhook signature verified
   📦 Processing checkout completion
   ✅ Successfully created booster account
   ```

2. **Stripe Dashboard:**
   - Webhook events show "Succeeded"
   - Payment intents show "succeeded"

3. **Supabase Dashboard:**
   - New record in `user_booster_accounts`
   - Record has `status = 'active'`

4. **User Dashboard:**
   - Shows "1 Active Account"
   - Account is clickable and shows details

---

## 🆘 STILL HAVING ISSUES?

If you've completed all steps and webhooks still aren't working:

1. **Check Softgen URL accessibility:**
   - Your Softgen dev URL might not be publicly accessible
   - Contact Softgen support about webhook configuration

2. **Alternative: Use Stripe CLI for local testing:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Then use the webhook secret it provides

3. **Verify environment variables are loaded:**
   ```bash
   # Check if server can see the variables
   pm2 logs | grep "STRIPE_WEBHOOK_SECRET"
   ```

4. **Contact Support with:**
   - Screenshot of Stripe webhook configuration
   - Server logs from `pm2 logs`
   - Stripe webhook event log (from Stripe dashboard)

---

## 📝 AFTER SETUP CHECKLIST

Once webhooks are working:

- [ ] Test payment completes successfully
- [ ] Webhook logs appear in server logs
- [ ] Account appears in database
- [ ] Dashboard shows active account
- [ ] Can make second payment and add another account
- [ ] Both accounts show in dashboard

**You're ready to build your credit! 🚀**
