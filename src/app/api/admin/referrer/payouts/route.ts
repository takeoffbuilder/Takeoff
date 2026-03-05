
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/integrations/supabase/admin-client';

export async function GET(req: Request) {
  const url = new URL(req.url);
  // Removed unused status variable
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = parseInt(url.searchParams.get('pageSize') || '50', 10);
  // Removed unused statusList
  const admin = createAdminClient();
  // Use explicit columns for referral_payouts
  const query = admin.from('referral_payouts')
    .select('id, amount, status, created_at, conversions, paid_at, period_month, period_year, referrer_id')
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Get total count for pagination
  const { count: totalCount } = await admin.from('referral_payouts')
    .select('id', { count: 'exact', head: true });
  return NextResponse.json({ items: data || [], total: totalCount || 0 });
}
