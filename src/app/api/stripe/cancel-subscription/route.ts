
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/integrations/supabase/admin-client';

export async function POST(req: Request) {
  try {
    const { subscriptionId, accountId } = await req.json();
    if (!subscriptionId && !accountId) {
      return NextResponse.json({ error: 'Missing subscriptionId or accountId' }, { status: 400 });
    }

    // Cancel Stripe subscription if provided
    if (subscriptionId) {
      await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
    }

    // Optionally, update local DB status if accountId is provided
    if (accountId) {
      const supabase = createAdminClient();
      const { error } = await supabase
        .from('user_booster_accounts')
        .update({ status: 'pending', date_cancelled: new Date().toISOString() })
        .eq('id', accountId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Cancel subscription API error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
