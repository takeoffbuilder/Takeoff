import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/integrations/supabase/admin-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createAdminClient();
  // Query by id (which is the user ID)
  const { data: affiliateApp } = await supabase
    .from('affiliate_applications')
    .select('affiliate_status, id')
    .eq('id', userId)
    .maybeSingle();

  // Check if user has a booster account (not affiliate-only)
  const { data: boosterAccounts } = await supabase
    .from('user_booster_accounts')
    .select('id')
    .eq('user_id', userId);
  const isAffiliateOnly = !boosterAccounts || boosterAccounts.length === 0;

  // Look up referral code and affiliate flags from profiles table
  let referralCode = null;
  let referralLink = null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code, is_affiliate, stripe_connect_account_id, stripe_account_id')
    .eq('id', userId)
    .maybeSingle();
  if (profile?.referral_code) {
    referralCode = profile.referral_code;
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    referralLink = `${base}/?ref=${encodeURIComponent(referralCode)}`;
  }

  // Derive effective affiliate status
  let affiliateStatus = affiliateApp?.affiliate_status || 'pending';
  const hasStripeAccount =
    !!profile?.stripe_connect_account_id || !!profile?.stripe_account_id;
  const isAffiliateFlag = !!profile?.is_affiliate;
  if (affiliateStatus !== 'inactive') {
    if (affiliateStatus === 'approved' || affiliateStatus === 'active') {
      affiliateStatus = 'active';
    } else if (isAffiliateFlag || hasStripeAccount) {
      affiliateStatus = 'active';
    }
  }

  res.status(200).json({
    status: affiliateStatus,
    referralCode,
    referralLink,
    isAffiliateOnly,
  });
}
