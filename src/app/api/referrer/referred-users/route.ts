import { NextResponse } from 'next/server';
import { createAdminClient } from '@/integrations/supabase/admin-client';

export async function GET(req: Request) {
  try {
    const admin = createAdminClient();
    const authHeader = req.headers.get('authorization') || '';
    const m = authHeader.match(/^Bearer\s+(.+)$/i);
    const token = m ? m[1] : undefined;
    const { data: userResp } = await admin.auth.getUser(token);
    const user = userResp?.user;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    if (profileErr) throw profileErr;
    if (!profile) return NextResponse.json({ error: 'Not a referrer' }, { status: 404 });

    const page = Math.max(1, parseInt(String(new URL(req.url).searchParams.get('page') || '1'), 10));
    const pageSize = Math.max(1, Math.min(200, parseInt(String(new URL(req.url).searchParams.get('pageSize') || '25'), 10)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const baseQuery = admin
      .from('referred_users')
      .select('id, referral_code, referred_user_id, signup_at, converted, conversion_at, payout_amount, payout_status, paid_at, plan_slug', { count: 'exact' })
      .eq('referrer_id', profile.id)
      .order('signup_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await baseQuery;
    if (error) throw error;

    const crypto = await import('crypto');
    const items = (data || []).map(row => {
      const hash = crypto.createHash('sha256').update(row.referred_user_id || '').digest('hex');
      return { ...row, anonymized_id: hash.slice(0, 10) };
    });

    return NextResponse.json({ items, page, pageSize, total: count || 0 });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error('referred-users failed', err);
    return NextResponse.json({ error: 'Internal Error', detail: err.message }, { status: 500 });
  }
}
