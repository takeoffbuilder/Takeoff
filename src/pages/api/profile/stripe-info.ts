import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

const supabaseServer = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get access token from Authorization header
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  const accessToken = authHeader.replace('Bearer ', '');

  // Validate token and get user
  const { data: userData, error: userError } = await supabaseServer.auth.getUser(accessToken);
  if (userError || !userData?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = userData.user.id;

  const { data, error } = await supabaseServer
    .from('profiles')
    .select('stripe_onboarding_url, is_affiliate, stripe_connect_account_id')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Stripe info API error:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
}
