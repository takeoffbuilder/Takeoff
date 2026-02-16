import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/integrations/supabase/admin-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  const supabase = createAdminClient();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_connect_account_id')
    .eq('id', userId)
    .single();
  if (profileError || !profile?.stripe_connect_account_id) {
    return res.status(404).json({ error: 'No Stripe account found' });
  }
  try {
    const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);
    if (account.charges_enabled && account.details_submitted) {
      res.json({ status: 'complete' });
    } else {
      res.json({ status: 'pending' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Stripe API error', detail: err instanceof Error ? err.message : String(err) });
  }
}
