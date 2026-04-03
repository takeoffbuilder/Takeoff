import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/integrations/supabase/admin-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = (req.query.userId as string) || null;

  // If no userId is provided, don't hard-fail. Return not-subscribed so
  // the client can retry once auth/session is available.
  if (!userId) {
    return res.status(200).json({
      isSubscriber: false,
      hasActiveSubscription: false,
      status: 'none',
      accounts: [],
      account: null,
    });
  }

  const supabase = createAdminClient();

  // Option 1: Check user_booster_accounts for active status
  const { data: accounts } = await supabase
    .from('user_booster_accounts')
    .select('id, status')
    .eq('user_id', userId)
    .in('status', ['active', 'pending']);

  const normalizedAccounts = (accounts || []).map((account) => ({
    id: account.id,
    status: account.status,
  }));

  const firstAccount = normalizedAccounts[0] || null;
  const hasActiveSubscription = normalizedAccounts.length > 0;

  let isSubscriber = hasActiveSubscription;
  let status = hasActiveSubscription
    ? firstAccount?.status || 'active'
    : 'none';

  if (!hasActiveSubscription) {
    // Option 2: Fallback to profile.status if present
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', userId)
      .maybeSingle();

    if (profile && profile.status && profile.status.toLowerCase() === 'active') {
      isSubscriber = true;
      status = 'active';
    }
  }

  res.status(200).json({
    isSubscriber,
    hasActiveSubscription: isSubscriber,
    status,
    accounts: normalizedAccounts,
    account: firstAccount,
  });
}
