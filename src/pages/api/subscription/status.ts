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
    .in('status', ['active', 'pending', 'trialing']);

  const normalizedAccounts = (accounts || []).map((account) => ({
    id: account.id,
    status: account.status,
  }));

  const activeAccount =
    normalizedAccounts.find(
      (account) =>
        account.status === 'active' || account.status === 'trialing'
    ) || null;

  const firstAccount = normalizedAccounts[0] || null;

  const isSubscriber = Boolean(activeAccount);
  

  const status = activeAccount
    ? activeAccount.status
    : firstAccount?.status || 'none';

  res.status(200).json({
    isSubscriber,
    hasActiveSubscription: isSubscriber,
    status,
    accounts: normalizedAccounts,
    account: firstAccount,
  });
}
