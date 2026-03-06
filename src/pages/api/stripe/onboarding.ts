import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/integrations/supabase/admin-client';
import { stripe } from '@/lib/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authenticate user (replace with your auth logic)
  // For demo, assume userId is available in session or JWT
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Fetch user profile from Supabase (profiles table)
  const supabase = createAdminClient();
  const { data: user, error } = await supabase
    .from('profiles')
    .select('id, email, stripe_connect_account_id')
    .eq('id', userId)
    .single();
  if (error || !user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Create Stripe account if not exists
  let stripeAccountId = user.stripe_connect_account_id;
  if (!stripeAccountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
    });
    stripeAccountId = account.id;
    await supabase
      .from('profiles')
      .update({ stripe_connect_account_id: stripeAccountId })
      .eq('id', userId);
  }

  // Create Stripe onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/affiliate-confirmation`,
    return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/affiliate/onboarding/complete`,
    type: 'account_onboarding',
  });

  // Redirect to Stripe onboarding
  res.redirect(accountLink.url);
}
