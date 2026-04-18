import { NextResponse } from 'next/server';
import { createAdminClient } from '@/integrations/supabase/admin-client';

function buildLink(req: Request, code: string) {
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
  const forwardedHost =
    req.headers.get('x-forwarded-host') || req.headers.get('host');

  if (!forwardedHost) {
    throw new Error('Missing host header');
  }

  const base = `${forwardedProto}://${forwardedHost}`.replace(/\/$/, '');
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
      return NextResponse.json({
  referral_code: existing.referral_code,
  link: buildLink(req, existing.referral_code),
});
    }

    let referral_code = '';
let attempts = 0;

while (!referral_code && attempts < 10) {
  attempts += 1;
  const candidate = cryptoRandomFallback(8);

  const { data: existingCode, error: checkErr } = await admin
    .from('profiles')
    .select('id')
    .eq('referral_code', candidate)
    .maybeSingle();

  if (checkErr) throw checkErr;
  if (!existingCode) {
    referral_code = candidate;
  }
}

if (!referral_code) {
  throw new Error('Failed to generate a unique referral code');
}

    const { error: updateErr } = await admin
      .from('profiles')
      .update({ referral_code, is_affiliate: true })
      .eq('id', user.id);
    if (updateErr) throw updateErr;

    return NextResponse.json(
  { referral_code, link: buildLink(req, referral_code) },
  { status: 201 }
);
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
