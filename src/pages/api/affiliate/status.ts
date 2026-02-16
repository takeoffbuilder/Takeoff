import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/integrations/supabase/admin-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createAdminClient();
  // Query by id (which is the user ID)
  const { data, error } = await supabase
    .from('affiliate_applications')
    .select('affiliate_status, id')
    .eq('id', userId)
    .single();
  if (error || !data) {
    return res.status(404).json({
      status: 'pending',
      debug: {
        tried_id: userId,
        error,
        data,
      }
    });
  }

  // Check if user has a booster account (not affiliate-only)
  const { data: boosterAccounts } = await supabase
    .from('user_booster_accounts')
    .select('id')
    .eq('user_id', userId);
  const isAffiliateOnly = !boosterAccounts || boosterAccounts.length === 0;

  // Look up referral code from profiles table
  let referralCode = null;
  let referralLink = null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('id', userId)
    .maybeSingle();
  if (profile && profile.referral_code) {
    referralCode = profile.referral_code;
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    referralLink = `${base}/?ref=${encodeURIComponent(referralCode)}`;
  }

  res.status(200).json({
    status: data.affiliate_status,
    referralCode,
    referralLink,
    isAffiliateOnly,
  });
}
