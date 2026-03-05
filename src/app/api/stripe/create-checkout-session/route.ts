import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/integrations/supabase/admin-client';

const STRIPE_PRICE_MAP: Record<string, string> = {
  starter_boost: process.env.STRIPE_STARTER_PRICE_ID || '',
  power_boost: process.env.STRIPE_POWER_PRICE_ID || '',
  max_boost: process.env.STRIPE_MAX_PRICE_ID || '',
  blaster_boost: process.env.STRIPE_BLASTER_PRICE_ID || '',
  super_boost: process.env.STRIPE_SUPER_PRICE_ID || '',
  star_boost: process.env.STRIPE_STAR_PRICE_ID || '',
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { planId, userId, email } = body || {};
    if (!planId || !userId || !email) {
      return NextResponse.json({ error: 'Missing required fields: planId, userId, email' }, { status: 400 });
    }

    const priceId = STRIPE_PRICE_MAP[planId];
    if (!priceId) {
      return NextResponse.json({ error: `No Stripe price configured for plan '${planId}'.` }, { status: 400 });
    }

    // Prevent duplicate purchases of the same plan when an account is already active/pending
    try {
      type ExistingRow = {
        id: string;
        status: 'active' | 'pending' | 'cancelled' | string;
        booster_plans?: { plan_slug?: string | null } | null;
      };
      const admin = createAdminClient();
      const { data: existing, error: existingErr } = await admin
        .from('user_booster_accounts')
        .select(
          `
          id,
          status,
          booster_plans!plan_id (
            plan_slug
          )
        `
        )
        .eq('user_id', userId)
        .in('status', ['active', 'pending']);

      if (existingErr) {
        console.error('Duplicate check failed:', existingErr);
      } else if (existing && existing.length > 0) {
        const hasSamePlan = (existing as ExistingRow[]).some(
          (row) => row?.booster_plans?.plan_slug === planId
        );
        if (hasSamePlan) {
          return NextResponse.json({
            error:
              'You already have this plan active on your account. Please cancel the existing subscription first before purchasing the same plan again.',
          }, { status: 409 });
        }
      }
    } catch (dupCheckErr) {
      // Do not block checkout on a transient read failure; just log it.
      console.warn(
        'Duplicate plan guard encountered an error, proceeding:',
        dupCheckErr
      );
    }

    // Base URLs
    const base = (
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000'
    ).replace(/\/$/, '');
    const successUrl = `${base}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${base}/payment?canceled=1`;

    // Look up Stripe customer ID from profiles table
    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();
    let stripeCustomerId = profile?.stripe_customer_id;
    // If no Stripe customer ID, create one and store it
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { user_id: userId }
      });
      stripeCustomerId = customer.id;
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', userId);
    }
    // Create checkout session using the Stripe customer ID
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer: stripeCustomerId,
      subscription_data: {
        metadata: { userId, planSlug: planId },
      },
      metadata: { userId, planSlug: planId },
    });

    console.log('✅ Checkout session created:', session.id);
    console.log('🔗 Checkout URL:', session.url);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to create checkout session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
