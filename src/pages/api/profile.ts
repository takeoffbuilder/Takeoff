import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/integrations/supabase/admin-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  const supabase = createAdminClient();

  if (req.method === 'GET') {
    // Fetch profile by userId
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data) {
      return res.status(404).json({ error: 'Profile not found', details: error });
    }
    return res.status(200).json({ profile: data });
  }

  if (req.method === 'POST') {
    // Update profile
    const updates = req.body;
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .maybeSingle();
    if (error || !data) {
      return res.status(400).json({ error: 'Failed to update profile', details: error });
    }
    return res.status(200).json({ profile: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
