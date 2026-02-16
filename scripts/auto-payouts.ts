import fetch from 'node-fetch';
import { createAdminClient } from '../src/integrations/supabase/admin-client';

const API_URL = 'https://your-app-domain/api/referrer/payout/update';
const ADMIN_TOKEN = process.env.ADMIN_BEARER_TOKEN; // Set this securely

async function triggerPayout(referred_user_id: string) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
    },
    body: JSON.stringify({
      referred_user_id,
      action: 'pay',
    }),
  });
  const data = await res.json();
  if (res.ok) {
    console.log(`Payout triggered for referred_user_id: ${referred_user_id}`, data);
  } else {
    console.error(`Failed payout for referred_user_id: ${referred_user_id}`, data);
  }
}

async function runAutoPayouts() {
  const admin = createAdminClient();
  const { data: referrals, error } = await admin
    .from('referred_users')
    .select('id')
    .eq('payout_status', 'approved')
    .is('paid_at', null);

  if (error) {
    console.error('Error fetching referrals:', error);
    return;
  }

  if (!referrals || referrals.length === 0) {
    console.log('No approved unpaid referrals found.');
    return;
  }

  for (const referral of referrals) {
    await triggerPayout(referral.id);
  }
}

runAutoPayouts().catch((err) => {
  console.error('Auto payout script failed:', err);
});