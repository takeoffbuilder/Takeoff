# 🔧 Stripe Price ID Configuration Fix

## 🚨 Current Error

```
Invalid Stripe price configuration for this plan. Please contact support. 
(Price ID: price_1SK0en2MfNobhEStEaGrr9TA)
```

## What This Means

The price ID configured for the Power Boost plan doesn't exist in your Stripe account, or it's been deleted/archived.

---

## ✅ Complete Fix - Step by Step

### **Step 1: Verify ALL Price IDs**

Run the verification script to check all your price IDs at once:

```bash
node scripts/verify-stripe-prices.js
```

This will show you exactly which price IDs are invalid.

---

### **Step 2: Check Stripe Dashboard**

1. **Go to:** https://dashboard.stripe.com/test/prices
2. **Check if prices exist for all your plans:**
   - Starter Boost - $15/month
   - Power Boost - $25/month
   - Max Boost - $35/month
   - Blaster Boost - $50/month
   - Super Boost - $100/month
   - Star Boost - $150/month

**If prices are missing, continue to Step 3.**

---

### **Step 3: Create Missing Prices in Stripe**

**For each missing plan, create a price:**

1. **Go to:** https://dashboard.stripe.com/test/products
2. **Click "Add product"**

**Example for Power Boost:**

**Product Information:**
- **Name:** Power Boost
- **Description:** Most popular for faster credit growth - $2500 Builder Account with tri-bureau reporting
- **Image:** (Optional) Upload a logo

**Pricing:**
- **Price:** $25.00
- **Billing period:** Monthly
- **Currency:** USD
- **Recurring:** Yes, monthly

3. **Click "Add product"**
4. **Copy the Price ID** (starts with `price_`)

**Repeat for all missing plans!**

---

### **Step 4: Update .env.local with Correct Price IDs**

**In your `.env.local` file, update the price IDs:**

```env
STRIPE_STARTER_PRICE_ID=price_YOUR_STARTER_PRICE_ID
STRIPE_POWER_PRICE_ID=price_YOUR_POWER_PRICE_ID
STRIPE_MAX_PRICE_ID=price_YOUR_MAX_PRICE_ID
STRIPE_BLASTER_PRICE_ID=price_YOUR_BLASTER_PRICE_ID
STRIPE_SUPER_PRICE_ID=price_YOUR_SUPER_PRICE_ID
STRIPE_STAR_PRICE_ID=price_YOUR_STAR_PRICE_ID
```

**CRITICAL:** Replace `price_YOUR_*_PRICE_ID` with the actual price IDs from Stripe!

---

### **Step 5: Update Product IDs (If Needed)**

If you created new products, also update product IDs:

```env
STRIPE_STARTER_PRODUCT_ID=prod_YOUR_STARTER_PRODUCT_ID
STRIPE_POWER_PRODUCT_ID=prod_YOUR_POWER_PRODUCT_ID
STRIPE_MAX_PRODUCT_ID=prod_YOUR_MAX_PRODUCT_ID
STRIPE_BLASTER_PRODUCT_ID=prod_YOUR_BLASTER_PRODUCT_ID
STRIPE_SUPER_PRODUCT_ID=prod_YOUR_SUPER_PRODUCT_ID
STRIPE_STAR_PRODUCT_ID=prod_YOUR_STAR_PRODUCT_ID
```

---

### **Step 6: Restart Server**

**CRITICAL: You MUST restart for the new IDs to load!**

```bash
pm2 restart all
```

**OR via Softgen Interface:**
1. Click Settings (gear icon)
2. Click "Restart Server"

---

### **Step 7: Verify the Fix**

Run the verification script again:

```bash
node scripts/verify-stripe-prices.js
```

**Expected output:**
```
✅ Starter Boost: price_xxx
   Amount: $15/month
   Status: Active

✅ Power Boost: price_xxx
   Amount: $25/month
   Status: Active

... (all plans showing ✅)
```

---

### **Step 8: Test Payment**

1. Go to `/choose-plan`
2. Select Power Boost
3. Complete payment with test card: `4242 4242 4242 4242`
4. Should complete successfully without errors!

---

## 🎯 Quick Reference: Plan Pricing

When creating prices in Stripe, use these exact amounts:

| Plan | Monthly Price | Credit Limit |
|------|--------------|--------------|
| Starter Boost | $15 | $1,500 |
| Power Boost | $25 | $2,500 |
| Max Boost | $35 | $3,500 |
| Blaster Boost | $50 | $5,000 |
| Super Boost | $100 | $10,000 |
| Star Boost | $150 | $20,000 |

---

## 🔍 Troubleshooting

### Issue: "No such price: price_xxx"

**Cause:** The price ID doesn't exist in Stripe

**Solution:**
1. Go to Stripe Dashboard → Products & Prices
2. Create the missing price
3. Copy the new price ID
4. Update `.env.local`
5. Restart server

---

### Issue: "Price is inactive"

**Cause:** The price was archived in Stripe

**Solution:**
1. Go to Stripe Dashboard → Products & Prices
2. Find the price
3. Click "Activate" or create a new active price
4. Update `.env.local` with active price ID
5. Restart server

---

### Issue: Verification script fails to run

**Cause:** Missing Node.js dependencies

**Solution:**
```bash
npm install
```

Then run the script again.

---

## 📝 Alternative: Manual Verification

If you can't run the script, manually verify each price ID:

1. **Open Stripe Dashboard:** https://dashboard.stripe.com/test/prices
2. **Search for each price ID** from your `.env.local`:
   - `price_1SK0e12MfNobhEStkoLG1Qn2` (Starter)
   - `price_1SK0en2MfNobhEStEaGrr9TA` (Power) ← **THIS ONE IS FAILING**
   - `price_1SK0fJ2MfNobhEStdYOaGrlC` (Max)
   - `price_1SK0fq2MfNobhESt6bCqkjGO` (Blaster)
   - `price_1SK0g52MfNobhEStVuNvqpDL` (Super)
   - `price_1SK0gO2MfNobhESt7ovp4hYr` (Star)

3. **If a price is not found:**
   - Create it (see Step 3 above)
   - Copy the new price ID
   - Update `.env.local`

---

## ✅ Success Checklist

Before testing payments:

- [ ] All 6 price IDs exist in Stripe dashboard
- [ ] All prices are **Active** (not archived)
- [ ] All price IDs updated in `.env.local`
- [ ] Server restarted after updating `.env.local`
- [ ] Verification script shows all ✅
- [ ] Ready to test payment!

---

**Last Updated:** 2025-10-31
**Related Error:** "Invalid Stripe price configuration for this plan"
**Estimated Fix Time:** 10-15 minutes

