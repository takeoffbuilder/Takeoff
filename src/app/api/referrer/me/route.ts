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
      .select('id, referral_code, is_affiliate, total_signups, total_conversions')
      .eq('id', user.id)
      .maybeSingle();
    if (
      profileErr ||
      !profile ||
      typeof profile !== 'object' ||
      !('id' in profile)
    ) {
      return NextResponse.json({ error: 'Not an affiliate or missing profile columns' }, { status: 404 });
    }

    const { data: pendingRows, error: pendingErr } = await admin
      .from('referred_users')
      .select('payout_amount')
      .eq('referrer_id', profile.id)
      .eq('payout_status', 'pending');
    if (pendingErr) throw pendingErr;
    const pending_count = pendingRows?.length || 0;
    const pending_total_amount = (pendingRows || []).reduce((sum, r) => sum + (r.payout_amount || 0), 0);

    return NextResponse.json({
      referrer: profile,
      pending_count,
      pending_total_amount,
      total_signups: profile.total_signups || 0,
      total_conversions: profile.total_conversions || 0,
      referral_code: profile.referral_code,
      is_affiliate: profile.is_affiliate,
    });
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error('referrer/me failed', err);
    return NextResponse.json({ error: 'Internal Error', detail: err.message }, { status: 500 });
  }
}
