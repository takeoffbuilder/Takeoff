import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createAdminClient } from '@/integrations/supabase/admin-client';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!stripeSecretKey) throw new Error('Missing STRIPE_SECRET_KEY env variable');
if (!endpointSecret)
  throw new Error('Missing STRIPE_WEBHOOK_SECRET env variable');
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-08-16',
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
          console.error(
            '[Webhook] Error fetching booster account for invoice.paid:',
            fetchError
          );
          break;
        }
        if (account && account.id && nextPaymentDate) {
          // Update next_payment_date
          const { error: updateError } = await supabase
            .from('user_booster_accounts')
            .update({ next_payment_date: nextPaymentDate })
            .eq('id', account.id);

          // Prevent duplicate payment records for the same invoice
          const { data: existingPayment } = await supabase
            .from('payments')
            .select('id')
            .eq('stripe_invoice_id', invoice.id)
            .maybeSingle();

          if (!existingPayment) {
            // Insert payment record for renewal
            await supabase.from('payments').insert({
              user_id: account.user_id,
              booster_account_id: account.id,
              stripe_invoice_id: invoice.id,
              amount: invoice.amount_paid / 100,
              currency: invoice.currency,
              status: 'completed',
              created_at: new Date().toISOString(),
              payment_type: 'subscription',
            });
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
            // Check if user was referred
            const { data: referred, error: referredError } = await supabase
              .from('referred_users')
              .select('referrer_id')
              .eq('referred_user_id', account.user_id)
              .maybeSingle();
            if (!referredError && referred && referred.referrer_id) {
              // Mark the referral as converted and payout_status as approved
              const { error: referralUpdateError } = await supabase
                .from('referred_users')
                .update({
                  converted: true,
                  conversion_at: new Date().toISOString(),
                  payout_status: 'approved',
                  payout_amount: 10.0,
                })
                .eq('referred_user_id', account.user_id);
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
              if (fetchProfileError || !affiliateProfile) {
                console.error('[Webhook] Error fetching affiliate profile for total_signups increment:', fetchProfileError);
              } else {
                const newTotalSignups = (affiliateProfile.total_signups || 0) + 1;
                const { error: profileUpdateError } = await supabase
                  .from('profiles')
                  .update({ total_signups: newTotalSignups })
                  .eq('id', referred.referrer_id);
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

              const { error: payoutInsertError } = await supabase.from('referral_payouts').insert({
                referrer_id: referred.referrer_id,
                period_year,
                period_month,
                amount: 10.0, // Example fixed amount, adjust as needed
                conversions: 1,
                created_at: new Date().toISOString(),
                status: 'approved',
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
      } catch (err) {
        console.error('[Webhook] Error handling invoice.paid:', err);
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
        // Try to update, if no row exists, insert
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single();
        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 = no rows found
          console.error(
            '[Webhook] Supabase fetch error (profiles):',
            fetchError
          );
        }
        if (existingProfile) {
          // Update existing profile
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              stripe_customer_id: customer.id,
              stripe_name: customer.name,
              stripe_email: customer.email,
              email: customer.email,
            })
            .eq('id', userId);
          if (updateError) {
            console.error(
              '[Webhook] Supabase update error (customer.created):',
              updateError
            );
          } else {
            console.log(
              '[Webhook] Updated Stripe info in existing profile:',
              customer.id,
              userId
            );
          }
        } else {
          // Insert new profile
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              stripe_customer_id: customer.id,
              stripe_name: customer.name,
              stripe_email: customer.email,
              email: customer.email,
              created_at: new Date().toISOString(),
            });
          if (insertError) {
            console.error(
              '[Webhook] Supabase insert error (customer.created):',
              insertError
            );
          } else {
            console.log(
              '[Webhook] Inserted new profile for Stripe customer:',
              customer.id,
              userId
            );
          }
        }
        // If Stripe customer name is missing, fetch from Supabase and update Stripe
        if (!customer.name) {
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
              }
            }
          } catch (profileFetchErr) {
            console.warn('[Webhook] Profile fetch error:', profileFetchErr);
          }
          if (fullName && typeof fullName === 'string' && fullName.trim()) {
            try {
              await stripe.customers.update(customer.id, { name: fullName });
              console.log(
                '[Webhook] Updated Stripe customer name to:',
                fullName
              );
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
          };
          console.log(
            '[Webhook] Attempting Supabase insert (user_booster_accounts):',
            boosterAccountData
          );
          const { error: boosterError } = await supabase
            .from('user_booster_accounts')
            .insert(boosterAccountData);
          if (boosterError) {
            console.error(
              '[Webhook] Supabase insert error (user_booster_accounts):',
              boosterError
            );
          } else {
            console.log(
              '[Webhook] Inserted user_booster_account for user:',
              userId,
              'plan:',
              planSlug
            );
          }
        } else {
          console.warn(
            '[Webhook] Missing planId, monthlyAmount, or creditLimit. Skipping booster account insert.'
          );
        }

        // Insert payment record with stripe_checkout_id and payment_type
        if (planSlug) {
          const paymentData = {
            user_id: userId,
            stripe_checkout_id: session.id,
            amount: session.amount_total || null,
            currency: session.currency || null,
            status: 'completed',
            created_at: new Date().toISOString(),
            plan_slug: planSlug,
            payment_type: 'subscription',
            stripe_customer_id:
              typeof session.customer === 'string'
                ? session.customer
                : (session.customer?.id ?? null),
          };
          console.log(
            '[Webhook] Attempting Supabase insert (payments):',
            paymentData
          );
          const { error: paymentError } = await supabase
            .from('payments')
            .insert(paymentData);
          if (paymentError) {
            console.error(
              '[Webhook] Supabase insert error (payments):',
              paymentError
            );
          } else {
            console.log(
              '[Webhook] Inserted payment for user:',
              userId,
              'checkout:',
              session.id
            );
          }
        } else {
          console.warn('[Webhook] Missing planSlug. Skipping payment insert.');
        }

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
            if (!paymentsError && payments && payments.length === 2) {
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
