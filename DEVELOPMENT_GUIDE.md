# Development Guide - Reset & Testing

## 🔄 Resetting Your Development Environment

### Quick Reset (Browser State Only)

**When to use:** You want to test the user flow from scratch without clearing database data.

**Steps:**
```bash
# Option 1: Browser Console (F12)
localStorage.clear();
sessionStorage.clear();
window.location.href = '/';

# Option 2: Manual
# - Open DevTools (F12)
# - Application tab → Storage → Clear site data
# - Navigate to http://localhost:3000
```

---

### Full Reset (Browser + Database)

**When to use:** You want to completely clean up test data and start fresh.

**Steps:**

1. **Clear Browser Data:**
   ```javascript
   // In browser console (F12)
   localStorage.clear();
   sessionStorage.clear();
   window.location.href = '/';
   ```

2. **Clear Supabase Test Data:**
   - Open Supabase Dashboard: https://supabase.com/dashboard
   - Navigate to your project
   - Go to "Table Editor"
   - Clear these tables (in order):
     * `payments` (delete all test records)
     * `user_booster_accounts` (delete all test records)
     * `user_personal_info` (delete all test records)
     * `profiles` (optional - keeps auth users)
   
   OR use SQL:
   ```sql
   -- Run in Supabase SQL Editor
   -- ⚠️ WARNING: This deletes ALL data in these tables
   
   DELETE FROM payments;
   DELETE FROM user_booster_accounts;
   DELETE FROM user_personal_info;
   -- DELETE FROM profiles; -- Uncomment if you want to clear profiles too
   ```

3. **Restart Next.js Server:**
   ```bash
   pm2 restart all
   ```

---

### Environment Variable Reset

**When to use:** You've updated `.env.local` (e.g., added Stripe webhook secret, changed API keys)

**Steps:**
```bash
# 1. Save your changes to .env.local
# 2. Restart the server
pm2 restart all

# 3. Clear browser cache
# Browser → DevTools (F12) → Application → Clear site data

# 4. Navigate to homepage
# http://localhost:3000
```

---

## 🧪 Testing User Flows

### Complete Sign-Up Flow (New User)

1. **Start Fresh:**
   - Clear localStorage: `localStorage.clear()`
   - Navigate to: `http://localhost:3000`

2. **Sign Up:**
   - Click "Get Started" or "Sign Up"
   - Enter email and password
   - Verify email (check inbox or Supabase auth dashboard)

3. **Personal Info:**
   - Fill out all required fields
   - Submit

4. **Payment Info:**
   - Enter test card details
   - Enable/disable auto-pay
   - Submit

5. **Confirmation:**
   - Review all details
   - Click "Submit & Complete Setup"

6. **Stripe Checkout:**
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - Complete payment

7. **Success Page:**
   - See success message
   - Click "Go to Dashboard"

8. **Dashboard:**
   - See active account
   - View payment schedule
   - Explore features

---

### Adding Another Booster Account (Existing User)

1. **Start from Dashboard:**
   - Sign in if not already
   - Navigate to dashboard

2. **Add Account:**
   - Click "Add Another Booster Account"
   - Select a different plan

3. **Payment:**
   - Review plan details
   - Click "Checkout with Stripe"

4. **Stripe Checkout:**
   - Complete payment with test card

5. **Success:**
   - See success message
   - Return to dashboard

6. **Verify:**
   - Dashboard should show 2 active accounts
   - Both should be in upcoming payments

---

## 🔍 Debugging Tips

### Check Server Logs

```bash
# View all logs
pm2 logs

# View only errors
pm2 logs --err

# Clear logs
pm2 flush

# Restart server
pm2 restart all
```

### Check Browser Console

```javascript
// Check localStorage data
console.log('localStorage:', { ...localStorage });

// Check sessionStorage data
console.log('sessionStorage:', { ...sessionStorage });

// Check current user
supabase.auth.getUser().then(({ data }) => console.log('Current user:', data));
```

### Check Database

1. **Supabase Dashboard:**
   - Go to Table Editor
   - Check `user_booster_accounts` table
   - Verify `status = 'active'`
   - Check `user_personal_info` for user data

2. **SQL Queries:**
   ```sql
   -- Check user's accounts
   SELECT * FROM user_booster_accounts 
   WHERE user_id = 'your-user-id-here'
   ORDER BY created_at DESC;
   
   -- Check user's payments
   SELECT * FROM payments 
   WHERE user_id = 'your-user-id-here'
   ORDER BY created_at DESC;
   
   -- Check personal info
   SELECT * FROM user_personal_info 
   WHERE user_id = 'your-user-id-here';
   ```

---

## 🎯 Common Issues & Quick Fixes

### Issue: Dashboard shows 0 accounts after payment

**Cause:** Stripe webhook not configured

**Fix:**
```bash
# Set up webhook secret (see STRIPE_SETUP.md)
# Add to .env.local:
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# Restart server
pm2 restart all
```

### Issue: "Personal info not found" error

**Cause:** Data not saved to database

**Fix:**
```bash
# Check Supabase connection
# Verify tables exist
# Check RLS policies allow inserts
# Re-submit personal info form
```

### Issue: Stuck on old page after navigation

**Cause:** Browser cache or localStorage state

**Fix:**
```javascript
// Clear and reload
localStorage.clear();
sessionStorage.clear();
window.location.href = '/';
```

### Issue: Stripe webhook not receiving events

**Cause:** Webhook secret not configured or ngrok/Stripe CLI not running

**Fix:**
```bash
# Option 1: Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Option 2: ngrok
ngrok http 3000
# Then configure webhook in Stripe dashboard
```

---

## 📋 Development Checklist

Before testing a user flow:

- [ ] Server is running (`pm2 list`)
- [ ] Stripe webhook is configured (if testing payments)
- [ ] Browser data is cleared (localStorage, sessionStorage)
- [ ] Database has no conflicting test data
- [ ] Environment variables are up to date
- [ ] Starting from the correct page

---

## 🚀 Quick Commands Reference

```bash
# Server Management
pm2 list                    # Check server status
pm2 restart all            # Restart server
pm2 logs                   # View logs
pm2 flush                  # Clear logs

# Stripe CLI (for webhook testing)
stripe login               # Login to Stripe
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Database
# Use Supabase dashboard or SQL Editor for data management
```

---

## 💡 Pro Tips

1. **Use Separate Test Emails:** Create multiple test accounts for different scenarios
2. **Keep Server Logs Open:** Monitor `pm2 logs` in a separate terminal during testing
3. **Bookmark Supabase Dashboard:** Quick access to check database state
4. **Save Test Cards:** Keep Stripe test card numbers handy
5. **Document Issues:** Note any problems you encounter for future reference
6. **Regular Resets:** Clear browser data regularly to avoid state conflicts

---

For more detailed troubleshooting, see `TROUBLESHOOTING.md`
For Stripe setup instructions, see `STRIPE_SETUP.md`
