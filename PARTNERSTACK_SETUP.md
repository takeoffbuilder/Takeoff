# PartnerStack Affiliate Program Integration Guide

## 🎉 Integration Status: COMPLETE

PartnerStack has been successfully integrated into the Take Off Credit Builder app! This guide will help you configure your PartnerStack account and connect it to the application.

---

## 📋 What's Already Implemented

### ✅ Core Features

1. **PartnerStack SDK Integration** (`src/lib/partnerstack.ts`)
   - Automatic SDK initialization on app load
   - Signup/conversion tracking
   - Partner registration
   - Revenue tracking for commission calculations
   - Configuration validation

2. **Affiliate Page Enhancement** (`src/pages/affiliate.tsx`)
   - PartnerStack-aware affiliate signup flow
   - Automatic partner registration when users join
   - Link to PartnerStack partner portal
   - Fallback to local tracking if PartnerStack not configured

3. **Conversion Tracking** (`src/pages/success.tsx`)
   - Automatic signup tracking after successful payment
   - Revenue recording for commission calculation
   - User metadata passed to PartnerStack

4. **Environment Configuration** (`.env.local`)
   - Configuration placeholders with setup instructions
   - Clear documentation for required keys

---

## 🚀 Setup Instructions

### Step 1: Create PartnerStack Account

1. **Sign up for PartnerStack:**
   - Go to https://partnerstack.com
   - Click "Get Started" or "Request a Demo"
   - Choose the plan that fits your needs (they offer a free tier)

2. **Complete account setup:**
   - Follow the onboarding wizard
   - Configure your company information
   - Set up your partner program details

### Step 2: Get Your API Keys

1. **Navigate to Integrations:**
   - Log into your PartnerStack dashboard
   - Go to **Settings** → **Integrations**

2. **Get JavaScript SDK Key:**
   - Find the **JavaScript SDK** section
   - Copy your **Public Key** (starts with `pk_`)
   - Save this for the next step

3. **Get Partner API Key:**
   - Go to **Settings** → **API**
   - Generate or copy your **Partner Key**
   - Save this for the next step

### Step 3: Configure Environment Variables

1. **Open your `.env.local` file**

2. **Replace the placeholder keys:**
   ```env
   # PartnerStack Configuration
   NEXT_PUBLIC_PARTNERSTACK_PUBLIC_KEY=pk_your_actual_public_key_here
   PARTNERSTACK_PARTNER_KEY=your_actual_partner_key_here
   ```

3. **Save the file**

### Step 4: Restart Your Server

```bash
# Restart the development server to load new environment variables
pm2 restart all
```

### Step 5: Verify Integration

1. **Test Affiliate Signup:**
   - Navigate to `/affiliate` in your app
   - You should see "PartnerStack Integration Active" badge
   - Click "Become an Affiliate Now"
   - Check PartnerStack dashboard for new partner registration

2. **Test Conversion Tracking:**
   - Complete a full user signup flow
   - Make a test payment
   - On the success page, check browser console for:
     ```
     ✅ PartnerStack: Tracked signup conversion and revenue
     ```
   - Verify the conversion appears in PartnerStack dashboard

---

## 🎯 How It Works

### Affiliate Registration Flow

```
User clicks "Become an Affiliate"
    ↓
Local affiliate store creates affiliate data
    ↓
IF PartnerStack is configured:
    ↓
    Register partner with PartnerStack API
    ↓
    User can access PartnerStack partner portal
ELSE:
    ↓
    Use local tracking only
```

### Conversion Tracking Flow

```
User completes signup → Verifies email → Chooses plan
    ↓
Completes payment information → Stripe checkout
    ↓
Success page loads
    ↓
IF PartnerStack is configured:
    ↓
    Track signup conversion (attributes to affiliate if present)
    ↓
    Track revenue for commission calculation
    ↓
    PartnerStack automatically calculates and manages payouts
```

---

## 📊 PartnerStack Dashboard Features

Once configured, you'll have access to:

### For Program Administrators (You)

- **Partner Management:** View all affiliates, approve/reject applications
- **Performance Analytics:** Track signups, conversions, revenue by partner
- **Commission Management:** Configure payout rules and schedules
- **Automated Payouts:** PartnerStack handles partner payments
- **Fraud Detection:** Built-in tools to detect suspicious activity

### For Affiliates (Your Users)

- **Personal Dashboard:** View referrals, earnings, and performance
- **Marketing Materials:** Access to branded assets and content
- **Payout Requests:** Request payouts when threshold is met
- **Real-time Tracking:** See conversions as they happen

---

## 💡 Integration Benefits

### Without PartnerStack (Local Tracking Only)

- ✅ Affiliate program still works
- ✅ Users can share referral links
- ✅ Basic tracking in app
- ❌ Manual payout management
- ❌ No automated reporting
- ❌ Limited fraud detection

### With PartnerStack Integration

