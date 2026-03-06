import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createAdminClient } from '@/integrations/supabase/admin-client';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!stripeSecretKey) throw new Error('Missing STRIPE_SECRET_KEY env variable');
if (!endpointSecret)
  throw new Error('Missing STRIPE_WEBHOOK_SECRET env variable');
const stripe = new Stripe(stripeSecretKey, {
  // apiVersion: '2023-08-16', // Removed to use default or correct type
});

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: NodeJS.ReadableStream) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  // Logging for debugging
  console.log('Stripe signature:', sig);
  console.log('Buffer length:', buf.length);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, String(sig), endpointSecret);
    console.log('Stripe webhook received → has signature | writes: on');
    console.log('Webhook signature verified');
    console.log('Stripe event type:', event.type);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return res
      .status(400)
      .send(
        `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
  }

  // Handle the event
  switch (event.type) {
    case 'invoice.paid': {
      // This event fires when a recurring payment is successful
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;
      const nextPaymentTimestamp =
        invoice.lines?.data?.[0]?.period?.end || invoice.next_payment_attempt;
      let nextPaymentDate: string | null = null;
      if (nextPaymentTimestamp) {
        // Convert to YYYY-MM-DD
        const d = new Date(nextPaymentTimestamp * 1000);
        nextPaymentDate = d.toISOString().split('T')[0];
      }
      try {
        const supabase = createAdminClient();
        // Find the booster account by Stripe subscription ID
        const { data: account, error: fetchError } = await supabase
          .from('user_booster_accounts')
          .select('id, user_id, plan_slug')
          .eq('stripe_subscription_id', subscriptionId)
          .maybeSingle();
        if (fetchError) {
          console.error('[Webhook] Error fetching booster account for invoice.paid:', fetchError);
          break;
        }
        if (account && account.id && nextPaymentDate) {
          // Update next_payment_date
          const { error: updateError } = await supabase
            .from('user_booster_accounts')
            .update({ next_payment_date: nextPaymentDate })
            .eq('id', account.id);

          // Idempotency: Prevent duplicate payment records for the same invoice or checkout session
          let alreadyExists = false;
          // Check by invoice_id
          if (invoice.id) {
            const { data: existingByInvoice } = await supabase
              .from('payments')
              .select('id')
              .eq('stripe_invoice_id', invoice.id)
              .maybeSingle();
            if (existingByInvoice) alreadyExists = true;
          }
          // Check by checkout_id if not already found
          let stripe_checkout_id = null;
          const stripe_customer_id = invoice.customer || null;
          const plan_slug = account.plan_slug || null;
          if (!alreadyExists && invoice.subscription) {
            console.log('[Webhook] Looking for booster account with stripe_subscription_id:', subscriptionId);
            const { data: paymentSession } = await supabase
              .from('payments')
              .select('stripe_checkout_id')
              .eq('user_id', account.user_id)
              .eq('plan_slug', plan_slug)
              .maybeSingle();
            if (paymentSession && paymentSession.stripe_checkout_id) {
              stripe_checkout_id = paymentSession.stripe_checkout_id;
              // Check for existing payment by checkout_id
              const { data: existingByCheckout } = await supabase
                .from('payments')
                .select('id')
                .eq('stripe_checkout_id', stripe_checkout_id)
                .maybeSingle();
              if (existingByCheckout) alreadyExists = true;
            }
          }
          if (!alreadyExists) {
            // Fetch payment method ID from PaymentIntent if available
            let payment_method_id = null;
            if (typeof invoice.payment_intent === 'string') {
              try {
                const paymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent);
                payment_method_id = paymentIntent.payment_method || null;
              } catch (err) {
                console.warn('[Webhook] Could not fetch payment method for PaymentIntent:', invoice.payment_intent, err);
              }
            }
            const paymentInsertPayload = {
              user_id: account.user_id,
              booster_account_id: account.id,
              stripe_invoice_id: invoice.id,
              stripe_checkout_id,
              stripe_customer_id,
              plan_slug,
              amount: invoice.amount_paid / 100,
              currency: invoice.currency || null,
              status: 'completed',
              created_at: new Date().toISOString(),
              payment_type: 'subscription',
              payment_method_id,
            };
            console.log('[Webhook] Attempting payments insert:', paymentInsertPayload);
            const { error: paymentInsertError, data: paymentInsertData } = await supabase.from('payments').insert(paymentInsertPayload);
            console.log('[Webhook] Payments insert result:', { paymentInsertError, paymentInsertData });
            if (paymentInsertError) {
              console.error('[Webhook] Error inserting payment:', paymentInsertError);
              return res.status(500).json({ error: 'Failed to insert payment', details: paymentInsertError });
            } else {
              console.log('[Webhook] Inserted payment for user:', account.user_id, 'invoice:', invoice.id);
              // Log payment activity using admin client
              try {
                const adminClient = createAdminClient();
                await adminClient
                  .from('activity_logs')
                  .insert({
                    user_id: account.user_id,
                    activity_type: 'payment_made',
                    description: `Payment of $${paymentInsertPayload.amount} processed`,
                    metadata: { amount: paymentInsertPayload.amount, plan_name: plan_slug }
                  });
              } catch (logErr) {
                console.warn('[Webhook] Failed to log payment activity:', logErr);
              }
            }
          }

          // --- Referral crediting after second payment ---
          // Count completed subscription payments for this account
          const { data: payments, error: paymentsError } = await supabase
            .from('payments')
            .select('id')
            .eq('user_id', account.user_id)
            .eq('booster_account_id', account.id)
            .eq('status', 'completed')
            .eq('payment_type', 'subscription');

          if (!paymentsError && payments && payments.length >= 2) {
            // Enhanced logging for referral conversion
            console.log('[Webhook] Referral conversion check:', {
              user_id: account.user_id,
              booster_account_id: account.id,
              payments_count: payments.length,
              payments_ids: payments.map(p => p.id),
            });
            // Check if user was referred
            const { data: referred, error: referredError } = await supabase
              .from('referred_users')
              .select('referrer_id')
              .eq('referred_user_id', account.user_id)
              .maybeSingle();
            console.log('[Webhook] Fetched referred_users:', {
              referred_user_id: account.user_id,
              referred,
              referredError,
            });
            if (!referredError && referred && referred.referrer_id) {
              // Mark the referral as converted and payout_status as approved
              const referralUpdatePayload = {
                converted: true,
                conversion_at: new Date().toISOString(),
                payout_status: 'approved',
                payout_amount: 10.0,
              };
              const { error: referralUpdateError, data: referralUpdateData } = await supabase
                .from('referred_users')
                .update(referralUpdatePayload)
                .eq('referred_user_id', account.user_id);
              console.log('[Webhook] Referral update attempt:', {
                referred_user_id: account.user_id,
                referralUpdatePayload,
                referralUpdateError,
                referralUpdateData,
              });
              if (referralUpdateError) {
                console.error('[Webhook] Error updating referred_users for conversion:', referralUpdateError);
              } else {
                console.log('[Webhook] Set referred_users.converted=true and payout_status=approved for', account.user_id);
              }

              // Increment total_signups in affiliate's profile (read-modify-write)
              const { data: affiliateProfile, error: fetchProfileError } = await supabase
                .from('profiles')
                .select('total_signups')
                .eq('id', referred.referrer_id)
                .maybeSingle();
              console.log('[Webhook] Fetched affiliate profile:', {
                referrer_id: referred.referrer_id,
                affiliateProfile,
                fetchProfileError,
              });
              if (fetchProfileError || !affiliateProfile) {
                console.error('[Webhook] Error fetching affiliate profile for total_signups increment:', fetchProfileError);
              } else {
                const newTotalSignups = (affiliateProfile.total_signups || 0) + 1;
                const { error: profileUpdateError, data: profileUpdateData } = await supabase
                  .from('profiles')
                  .update({ total_signups: newTotalSignups })
                  .eq('id', referred.referrer_id);
                console.log('[Webhook] Affiliate profile update attempt:', {
                  referrer_id: referred.referrer_id,
                  newTotalSignups,
                  profileUpdateError,
                  profileUpdateData,
                });
                if (profileUpdateError) {
                  console.error('[Webhook] Error updating total_signups in affiliate profile:', profileUpdateError);
                } else {
                  console.log('[Webhook] Incremented total_signups for affiliate:', referred.referrer_id);
                }
              }

              // Optionally, insert a payout record for the affiliate
              const now = new Date();
              const period_year = now.getUTCFullYear();
              const period_month = now.getUTCMonth() + 1;

              const payoutPayload = {
                referrer_id: referred.referrer_id,
                period_year,
                period_month,
                amount: 10.0, // Example fixed amount, adjust as needed
                conversions: 1,
                created_at: new Date().toISOString(),
                status: 'approved',
              };
              const { error: payoutInsertError, data: payoutInsertData } = await supabase.from('referral_payouts').insert(payoutPayload);
              console.log('[Webhook] Referral payout insert attempt:', {
                payoutPayload,
                payoutInsertError,
                payoutInsertData,
              });
              if (payoutInsertError) {
                console.error('[Webhook] Error inserting referral_payouts:', payoutInsertError);
              } else {
                console.log('[Webhook] Created referral_payout record for referrer:', referred.referrer_id, 'and user:', account.user_id);
              }
            }
          }

          if (updateError) {
            console.error(
              '[Webhook] Error updating next_payment_date:',
              updateError
            );
          } else {
            console.log(
              '[Webhook] Updated next_payment_date for account',
              account.id,
              'to',
              nextPaymentDate
            );
          }
        } else {
          console.warn(
            '[Webhook] No matching booster account or nextPaymentDate for invoice.paid.'
          );
        }
        // Confirm receipt of invoice.paid event
        return res.status(200).json({ received: true, stripe_invoice_id: invoice.id });
      } catch (err) {
        console.error('[Webhook] Error handling invoice.paid:', err);
        return res.status(200).json({ received: true, stripe_invoice_id: invoice.id });
      }
      break;
    }
    case 'customer.created': {
      const customer = event.data.object as Stripe.Customer;
      const userId = customer.metadata?.user_id;
      console.log('[Webhook] customer.created event:', {
        customerId: customer.id,
        userId,
        metadata: customer.metadata,
      });
      if (userId) {
        const supabase = createAdminClient();
        // Check if user already has a Stripe customer ID
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('id, stripe_customer_id, full_name, first_name, last_name, phone')
          .eq('id', userId)
          .single();
        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 = no rows found
          console.error('[Webhook] Supabase fetch error (profiles):', fetchError);
        }
        let fullName: string | null = null;
        let phone: string | null = null;
        let stripeCustomerId: string | null = null;
        if (existingProfile) {
          stripeCustomerId = existingProfile.stripe_customer_id || null;
          fullName = existingProfile.full_name || (existingProfile.first_name && existingProfile.last_name ? `${existingProfile.first_name} ${existingProfile.last_name}` : null);
          phone = existingProfile.phone || null;
        }
        // If Stripe customer ID already exists, reuse it and update Stripe info
        if (stripeCustomerId) {
          // Update Stripe customer with latest info if needed
          try {
            await stripe.customers.update(stripeCustomerId, {
              name: customer.name || fullName || undefined,
              email: customer.email || undefined,
              phone: customer.phone || phone || undefined,
            });
            console.log('[Webhook] Reused existing Stripe customer:', stripeCustomerId);
          } catch (stripeUpdateErr) {
            console.error('[Webhook] Failed to update existing Stripe customer:', stripeUpdateErr);
          }
          // Update profile with latest Stripe info
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              stripe_name: customer.name,
              stripe_email: customer.email,
              email: customer.email,
            })
            .eq('id', userId);
          if (updateError) {
            console.error('[Webhook] Supabase update error (customer.created):', updateError);
          } else {
            console.log('[Webhook] Updated Stripe info in existing profile:', stripeCustomerId, userId);
          }
        } else {
          // No Stripe customer ID, create new customer and save immediately
          const newCustomerId = customer.id;
          // Save the customer ID to the profile
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              stripe_customer_id: newCustomerId,
              stripe_name: customer.name,
              stripe_email: customer.email,
              email: customer.email,
            })
            .eq('id', userId);
          if (updateError) {
            console.error('[Webhook] Supabase update error (customer.created):', updateError);
          } else {
            console.log('[Webhook] Saved new Stripe customer ID in profile:', newCustomerId, userId);
          }
        }
        // Always try to update Stripe customer with name and phone if available
        if ((!customer.name || !customer.phone) && (fullName || phone)) {
          const updateObj: { name?: string; phone?: string } = {};
          if (fullName && typeof fullName === 'string' && fullName.trim()) {
            updateObj.name = fullName;
          }
          if (phone && typeof phone === 'string' && phone.trim()) {
            updateObj.phone = phone;
          }
          if (Object.keys(updateObj).length > 0) {
            try {
              await stripe.customers.update(customer.id, updateObj);
              console.log('[Webhook] Updated Stripe customer with:', updateObj);
            } catch (stripeUpdateErr) {
              console.error('[Webhook] Failed to update Stripe customer:', stripeUpdateErr);
            }
          } else {
            console.log('[Webhook] Skipping Stripe customer update (no valid name/phone).');
          }
        }
      } else {
        console.warn('[Webhook] No userId found in customer metadata.');
      }
      break;
    }
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('[Webhook] checkout.session.completed event:', {
        sessionId: session.id,
        metadata: session.metadata,
        subscription: session.subscription,
        customer: session.customer,
        payment_status: session.payment_status,
        mode: session.mode,
        status: session.status,
      });
      try {
        const supabase = createAdminClient();
        const userId = session.metadata?.userId;
        const planSlug = session.metadata?.planSlug;
        console.log('[Webhook] Parsed metadata:', { userId, planSlug });
        if (!userId || !planSlug) {
          console.warn(
            '[Webhook] Missing userId or planSlug in session metadata. Skipping writes.'
          );
          break;
        }
        // Fetch full_name, first_name, last_name from profiles table
        let fullName: string | null = null;
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, first_name, last_name')
            .eq('id', userId)
            .single();
          if (profileError) {
            console.warn(
              '[Webhook] Could not fetch profile name fields:',
              profileError
            );
          } else {
            if (profile?.full_name) {
              fullName = profile.full_name;
            } else if (profile?.first_name && profile?.last_name) {
              fullName = `${profile.first_name} ${profile.last_name}`;
            } else {
              fullName = null;
            }
          }
        } catch (profileFetchErr) {
          console.warn('[Webhook] Profile fetch error:', profileFetchErr);
        }

        // Look up plan_id, monthly_amount, and credit_limit from booster_plans using plan_slug
        let planId: string | null = null;
        let monthlyAmount: number | null = null;
        let creditLimit: number | null = null;
        try {
          const { data: planRow, error: planError } = await supabase
            .from('booster_plans')
            .select('id, monthly_amount, credit_limit')
            .eq('plan_slug', planSlug)
            .single();
          if (planError) {
            console.warn(
              '[Webhook] Could not fetch plan_id/monthly_amount/credit_limit for plan_slug:',
              planSlug,
              planError
            );
          } else {
            planId = planRow?.id || null;
            monthlyAmount = planRow?.monthly_amount || null;
            creditLimit = planRow?.credit_limit || null;
          }
        } catch (planFetchErr) {
          console.warn('[Webhook] Plan fetch error:', planFetchErr);
        }

        // Insert booster account with plan_id, plan_slug, monthly_amount, and credit_limit
        if (planId && monthlyAmount && creditLimit) {
          // Fetch Stripe customer ID from profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', userId)
            .single();

          const boosterAccountData = {
            user_id: userId,
            status: 'active',
            created_at: new Date().toISOString(),
            plan_slug: planSlug,
            plan_id: planId,
            monthly_amount: monthlyAmount,
            credit_limit: creditLimit,
            stripe_subscription_id:
              typeof session.subscription === 'string'
                ? session.subscription
                : null,
            stripe_customer_id: profile?.stripe_customer_id || null,
          };
          console.log('[Webhook] Plan lookup result:', { planId, monthlyAmount, creditLimit });
          console.log('[Webhook] Booster account insert payload:', boosterAccountData);
          const { error: boosterError, data: boosterInsertData } = await supabase
            .from('user_booster_accounts')
            .insert(boosterAccountData);
          console.log('[Webhook] Booster account insert result:', { boosterError, boosterInsertData });
          if (boosterError) {
            console.error('[Webhook] Supabase insert error (user_booster_accounts):', boosterError);
          } else {
            console.log('[Webhook] Inserted user_booster_account for user:', userId, 'plan:', planSlug);
            // Log account creation activity using admin client
            try {
              const adminClient = createAdminClient();
              await adminClient
                .from('activity_logs')
                .insert([
                  {
                    user_id: userId,
                    activity_type: 'account_created',
                    description: 'Account successfully created',
                  },
                  {
                    user_id: userId,
                    activity_type: 'plan_added',
                    description: `Added ${planSlug} plan`,
                    metadata: { plan_slug: planSlug, amount: monthlyAmount },
                  },
                ]);
            } catch (logErr) {
              console.warn('[Webhook] Failed to log account creation/plan activity:', logErr);
            }
          }
        } else {
          console.warn('[Webhook] Missing planId, monthlyAmount, or creditLimit. Skipping booster account insert.');
        }

        // Removed payment insert logic from checkout.session.completed handler. Payment records are now only inserted in invoice.paid handler.

        // Update Stripe customer name if fullName is available and not null/empty
        if (
          fullName &&
          typeof fullName === 'string' &&
          fullName.trim() &&
          session.customer
        ) {
          try {
            await stripe.customers.update(
              typeof session.customer === 'string'
                ? session.customer
                : session.customer.id,
              { name: fullName }
            );
            console.log('[Webhook] Updated Stripe customer name to:', fullName);
          } catch (stripeNameErr) {
            console.error(
              '[Webhook] Failed to update Stripe customer name:',
              stripeNameErr
            );
          }
        } else {
          console.log(
            '[Webhook] Skipping Stripe customer name update (no valid fullName).'
          );
        }

        // --- Referral crediting after second payment ---
        try {
          // Find the booster account for this user and plan
          const { data: boosterAccount, error: boosterFetchError } =
            await supabase
              .from('user_booster_accounts')
              .select('id')
              .eq('user_id', userId)
              .eq('plan_slug', planSlug)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
          if (!boosterFetchError && boosterAccount && boosterAccount.id) {
            // Count completed subscription payments for this account
            const { data: payments, error: paymentsError } = await supabase
              .from('payments')
              .select('id')
              .eq('user_id', userId)
              .eq('booster_account_id', boosterAccount.id)
              .eq('status', 'completed')
              .eq('payment_type', 'subscription');
            if (!paymentsError && payments && payments.length >= 2) {
              // Check if user was referred
              const { data: referred, error: referredError } = await supabase
                .from('referred_users')
                .select('referrer_id')
                .eq('referred_user_id', userId)
                .maybeSingle();
              if (!referredError && referred && referred.referrer_id) {
                // Mark the referral as converted and payout_status as approved
                await supabase
                  .from('referred_users')
                  .update({
                    converted: true,
                    conversion_at: new Date().toISOString(),
                    payout_status: 'approved',
                  })
                  .eq('referred_user_id', userId);
                console.log(
                  '[Webhook] Set referred_users.converted=true and payout_status=approved for',
                  userId
                );

                // Optionally, insert a payout record for the affiliate
                const now = new Date();
                const period_year = now.getUTCFullYear();
                const period_month = now.getUTCMonth() + 1;

                await supabase.from('referral_payouts').insert({
                  referrer_id: referred.referrer_id,
                  period_year,
                  period_month,
                  amount: 10.0, // Example fixed amount, adjust as needed
                  conversions: 1,
                  created_at: new Date().toISOString(),
                  status: 'approved',
                });
                console.log(
                  '[Webhook] Created referral_payout record for referrer:',
                  referred.referrer_id,
                  'and user:',
                  userId
                );
              }
            }
          }
        } catch (refCreditErr) {
          console.error(
            '[Webhook] Error crediting referrer after second payment:',
            refCreditErr
          );
        }
      } catch (error) {
        console.error('[Webhook] Supabase write error:', error);
      }
      break;
    }
    case 'account.updated': {
      const account = event.data.object as Stripe.Account;
      console.log('[Webhook] account.updated event:', {
        id: account.id,
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
        tos_acceptance: account.tos_acceptance,
        requirements: account.requirements,
      });
      console.log(
        '[Webhook] Looking for affiliate_applications row with stripe_account:',
        account.id
      );
      try {
        const supabase = createAdminClient();
        // Find affiliate application by stripe_account
        const { data: affiliateApp, error: appError } = await supabase
          .from('affiliate_applications')
          .select('id, affiliate_status, stripe_onboarding_url')
          .eq('stripe_account', account.id)
          .single();
        if (appError) {
          console.error(
            '[Webhook] Supabase error fetching affiliate application:',
            appError
          );
        }
        if (!affiliateApp) {
          console.warn(
            '[Webhook] No affiliate application found for Stripe account:',
            account.id
          );
          break;
        }
        console.log('[Webhook] Found affiliate application:', affiliateApp);
        // If remediation is required, update onboarding link to remediation link
        let remediationLink = null;
        if (account.requirements && account.requirements.current_deadline) {
          remediationLink =
            account.requirements.alternatives?.remediation_url || null;
        }
        if (remediationLink) {
          console.log(
            '[Webhook] Attempting to update onboarding link to remediation link:',
            remediationLink
          );
          const { error: updateRemediationError } = await supabase
            .from('affiliate_applications')
            .update({ stripe_onboarding_url: remediationLink })
            .eq('id', affiliateApp.id);
          if (updateRemediationError) {
            console.error(
              '[Webhook] Failed to update remediation link:',
              updateRemediationError
            );
          } else {
            console.log(
              '[Webhook] Updated onboarding link to remediation link:',
              remediationLink
            );
          }
        }
        // If onboarding is complete, update affiliate status, payout_setup_complete, stripe_connect_account_id, and profile
        if (account.charges_enabled && account.details_submitted) {
          console.log(
            '[Webhook] Stripe account is enabled and details submitted. Attempting to update affiliate status to active.'
          );
// Update affiliate_applications: set affiliate_status, payout_setup_complete, and stripe_account
const { error: updateStatusError } = await supabase
  .from('affiliate_applications')
  .update({
    affiliate_status: 'active',
    payout_setup_complete: true,
    stripe_account: account.id,
  })
  .eq('id', affiliateApp.id);
// Also update profiles: set stripe_connect_account_id and is_affiliate = true
const { error: updateProfileError } = await supabase
  .from('profiles')
  .update({
    stripe_connect_account_id: account.id,
    is_affiliate: true,
  })
  .eq('id', affiliateApp.user_id);
if (updateStatusError || updateProfileError) {
  if (updateStatusError) {
    console.error('[Webhook] Failed to update affiliate_applications status:', updateStatusError);
  }
  if (updateProfileError) {
    console.error('[Webhook] Failed to update profiles table:', updateProfileError);
  }
} else {
  console.log(
    '[Webhook] Updated affiliate status to active, payout_setup_complete, and wrote stripe_account for:',
    affiliateApp.id
  );
}
// Automate referral code creation in profiles table
if (affiliateApp.id) {
  console.log(
    '[Webhook] Attempting to create referral code in profiles for id:',
    affiliateApp.id
  );
            // Automate referral code creation in profiles table

            const { data: profile, error: profileFetchError } = await supabase
              .from('profiles')
              .select('referral_code')
              .eq('id', affiliateApp.id)
              .maybeSingle();
            if (profileFetchError) {
              console.error(
                '[Webhook] Error fetching profile:',
                profileFetchError
              );
            }
            if (!profile?.referral_code) {
              // Generate referral code
              function cryptoRandomFallback(len = 8) {
                const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                let out = '';
                for (let i = 0; i < len; i++)
                  out += chars[Math.floor(Math.random() * chars.length)];
                return out;
              }
              let referral_code = cryptoRandomFallback();
              // Try to use the same RPC if available
              try {
                const { data: codeData, error: genErr } = await supabase.rpc(
                  'generate_referral_code',
                  { p_len: 8 }
                );
                if (!genErr && codeData) {
                  referral_code = codeData;
                }
              } catch (rpcErr) {
                console.warn(
                  '[Webhook] RPC generate_referral_code failed, using fallback:',
                  rpcErr
                );
              }
              const { error: updateErr } = await supabase
                .from('profiles')
                .update({ referral_code })
                .eq('id', affiliateApp.id);
              if (updateErr) {
                console.error(
                  '[Webhook] Failed to set referral_code in profiles:',
                  updateErr
                );
              } else {
                console.log(
                  '[Webhook] Set referral_code in profiles for user:',
                  affiliateApp.id,
                  referral_code
                );
              }
            } else {
              console.log(
                '[Webhook] Referrer already exists for user:',
                affiliateApp.id
              );
            }
          } else {
            console.warn(
              '[Webhook] affiliateApp.id is missing, cannot update profile is_affiliate or create referral code.'
            );
          }
        } else {
          console.log(
            '[Webhook] Stripe account not enabled or details not submitted, skipping affiliate status update.'
          );
        }
      } catch (err) {
        console.error('[Webhook] Error handling account.updated:', err);
      }
      break;
    }
    default:
      console.log(`[Webhook] Unhandled event type ${event.type}`);
  }
  res.json({ received: true });
}
