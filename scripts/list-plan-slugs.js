#!/usr/bin/env node

import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase URL or Service Role key in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from('booster_plans')
    .select('id, plan_slug, plan_name, monthly_amount, credit_limit')
    .order('plan_slug');

  if (error) {
    console.error('Query failed:', error.message);
    process.exit(1);
  }

  console.log('\nbooster_plans (slug → name, monthly, limit)');
  console.log('──────────────────────────────────────────');
  for (const row of data || []) {
    const slug = row.plan_slug;
    const name = row.plan_name;
    const monthly = row.monthly_amount;
    const limit = row.credit_limit;
    console.log(`• ${slug} → ${name} | $${monthly}/mo | limit $${limit}`);
  }
}

main().catch((e) => {
  console.error('❌ Error:', e?.message || e);
  process.exit(1);
});
