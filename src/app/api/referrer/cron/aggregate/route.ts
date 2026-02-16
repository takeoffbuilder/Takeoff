import { NextResponse } from 'next/server';
import { createAdminClient } from '@/integrations/supabase/admin-client';

export async function POST(req: Request) {
  try {
    const cronSecret = process.env.REFERRAL_CRON_SECRET;
    if (!cronSecret) return NextResponse.json({ error: 'Missing REFERRAL_CRON_SECRET env' }, { status: 500 });
    const provided = req.headers.get('x-cron-secret');
    if (provided !== cronSecret) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const admin = createAdminClient();
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    const defaultYear = now.getFullYear();
    const defaultMonth = now.getMonth() + 1;

    const body = await req.json();
    const { year, month } = body || {};
    const y = parseInt(year || defaultYear, 10);
    const m = parseInt(month || defaultMonth, 10);

    const { error: aggErr } = await admin.rpc('refresh_referral_month', { p_year: y, p_month: m });
    if (aggErr) throw aggErr;

    return NextResponse.json({ aggregated: true, year: y, month: m });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error('referrer/cron/aggregate failed', err);
    return NextResponse.json({ error: 'Internal Error', detail: err.message }, { status: 500 });
  }
}
