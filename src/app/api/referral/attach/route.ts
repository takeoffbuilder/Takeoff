import { NextResponse } from 'next/server';
import { createAdminClient } from '@/integrations/supabase/admin-client';

export async function POST(req: Request) {
  const body = await req.json();
  const { userId, referralCode } = body;
  if (!userId || !referralCode) {
    return NextResponse.json({ error: 'Missing userId or referralCode' }, { status: 400 });
  }
  const supabase = createAdminClient();

  // Find affiliate by referral code and get user_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, is_affiliate')
    .eq('referral_code', referralCode)
    .maybeSingle();
  if (profileError || !profile) {
    return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
  }

  // Check affiliate status
  if (!profile.is_affiliate) {
    return NextResponse.json({ error: 'Referrer is not active, no payout will be issued.' }, { status: 200 });
  }

  const affiliate = { id: profile.id, user_id: profile.id };

  // Check if user is already a subscriber (has a booster account)
  const { data: booster } = await supabase
    .from('user_booster_accounts')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (booster) {
    return NextResponse.json({ ok: true, alreadySubscriber: true });
  }

  // Check if user has already been referred
  const { data: existing, error: checkError } = await supabase
    .from('referred_users')
    .select('id')
    .eq('referred_user_id', userId)
    .maybeSingle();
  if (checkError) {
    return NextResponse.json({ error: checkError.message }, { status: 500 });
  }
  if (existing) {
    return NextResponse.json({ ok: true, alreadyExists: true });
  }

  // Insert new referred_users row
  const { error: insertError } = await supabase
    .from('referred_users')
    .insert({ 
      referral_code: referralCode, 
      referred_user_id: userId,
      referrer_id: affiliate.id
 
    });
  if (insertError) {
    if (
      insertError.message.includes('duplicate key value') ||
      insertError.code === '23505'
    ) {
      return NextResponse.json({ ok: true, alreadyExists: true });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, created: true });
}
