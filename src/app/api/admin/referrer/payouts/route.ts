
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/integrations/supabase/admin-client';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get('status') || 'pending,approved';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = parseInt(url.searchParams.get('pageSize') || '50', 10);
  const statusList = status.split(',').map(s => s.trim());
  const admin = createAdminClient();
  const query = admin.from('referred_users')
    .select('*')
    .in('payout_status', statusList)
    .order('signup_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Get total count for pagination
  const { count: totalCount } = await admin.from('referred_users')
    .select('*', { count: 'exact', head: true })
    .in('payout_status', statusList);
  return NextResponse.json({ items: data || [], total: totalCount || 0 });
}
