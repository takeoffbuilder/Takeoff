import { NextResponse } from 'next/server';
import { createAdminClient } from '@/integrations/supabase/admin-client';

export async function POST(req: Request) {
  const body = await req.json();
  const { referralCode } = body;
  if (!referralCode) {
    return NextResponse.json({ error: 'Missing referralCode' }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('referral_clicks')
    .insert({ referral_code: referralCode, clicked_at: new Date().toISOString() });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
