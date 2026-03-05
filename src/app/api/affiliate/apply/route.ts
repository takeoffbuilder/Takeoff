import { NextResponse } from 'next/server';
import { createAdminClient } from '@/integrations/supabase/admin-client';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      first_name,
      last_name,
      email,
      dob,
      ssn_last_four,
      address,
      address2,
      city,
      state,
      postal_code,
      country,
      phone,
    } = body || {};
    if (
      !first_name ||
      !last_name ||
      !email ||
      !dob ||
      !address ||
      !city ||
      !state ||
      !postal_code
    ) {
      console.error('[Affiliate] Validation error:', {
        first_name,
        last_name,
        email,
        dob,
        address,
        city,
        state,
        postal_code,
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('[Affiliate] Invalid email format:', email);
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    const admin = createAdminClient();
    // Fetch the profile for this email
    let { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    let profileId;
    let isNewProfile = false;
    if (!profile) {
      // Prepare to create a new profile after Stripe succeeds
      isNewProfile = true;
    } else {
      profileId = profile.id;
    }

// Create Stripe Connect account
let account = null;
try {
  // Enforce MM/DD/YYYY only
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) {
    throw new Error('Date of birth must be in MM/DD/YYYY format');
  }
  const [month, day, year] = dob.split('/').map(Number);
  if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error('Invalid date of birth. Please use MM/DD/YYYY.');
  }
      const stripePayload = {
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
      };
      console.log('[Affiliate][Stripe Payload]', JSON.stringify(stripePayload, null, 2));
      account = await stripe.accounts.create(stripePayload);
      console.log('[Affiliate] Stripe account created:', {
        stripeAccountId: account.id,
        email,
      });
    } catch (err) {
      console.error('[Affiliate] Stripe account creation error:', err && err.message ? err.message : err);
      if (err && err.raw) {
        console.error('[Affiliate] Stripe error details:', JSON.stringify(err.raw, null, 2));
      }
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Stripe account creation error', details: err },
        { status: 400 }
      );
    }

    // Only after Stripe succeeds, insert or update DB rows
    if (isNewProfile) {
      // Create the profile row now
      const { data: newProfile, error: insertError } = await admin
        .from('profiles')
        .insert({
          email,
          first_name,
          last_name,
          full_name: `${first_name} ${last_name}`,
          address,
          address2,
          city,
          state,
          postal_code,
          country,
          phone,
        })
        .select('id')
        .single();
      if (insertError || !newProfile) {
        console.error('[Affiliate] Failed to create profile for new user (after Stripe):', email, insertError);
        return NextResponse.json(
          { error: 'Failed to create profile for new user', details: insertError },
          { status: 500 }
        );
      }
      profileId = newProfile.id;
      profile = newProfile;
      console.log('[Affiliate] Created new profile for user (after Stripe):', { id: profileId, email });
    }
    // Insert affiliate application row
    try {
      const { error } = await admin.from('affiliate_applications').insert({
        id: profileId,
        first_name,
        last_name,
        email,
        dob,
        ssn_last_four,
        address,
        address2,
        city,
        state,
        postal_code,
        country,
        phone,
        stripe_account: '',
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      console.log('[Affiliate] Inserted application:', {
        id: profileId,
        email,
      });
    } catch (err) {
      console.error('[Affiliate] Supabase insert error:', err);
      return NextResponse.json(
        { error: 'Database insert error', details: err },
        { status: 500 }
      );
    }

    // Generate onboarding link
    let onboardingLink = null;
    try {
      onboardingLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: 'http://localhost:3000/affiliate/onboarding/refresh',
        return_url: 'http://localhost:3000/affiliate-confirmation',
        type: 'account_onboarding',
      });
      console.log('[Affiliate] Stripe onboarding link created:', {
        url: onboardingLink.url,
        stripeAccountId: account.id,
      });
    } catch (err) {
      console.error('[Affiliate] Stripe onboarding link error:', err);
      return NextResponse.json(
        { error: 'Stripe onboarding link error', details: err },
        { status: 500 }
      );
    }

    // Update database with Stripe account ID and onboarding link
    try {
      const { error: updateError } = await admin
        .from('affiliate_applications')
        .update({
          stripe_account: account.id,
          stripe_onboarding_url: onboardingLink.url,
        })
        .eq('id', profileId);
      if (updateError) throw updateError;
      console.log(
        '[Affiliate] Updated application with Stripe account and onboarding link:',
        { id: profileId, stripeAccountId: account.id }
      );

      // Also update the profiles table with onboarding link, personal info, and is_affiliate: true
      const { data: profileUpdateData, error: profileError } = await admin
        .from('profiles')
        .update({
          stripe_onboarding_url: onboardingLink.url,
          full_name: `${first_name} ${last_name}`,
          first_name,
          last_name,
          email,
          phone,
          address,
          address2,
          city,
          state,
          postal_code,
          is_affiliate: true,
        })
        .eq('id', profileId)
        .select();
      if (profileError) {
        console.error('[Affiliate] Supabase profile update error:', profileError);
        return NextResponse.json({ error: 'Profile update error', details: profileError }, { status: 500 });
      }
      if (!profileUpdateData || profileUpdateData.length === 0) {
        console.error('[Affiliate] Supabase profile update did not affect any rows:', { id: profileId });
        return NextResponse.json({ error: 'Profile not found or not updated' }, { status: 404 });
      } else {
        console.log('[Affiliate] Updated profiles with onboarding link, personal info, and is_affiliate: true:', { id: profileId, email });

        // Log affiliate activity (idempotent: only insert if none exists yet)
        const { data: existingAffiliateActivity } = await admin
          .from('activity_logs')
          .select('id')
          .eq('user_id', profileId)
          .eq('activity_type', 'affiliate_joined')
          .limit(1)
          .maybeSingle();

        if (!existingAffiliateActivity) {
          const { error: activityError } = await admin
            .from('activity_logs')
            .insert({
              user_id: profileId,
              activity_type: 'affiliate_joined',
              description: 'Became an affiliate',
              metadata: {
                onboarding_status: 'started',
                affiliate_status: 'pending',
              },
            });

          if (activityError) {
            console.warn('[Affiliate] Failed to log affiliate_joined activity:', activityError);
          }
        }
      }
    } catch (err) {
      console.error('[Affiliate] Supabase update error:', err);
      return NextResponse.json(
        { error: 'Database update error', details: err },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true, onboardingUrl: onboardingLink.url },
      { status: 201 }
    );
  } catch (e: unknown) {
    console.error('[Affiliate] Unexpected error:', {
      error: e,
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Internal server error', details: e },
      { status: 500 }
    );
  }
}
