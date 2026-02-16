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
      .select('id, referral_code, is_affiliate, affiliate_signup_count, affiliate_conversion_count')
      .eq('id', user.id)
      .maybeSingle();
    if (profileErr) throw profileErr;
    if (!profile) return NextResponse.json({ error: 'Not an affiliate' }, { status: 404 });

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
      affiliate_signup_count: profile.affiliate_signup_count || 0,
      affiliate_conversion_count: profile.affiliate_conversion_count || 0,
      referral_code: profile.referral_code,
      is_affiliate: profile.is_affiliate,
    });
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error('referrer/me failed', err);
    return NextResponse.json({ error: 'Internal Error', detail: err.message }, { status: 500 });
  }
}
