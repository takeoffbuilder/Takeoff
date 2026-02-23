import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/integrations/supabase/admin-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createAdminClient();

  // Option 1: Check user_booster_accounts for active status
  const { data: accounts } = await supabase
    .from('user_booster_accounts')
    .select('id, status')
    .eq('user_id', userId)
    .in('status', ['active', 'pending']);

  let isSubscriber = false;
  if (accounts && accounts.length > 0) {
    isSubscriber = true;
  } else {
    // Option 2: Fallback to profile.status if present
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', userId)
      .maybeSingle();
    if (profile && profile.status && profile.status.toLowerCase() === 'active') {
      isSubscriber = true;
    }
  }

  res.status(200).json({ isSubscriber });
}
