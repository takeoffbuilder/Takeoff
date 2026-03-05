import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/integrations/supabase/admin-client';
import type { Database } from '@/integrations/supabase/types';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    id,
    first_name,
    last_name,
    email,
    phone,
    dob,
    ssn_last_4,
    address,
    city,
    state,
    postal_code,
    country,
    website,
    instagram,
    youtube,
    facebook,
    tiktok,
    subscriber_method,
    payout_type,
  } = body;

  const supabase = createAdminClient();
  // Check if affiliate already exists
  const { data: existing, error: fetchError } = await supabase
    .from('affiliate_applications')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // Unexpected error
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (existing) {
    // Always trigger onboarding if payout_setup_complete is false or affiliate_status is not 'active'
    const needsOnboarding =
      !existing.payout_setup_complete || existing.affiliate_status !== 'active';

    let stripeAccountId = existing.stripe_connect_account_id;
    let account;
    if (!stripeAccountId) {
      account = await stripe.accounts.create({
        type: 'express',
        country: country || 'US',
        email,
        business_type: 'individual',
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
        business_profile: {
          url: website || 'https://example.com',
        },
        individual: {
          phone,
          first_name,
          last_name,
          email,
          dob: dob ? {
            day: new Date(dob).getUTCDate(),
            month: new Date(dob).getUTCMonth() + 1,
            year: new Date(dob).getUTCFullYear(),
          } : undefined,
          address: address ? {
            line1: address,
            city,
            state,
            postal_code,
            country,
          } : undefined,
          ssn_last_4,
        },
        metadata: {
          affiliate_id: id,
          affiliate_email: email,
        },
      });
      stripeAccountId = account.id;
      // Update row with new Stripe account and new fields
      await supabase
        .from('affiliate_applications')
        .update({
          stripe_connect_account_id: stripeAccountId,
          stripe_account: stripeAccountId,
          ssn_last_4,
          city,
          state,
          postal_code,
          country,
        })
        .eq('id', id);
    }

    if (needsOnboarding) {
      // Always create a new onboarding link
      let accountLink;
      try {
        account = await stripe.accounts.create({
          type: 'express',
          country: 'US',
          email,
          business_type: 'individual',
          individual: {
            first_name,
            last_name,
            email,
            phone,
            dob: {
              day,
              month,
              year,
            },
            address: {
              line1: address,
              line2: address2,
              city,
              state,
              postal_code,
              country,
            },
          },
        });
        // Update profiles table with new Stripe Connect account ID
        await admin
          .from('profiles')
          .update({ stripe_connect_account_id: account.id })
          .eq('id', existing.id);
    email,
    business_type: 'individual',
    capabilities: {
      transfers: { requested: true },
      card_payments: { requested: true },
    },
    business_profile: {
      url: website || 'https://example.com',
    },
    individual: {
      first_name,
      last_name,
      email,
      dob: dob ? {
        day: new Date(dob).getUTCDate(),
        month: new Date(dob).getUTCMonth() + 1,
        year: new Date(dob).getUTCFullYear(),
      } : undefined,
      address: address ? {
        line1: address,
        city,
        state,
        postal_code,
        country,
      } : undefined,
      ssn_last_4,
    },
    metadata: {
      affiliate_id: id,
      affiliate_email: email,
    },
  });

  let accountLink;
  try {
    accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'http://localhost:3000/affiliate/onboarding/refresh',
      return_url: 'http://localhost:3000/affiliate/onboarding/return',
      type: 'account_onboarding',
    });
  } catch (err) {
    console.error('Stripe accountLinks.create error:', err);
    return NextResponse.json({ error: 'Stripe onboarding link creation failed', details: err?.message || err }, { status: 500 });
  }

  const { error } = await supabase.from('affiliate_applications').insert([
    {
      id,
      first_name,
      last_name,
      email,
      dob,
      ssn_last_4,
      address,
      city,
      state,
      postal_code,
      country,
      website,
      instagram,
      youtube,
      facebook,
      tiktok,
      subscriber_method,
      stripe_account: account.id,
      affiliate_status: 'pending',
      stripe_connect_account_id: account.id,
      payout_type,
      payout_setup_complete: false,
      stripe_onboarding_url: accountLink.url,
    } as Database['public']['Tables']['affiliate_applications']['Insert'],
  ]);

  // Also update profiles table with affiliate status and Stripe info
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      is_affiliate: true,
      stripe_connect_account_id: account.id,
      stripe_onboarding_url: accountLink.url,
    })
    .eq('id', id);

  if (error || profileError) {
    return NextResponse.json({ error: error?.message || profileError?.message }, { status: 500 });
  }

  return NextResponse.json({ pending: true, url: accountLink.url });
}
