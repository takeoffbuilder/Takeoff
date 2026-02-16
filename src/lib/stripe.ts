import Stripe from 'stripe';

// Initialize Stripe with your secret key
// Make sure STRIPE_SECRET_KEY is set in your .env.local file
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('⚠️ STRIPE_SECRET_KEY is not set in environment variables');
}

// Use Stripe SDK's default pinned API version for stability.
// Avoid custom preview/future API versions which can break Checkout.
export const stripe = new Stripe(stripeSecretKey || 'sk_test_placeholder_key', {
  // apiVersion intentionally omitted to use SDK default
  typescript: true,
});

// Plan configuration with Stripe price IDs
// IMPORTANT: Update these price IDs in your .env.local file after creating products in Stripe
// Create products at: https://dashboard.stripe.com/test/products (for test mode)
export const STRIPE_PLANS = {
  'starter-boost': {
    name: 'Starter Boost',
    monthlyAmount: 15,
    creditLimit: 500,
    priceId: process.env.STRIPE_STARTER_PRICE_ID || '',
  },
  'power-boost': {
    name: 'Power Boost',
    monthlyAmount: 25,
    creditLimit: 2500,
    priceId: process.env.STRIPE_POWER_PRICE_ID || '',
  },
  'max-boost': {
    name: 'Max Boost',
    monthlyAmount: 35,
    creditLimit: 10000,
    priceId: process.env.STRIPE_MAX_PRICE_ID || '',
  },
  'blaster-boost': {
    name: 'Blaster Boost',
    monthlyAmount: 45,
    creditLimit: 15000,
    priceId: process.env.STRIPE_BLASTER_PRICE_ID || '',
  },
  'super-boost': {
    name: 'Super Boost',
    monthlyAmount: 100,
    creditLimit: 18000,
    priceId: process.env.STRIPE_SUPER_PRICE_ID || '',
  },
  'star-boost': {
    name: 'Star Boost',
    monthlyAmount: 150,
    creditLimit: 20000,
    priceId: process.env.STRIPE_STAR_PRICE_ID || '',
  },
} as const;

export type StripePlanKey = keyof typeof STRIPE_PLANS;

/**
 * Check if Stripe is properly configured
 */
export function isStripeConfigured(): boolean {
  return !!stripeSecretKey && stripeSecretKey !== 'sk_test_placeholder_key';
}

/**
 * Get plan by price ID
 */
export function getPlanByPriceId(
  priceId: string
): (typeof STRIPE_PLANS)[StripePlanKey] | null {
  const entry = Object.entries(STRIPE_PLANS).find(
    ([, plan]) => plan.priceId === priceId
  );
  return entry ? entry[1] : null;
}