- ✅ Everything above, plus:
- ✅ **Automated payouts** - Set it and forget it
- ✅ **Advanced analytics** - Deep insights into program performance
- ✅ **Partner portal** - Affiliates manage their own data
- ✅ **Fraud detection** - Protect against abuse
- ✅ **Multi-channel tracking** - Track conversions across platforms
- ✅ **Professional experience** - Enterprise-grade affiliate platform

---

## 🔧 Configuration Options

### Customize Your Affiliate Program

In PartnerStack dashboard, you can configure:

1. **Commission Structure:**
   - Default: $10 per signup (as shown in the app)
   - You can adjust this in PartnerStack settings
   - Consider tiered commissions for top performers

2. **Payout Thresholds:**
   - Minimum payout amount (recommended: $50)
   - Payout frequency (weekly, monthly, etc.)
   - Payment methods (PayPal, bank transfer, etc.)

3. **Cookie Duration:**
   - Default: 30 days (as mentioned in the app)
   - Adjust based on your sales cycle
   - Longer duration = more attributed conversions

4. **Approval Process:**
   - Auto-approve affiliates
   - Manual review for quality control
   - Set approval criteria

---

## 🧪 Testing Your Integration

### Test Checklist

- [ ] **Affiliate Registration:**
  - Navigate to `/affiliate`
  - Click "Become an Affiliate Now"
  - Check PartnerStack dashboard for new partner
  - Verify partner receives welcome email

- [ ] **Referral Link:**
  - Copy affiliate referral link
  - Open in incognito/private browser
  - Complete signup flow
  - Verify cookie is set (check browser dev tools)

- [ ] **Conversion Tracking:**
  - Complete full signup with test card
  - Check success page console logs
  - Verify conversion in PartnerStack dashboard
  - Confirm revenue amount is correct

- [ ] **Partner Portal Access:**
  - On affiliate page, click "PartnerStack Portal"
  - Verify affiliate can log in
  - Check that conversions appear in their dashboard

---

## 📈 Best Practices

### For Maximum Affiliate Program Success

1. **Clear Communication:**
   - Update affiliate page with your specific commission structure
   - Provide marketing guidelines and resources
   - Set clear expectations for payouts

2. **Quality Control:**
   - Review affiliate applications
   - Monitor for suspicious activity
   - Remove bad actors promptly

3. **Support Your Affiliates:**
   - Provide marketing materials
   - Share performance tips
   - Respond to questions quickly

4. **Track and Optimize:**
   - Monitor conversion rates by affiliate
   - Identify top performers
   - Adjust commission structure based on data

---

## 🚨 Troubleshooting

### Issue: "PartnerStack SDK not loaded"

**Cause:** API keys not configured or incorrect

**Solution:**
1. Verify keys in `.env.local`
2. Ensure they don't have the placeholder text
3. Restart server: `pm2 restart all`
4. Clear browser cache and reload

### Issue: Conversions not showing in PartnerStack

**Cause:** Tracking code not firing or keys incorrect

**Solution:**
1. Open browser console on success page
2. Look for PartnerStack tracking logs
3. Verify `NEXT_PUBLIC_PARTNERSTACK_PUBLIC_KEY` is set
4. Check PartnerStack dashboard event log for errors

### Issue: Partner registration fails

**Cause:** Invalid email or PartnerStack API issue

**Solution:**
1. Verify `PARTNERSTACK_PARTNER_KEY` is correct
2. Check PartnerStack API status
3. Try with a different email address
4. Contact PartnerStack support if issue persists

---

## 📞 Support Resources

### PartnerStack Documentation
- Website: https://partnerstack.com
- Documentation: https://docs.partnerstack.com
- Support: support@partnerstack.com

### Your App Integration
- Check `src/lib/partnerstack.ts` for implementation details
- Review `src/pages/affiliate.tsx` for UI integration
- See `src/pages/success.tsx` for conversion tracking

---

## 🎯 Next Steps

1. ✅ Sign up for PartnerStack
2. ✅ Get your API keys
3. ✅ Configure `.env.local`
4. ✅ Restart server
5. ✅ Test affiliate registration
6. ✅ Test conversion tracking
7. ✅ Launch your affiliate program!

---

## 💰 Monetization Tips

Your affiliate program is ready to drive growth! Consider:

1. **Early Adopter Bonus:** Offer higher commissions for first 100 affiliates
2. **Performance Tiers:** Reward top performers with increased rates
3. **Seasonal Promotions:** Run special campaigns during key periods
4. **Content Creators:** Recruit influencers in the credit/finance space
5. **Referral Contests:** Gamify with leaderboards and prizes

---

## ✅ Integration Complete!

Your Take Off Credit Builder app now has a fully functional affiliate program with PartnerStack integration. Once you add your API keys and restart the server, you'll have:

- 🚀 Automated conversion tracking
- 💰 Professional partner portal
- 📊 Advanced analytics and reporting
- 💳 Automated payout management
- 🛡️ Built-in fraud protection

**Happy affiliate marketing!** 🎉

---

*For questions about the integration, check the source code comments in:*
- `src/lib/partnerstack.ts` - Core service
- `src/pages/affiliate.tsx` - Affiliate page
- `src/pages/success.tsx` - Conversion tracking