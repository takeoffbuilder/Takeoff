import { NextResponse } from 'next/server';
import { createAdminClient } from '@/integrations/supabase/admin-client';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const admin = createAdminClient();
    const authHeader = req.headers.get('authorization') || '';
    const m = authHeader.match(/^Bearer\s+(.+)$/i);
    const token = m ? m[1] : undefined;
    const { data: userResp } = await admin.auth.getUser(token);
    const user = userResp?.user;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const envAdmins = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
    const isEnvAdmin = !!user.email && envAdmins.includes(user.email.toLowerCase());
    let isRpcAdmin = false;
    try {
      const rpcCall = await (admin as unknown as { rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown }> }).rpc('is_admin', { p_email: user.email });
      isRpcAdmin = Boolean(rpcCall.data);
    } catch {}
    if (!isEnvAdmin && !isRpcAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { referred_user_id, action } = body || {};
    if (!referred_user_id || !action) return NextResponse.json({ error: 'Missing referred_user_id or action' }, { status: 400 });

    if (!['approve','pay','reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // ...existing code for approve, pay, reject actions...

    // Only run Stripe payout logic for 'pay' action
    if (action === 'pay') {
      // 1. Find the referred user and their referrer
      const { data: referral, error: referralError } = await admin
        .from('referred_users')
        .select('id, referrer_id, payout_amount, payout_status, paid_at')
        .eq('referred_user_id', referred_user_id)
        .maybeSingle();
      if (referralError || !referral) {
        return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
      }
      if (referral.payout_status === 'paid') {
        return NextResponse.json({ error: 'Already paid' }, { status: 400 });
      }
      // 2. Get the affiliate's Stripe account ID
      const { data: referrerProfile, error: referrerProfileError } = await admin
        .from('profiles')
        .select('stripe_connect_account_id, email')
        .eq('id', referral.referrer_id)
        .maybeSingle();
      if (referrerProfileError || !referrerProfile || !referrerProfile.stripe_connect_account_id) {
        return NextResponse.json({ error: 'Affiliate Stripe account not found' }, { status: 404 });
      }
      // 3. Get payout amount (in cents)
      const payoutAmount = Math.round(Number(referral.payout_amount) * 100);
      if (!payoutAmount || payoutAmount < 100) {
        return NextResponse.json({ error: 'Invalid payout amount' }, { status: 400 });
      }
      // 4. Create Stripe transfer
      try {
        const transfer = await stripe.transfers.create({
          amount: payoutAmount,
          currency: 'usd',
          destination: referrerProfile.stripe_connect_account_id,
          transfer_group: 'affiliate_payouts',
          metadata: {
            referrer_id: referral.referrer_id,
            referred_user_id,
            referral_id: referral.id,
            admin_email: user.email || '',
          },
        });
        // 5. Mark as paid in DB
        await admin
          .from('referred_users')
          .update({ payout_status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', referral.id);
        return NextResponse.json({ success: true, transfer_id: transfer.id });
      } catch (err) {
        console.error('Stripe transfer failed:', err);
        return NextResponse.json({ error: 'Stripe transfer failed', detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
      }
    }
    return NextResponse.json({ migrated: true });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error('referrer/payout/update failed', err);
    return NextResponse.json({ error: 'Internal Error', detail: err.message }, { status: 500 });
  }
}
