#!/usr/bin/env node

/**
 * Stripe Price Verification Script
 * 
 * This script verifies that all price IDs in your .env.local file
 * actually exist and are active in your Stripe account.
 * 
 * Usage: node scripts/verify-stripe-prices.js
 */

// Load environment variables from .env.local
import('dotenv').then(dotenv => dotenv.config({ path: '.env.local' })).then(() => {
  // Verify that Stripe secret key is loaded
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ ERROR: STRIPE_SECRET_KEY not found in .env.local');
    console.error('Please ensure .env.local exists and contains STRIPE_SECRET_KEY');
    process.exit(1);
  }
}).then(async () => {
  const { default: Stripe } = await import('stripe');
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  const PRICE_IDS = {
    'Starter Boost': process.env.STRIPE_STARTER_PRICE_ID,
    'Power Boost': process.env.STRIPE_POWER_PRICE_ID,
    'Max Boost': process.env.STRIPE_MAX_PRICE_ID,
    'Blaster Boost': process.env.STRIPE_BLASTER_PRICE_ID,
    'Super Boost': process.env.STRIPE_SUPER_PRICE_ID,
    'Star Boost': process.env.STRIPE_STAR_PRICE_ID,
  };

  async function verifyPrices() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 VERIFYING STRIPE PRICE IDS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let allValid = true;

    for (const [planName, priceId] of Object.entries(PRICE_IDS)) {
      if (!priceId) {
        console.log(`❌ ${planName}: Price ID not configured in .env.local`);
        allValid = false;
        continue;
      }

      try {
        const price = await stripe.prices.retrieve(priceId);

        if (price.active) {
          console.log(`✅ ${planName}: ${priceId}`);
          console.log(`   Amount: $${price.unit_amount / 100}/${price.recurring?.interval || 'one-time'}`);
          console.log(`   Product: ${price.product}`);
          console.log(`   Status: Active\n`);
        } else {
          console.log(`⚠️  ${planName}: ${priceId} (INACTIVE)`);
          console.log(`   This price exists but is not active!\n`);
          allValid = false;
        }
      } catch (error) {
        console.log(`❌ ${planName}: ${priceId}`);
        console.log(`   Error: ${error.message}`);
        console.log(`   This price does NOT exist in your Stripe account!\n`);
        allValid = false;
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (allValid) {
      console.log('✅ ALL PRICES VERIFIED SUCCESSFULLY');
    } else {
      console.log('❌ SOME PRICES ARE INVALID OR MISSING');
      console.log('\n📝 ACTION REQUIRED:');
      console.log('   1. Go to: https://dashboard.stripe.com/test/prices');
      console.log('   2. Create/activate the missing prices');
      console.log('   3. Update .env.local with the correct price IDs');
      console.log('   4. Run this script again to verify');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  verifyPrices().catch(console.error);
});
