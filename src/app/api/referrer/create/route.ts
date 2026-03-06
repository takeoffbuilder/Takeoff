import { NextResponse } from 'next/server';
import { createAdminClient } from '@/integrations/supabase/admin-client';

function buildLink(code: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base}/?ref=${encodeURIComponent(code)}`;
}

function cryptoRandomFallback(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function POST(req: Request) {
  try {
    const admin = createAdminClient();
    const authHeader = req.headers.get('authorization') || '';
    const m = authHeader.match(/^Bearer\s+(.+)$/i);
    const token = m ? m[1] : undefined;
    const { data: userResp } = await admin.auth.getUser(token);
    const user = userResp?.user;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: existing } = await admin
      .from('profiles')
      .select('referral_code')
      .eq('id', user.id)
      .maybeSingle();
    if (existing?.referral_code) {
      return NextResponse.json({ referral_code: existing.referral_code, link: buildLink(existing.referral_code) });
    }

    const { data: codeData, error: genErr } = await admin.rpc('generate_referral_code', { p_len: 8 });
    if (genErr) throw genErr;
    const referral_code = (codeData as string) || cryptoRandomFallback();

    const { error: updateErr } = await admin
      .from('profiles')
      .update({ referral_code, is_affiliate: true })
      .eq('id', user.id);
    if (updateErr) throw updateErr;

    return NextResponse.json({ referral_code, link: buildLink(referral_code) }, { status: 201 });
  } catch (e: unknown) {
    console.error('referrer/create failed', e);
    let message = 'Unknown error';
    if (typeof e === 'object' && e !== null && 'message' in e && typeof (e as { message?: unknown }).message === 'string') {
      message = (e as { message: string }).message;
    } else {
      message = String(e);
    }
    return NextResponse.json({ error: 'Internal Error', detail: message }, { status: 500 });
  }
}
