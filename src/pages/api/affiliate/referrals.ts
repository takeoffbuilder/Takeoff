import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/integrations/supabase/admin-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createAdminClient();
  // Get the affiliate's profile row for this user
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, referral_code')
    .eq('id', userId)
    .maybeSingle();

  if (profileError || !profile) {
    console.error('[Affiliate Referrals API] Referrer lookup error:', profileError);
    return res.status(404).json({ error: 'Referrer not found' });
  }

  // Fetch referred users for this affiliate
  const { data, error } = await supabase
    .from('referred_users')
    .select('id, referred_user_id, referral_code, signup_at, payout_status, payout_amount, converted, conversion_at, paid_at, plan_slug, metadata')
    .eq('referrer_id', profile.id);

  if (error) {
    // Log full error details for debugging
    console.error('[Affiliate Referrals API] Supabase error:', error);
    return res.status(500).json({ error: error.message, details: error });
  }

  res.status(200).json({ referrals: data });
}
