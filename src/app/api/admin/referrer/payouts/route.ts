import { NextResponse } from 'next/server';
import { createAdminClient } from '@/integrations/supabase/admin-client';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = parseInt(url.searchParams.get('pageSize') || '50', 10);

  const admin = createAdminClient();

  // Use explicit columns for referral_payouts
  const query = admin
    .from('referral_payouts')
    .select(
      'id, amount, status, created_at, conversions, paid_at, period_month, period_year, referrer_id'
    )
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const payoutRows = data || [];

  // 🔥 NEW: attach referred_user_id so admin actions work
  const items = await Promise.all(
    payoutRows.map(async (row) => {
      const { data: referredUser } = await admin
        .from('referred_users')
        .select('referred_user_id')
        .eq('referrer_id', row.referrer_id)
        .eq('payout_amount', row.amount)
        .maybeSingle();

      return {
        ...row,
        referred_user_id: referredUser?.referred_user_id || null,
        referral_code: referredUser?.referral_code || null,    
        plan_slug: referredUser?.plan_slug || null,
        payout_amount: referredUser?.payout_amount ?? row.amount ?? null,
        payout_status: referredUser?.payout_status || row.status || null,
        payout_paid_at: referredUser?.paid_at || row.paid_at || null,
      };
    })
  );

  // Get total count for pagination
  const { count: totalCount } = await admin
    .from('referral_payouts')
    .select('id', { count: 'exact', head: true });

  return NextResponse.json({ items, total: totalCount || 0 });
}

