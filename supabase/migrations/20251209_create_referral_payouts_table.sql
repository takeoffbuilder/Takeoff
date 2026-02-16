create index IF not exists idx_referral_payouts_period on public.referral_payouts using btree (period_year, period_month) TABLESPACE pg_default;
