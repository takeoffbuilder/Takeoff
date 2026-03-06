import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/integrations/supabase/admin-client';
import { stripe } from '@/lib/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  const supabase = createAdminClient();

  // Get the affiliate's profile to find the Stripe account ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, stripe_connect_account_id')
    .eq('id', userId)
    .maybeSingle();

  if (profileError || !profile) {
    return res.status(404).json({ error: 'Profile not found', details: profileError });
  }

  // If there is a connected Stripe account, delete it
  if (profile.stripe_connect_account_id) {
    try {
      await stripe.accounts.del(profile.stripe_connect_account_id);
    } catch (err) {
      // Log but do not block account closure if Stripe fails
      console.error('Stripe account deletion error:', err);
    }
  }

  // Mark affiliate account as inactive and set is_affiliate to false
  const { error: appError } = await supabase
    .from('affiliate_applications')
    .update({ affiliate_status: 'inactive' })
    .eq('id', userId);

  const { error: profileError2 } = await supabase
    .from('profiles')
    .update({ is_affiliate: false })
    .eq('id', userId);

  if (appError || profileError2) {
    return res.status(500).json({ error: 'Failed to close affiliate account', details: { appError, profileError2 } });
  }

  return res.status(200).json({ success: true });
}
