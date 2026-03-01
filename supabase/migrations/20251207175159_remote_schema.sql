create sequence "public"."referral_clicks_id_seq";

create sequence "public"."referral_payouts_id_seq";


  create table "public"."activity_logs" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "activity_type" text not null,
    "description" text not null,
    "metadata" jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."activity_logs" enable row level security;


  create table "public"."admin_emails" (
    "email" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."admin_emails" enable row level security;


  create table "public"."affiliate_applications" (
    "id" uuid not null,
    "first_name" text not null,
    "last_name" text not null,
    "email" text not null,
    "dob" date not null,
    "ssn_last_four" text not null,
    "address" text not null,
    "city" text not null,
    "state" text not null,
    "postal_code" text not null,
    "country" text not null default 'US'::text,
    "stripe_account" text not null,
    "affiliate_status" text default 'pending'::text,
    "stripe_connect_account_id" text,
    "payout_setup_complete" boolean default false,
    "stripe_onboarding_url" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."affiliate_applications" enable row level security;


  create table "public"."booster_plans" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "plan_name" text not null,
    "plan_slug" text not null,
    "monthly_amount" numeric(10,2) not null,
    "credit_limit" numeric(10,2) not null,
    "description" text,
    "features" jsonb,
    "is_active" boolean default true,
    "display_order" integer,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."booster_plans" enable row level security;


  create table "public"."downloaded_courses" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "course_slug" text not null,
    "course_title" text not null,
    "downloaded_at" timestamp with time zone default now()
      );


alter table "public"."downloaded_courses" enable row level security;


  create table "public"."payment_methods" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "cardholder_name" text not null,
    "card_last_four" text not null,
    "card_type" text,
    "expiration_month" integer not null,
    "expiration_year" integer not null,
    "is_default" boolean default false,
    "auto_pay_enabled" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."payment_methods" enable row level security;


  create table "public"."payments" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "booster_account_id" uuid,
    "payment_method_id" uuid,
    "amount" numeric(10,2) not null,
    "payment_type" text not null,
    "status" text not null default 'pending'::text,
    "transaction_id" text,
    "payment_date" timestamp with time zone default now(),
    "failure_reason" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "stripe_invoice_id" text,
    "stripe_customer_id" text,
    "currency" text,
    "plan_slug" text,
    "stripe_checkout_id" text
      );


alter table "public"."payments" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "email" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "phone" text,
    "address" text,
    "city" text,
    "state" text,
    "postal_code" text,
    "stripe_customer_id" text,
    "stripe_name" text,
    "stripe_email" text,
    "stripe_onboarding_url" text,
    "is_affiliate" boolean default false,
    "stripe_connect_account_id" text,
    "full_name" text,
    "first_name" text,
    "last_name" text
      );



  create table "public"."referral_clicks" (
    "id" bigint not null default nextval('public.referral_clicks_id_seq'::regclass),
    "user_agent" text,
    "attribution" jsonb,
    "created_at" timestamp with time zone not null default now(),
    "ip" inet,
    "referral_code" text not null,
    "referrer_id" uuid
      );


alter table "public"."referral_clicks" enable row level security;


  create table "public"."referral_payouts" (
    "id" bigint not null default nextval('public.referral_payouts_id_seq'::regclass),
    "amount" numeric(12,2) not null default 0,
    "status" text not null default 'pending'::text,
    "created_at" timestamp with time zone not null default now(),
    "conversions" integer not null default 0,
    "notes" text,
    "paid_at" timestamp with time zone,
    "period_month" integer not null,
    "period_year" integer not null,
    "referrer_id" uuid not null
      );


alter table "public"."referral_payouts" enable row level security;


  create table "public"."referred_users" (
    "id" uuid not null default gen_random_uuid(),
    "conversion_at" timestamp with time zone,
    "converted" boolean not null default false,
    "metadata" jsonb,
    "paid_at" timestamp with time zone,
    "payout_amount" numeric(12,2),
    "payout_status" text not null default 'pending'::text,
    "plan_slug" text,
    "referral_code" text not null,
    "referred_user_id" uuid,
    "referrer_id" uuid,
    "signup_at" timestamp with time zone not null default now()
      );


alter table "public"."referred_users" enable row level security;


  create table "public"."referrers" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "lifetime_conversions" integer not null default 0,
    "referral_code" text not null,
    "status" text not null default 'active'::text,
    "total_clicks" integer not null default 0,
    "total_signups" integer not null default 0
      );


alter table "public"."referrers" enable row level security;


  create table "public"."user_booster_accounts" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "plan_id" uuid not null,
    "status" text not null default 'active'::text,
    "monthly_amount" numeric(10,2) not null,
    "credit_limit" numeric(10,2) not null,
    "next_payment_date" date,
    "date_added" timestamp with time zone default now(),
    "date_cancelled" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "stripe_customer_id" text,
    "stripe_subscription_id" text,
    "highest_credit_limit" numeric,
    "closed_at" timestamp with time zone,
    "consumer_account_id" integer,
    "plan_slug" text
      );


alter table "public"."user_booster_accounts" enable row level security;


  create table "public"."user_personal_info" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "first_name" text not null,
    "last_name" text not null,
    "date_of_birth" date not null,
    "ssn_last_four" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "phone" text,
    "address" text,
    "city" text,
    "state" text,
    "zip_code" text,
    "address2" text,
    "generation_code" text,
    "middle_initial" text
      );


alter table "public"."user_personal_info" enable row level security;

alter sequence "public"."referral_clicks_id_seq" owned by "public"."referral_clicks"."id";

alter sequence "public"."referral_payouts_id_seq" owned by "public"."referral_payouts"."id";

CREATE UNIQUE INDEX activity_logs_pkey ON public.activity_logs USING btree (id);

CREATE UNIQUE INDEX admin_emails_pkey ON public.admin_emails USING btree (email);

CREATE INDEX affiliate_applications_email_idx ON public.affiliate_applications USING btree (email);

CREATE UNIQUE INDEX affiliate_applications_pkey ON public.affiliate_applications USING btree (id);

CREATE UNIQUE INDEX booster_plans_pkey ON public.booster_plans USING btree (id);

CREATE UNIQUE INDEX booster_plans_plan_name_key ON public.booster_plans USING btree (plan_name);

CREATE UNIQUE INDEX booster_plans_plan_slug_key ON public.booster_plans USING btree (plan_slug);

CREATE UNIQUE INDEX downloaded_courses_pkey ON public.downloaded_courses USING btree (id);

CREATE UNIQUE INDEX downloaded_courses_user_id_course_slug_key ON public.downloaded_courses USING btree (user_id, course_slug);

CREATE INDEX idx_payments_stripe_customer ON public.payments USING btree (stripe_customer_id);

CREATE INDEX idx_referral_clicks_code_created ON public.referral_clicks USING btree (referral_code, created_at);

CREATE INDEX idx_referral_payouts_period ON public.referral_payouts USING btree (period_year, period_month);

CREATE INDEX idx_referred_users_payout_status ON public.referred_users USING btree (payout_status);

CREATE INDEX idx_referred_users_plan_slug ON public.referred_users USING btree (plan_slug);

CREATE INDEX idx_referred_users_referred_user ON public.referred_users USING btree (referred_user_id);

CREATE INDEX idx_referred_users_referrer ON public.referred_users USING btree (referrer_id);

CREATE INDEX idx_referrers_referral_code ON public.referrers USING btree (referral_code);

CREATE UNIQUE INDEX payment_methods_pkey ON public.payment_methods USING btree (id);

CREATE INDEX payments_baid_created_at_idx ON public.payments USING btree (booster_account_id, created_at);

CREATE INDEX payments_baid_status_created_at_idx ON public.payments USING btree (booster_account_id, status, created_at);

CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id);

CREATE UNIQUE INDEX payments_stripe_invoice_id_key ON public.payments USING btree (stripe_invoice_id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX referral_clicks_pkey ON public.referral_clicks USING btree (id);

CREATE UNIQUE INDEX referral_payouts_pkey ON public.referral_payouts USING btree (id);

CREATE UNIQUE INDEX referral_payouts_referrer_id_period_year_period_month_key ON public.referral_payouts USING btree (referrer_id, period_year, period_month);

CREATE UNIQUE INDEX referred_users_pkey ON public.referred_users USING btree (id);

CREATE UNIQUE INDEX referred_users_referral_code_referred_user_id_key ON public.referred_users USING btree (referral_code, referred_user_id);

CREATE UNIQUE INDEX referrers_pkey ON public.referrers USING btree (id);

CREATE UNIQUE INDEX referrers_referral_code_key ON public.referrers USING btree (referral_code);

CREATE UNIQUE INDEX referrers_user_id_key ON public.referrers USING btree (user_id);

CREATE UNIQUE INDEX user_booster_accounts_consumer_account_id_key ON public.user_booster_accounts USING btree (consumer_account_id);

CREATE UNIQUE INDEX user_booster_accounts_pkey ON public.user_booster_accounts USING btree (id);

CREATE UNIQUE INDEX user_booster_accounts_stripe_subscription_id_key ON public.user_booster_accounts USING btree (stripe_subscription_id);

CREATE UNIQUE INDEX user_personal_info_pkey ON public.user_personal_info USING btree (id);

CREATE UNIQUE INDEX user_personal_info_user_id_key ON public.user_personal_info USING btree (user_id);

alter table "public"."activity_logs" add constraint "activity_logs_pkey" PRIMARY KEY using index "activity_logs_pkey";

alter table "public"."admin_emails" add constraint "admin_emails_pkey" PRIMARY KEY using index "admin_emails_pkey";

alter table "public"."affiliate_applications" add constraint "affiliate_applications_pkey" PRIMARY KEY using index "affiliate_applications_pkey";

alter table "public"."booster_plans" add constraint "booster_plans_pkey" PRIMARY KEY using index "booster_plans_pkey";

alter table "public"."downloaded_courses" add constraint "downloaded_courses_pkey" PRIMARY KEY using index "downloaded_courses_pkey";

alter table "public"."payment_methods" add constraint "payment_methods_pkey" PRIMARY KEY using index "payment_methods_pkey";

alter table "public"."payments" add constraint "payments_pkey" PRIMARY KEY using index "payments_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."referral_clicks" add constraint "referral_clicks_pkey" PRIMARY KEY using index "referral_clicks_pkey";

alter table "public"."referral_payouts" add constraint "referral_payouts_pkey" PRIMARY KEY using index "referral_payouts_pkey";

alter table "public"."referred_users" add constraint "referred_users_pkey" PRIMARY KEY using index "referred_users_pkey";

alter table "public"."referrers" add constraint "referrers_pkey" PRIMARY KEY using index "referrers_pkey";

alter table "public"."user_booster_accounts" add constraint "user_booster_accounts_pkey" PRIMARY KEY using index "user_booster_accounts_pkey";

alter table "public"."user_personal_info" add constraint "user_personal_info_pkey" PRIMARY KEY using index "user_personal_info_pkey";

alter table "public"."activity_logs" add constraint "activity_logs_activity_type_check" CHECK ((activity_type = ANY (ARRAY['account_created'::text, 'plan_added'::text, 'plan_cancelled'::text, 'payment_made'::text, 'payment_failed'::text, 'profile_updated'::text, 'password_changed'::text, 'course_downloaded'::text]))) not valid;

alter table "public"."activity_logs" validate constraint "activity_logs_activity_type_check";

alter table "public"."activity_logs" add constraint "activity_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."activity_logs" validate constraint "activity_logs_user_id_fkey";

alter table "public"."affiliate_applications" add constraint "affiliate_applications_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) not valid;

alter table "public"."affiliate_applications" validate constraint "affiliate_applications_id_fkey";

alter table "public"."booster_plans" add constraint "booster_plans_plan_name_key" UNIQUE using index "booster_plans_plan_name_key";

alter table "public"."booster_plans" add constraint "booster_plans_plan_slug_key" UNIQUE using index "booster_plans_plan_slug_key";

alter table "public"."downloaded_courses" add constraint "downloaded_courses_user_id_course_slug_key" UNIQUE using index "downloaded_courses_user_id_course_slug_key";

alter table "public"."downloaded_courses" add constraint "downloaded_courses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."downloaded_courses" validate constraint "downloaded_courses_user_id_fkey";

alter table "public"."payment_methods" add constraint "payment_methods_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."payment_methods" validate constraint "payment_methods_user_id_fkey";

alter table "public"."payments" add constraint "payments_booster_account_id_fkey" FOREIGN KEY (booster_account_id) REFERENCES public.user_booster_accounts(id) ON DELETE SET NULL not valid;

alter table "public"."payments" validate constraint "payments_booster_account_id_fkey";

alter table "public"."payments" add constraint "payments_payment_method_id_fkey" FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id) ON DELETE SET NULL not valid;

alter table "public"."payments" validate constraint "payments_payment_method_id_fkey";

alter table "public"."payments" add constraint "payments_payment_type_check" CHECK ((payment_type = ANY (ARRAY['subscription'::text, 'setup_fee'::text, 'late_fee'::text, 'refund'::text]))) not valid;

alter table "public"."payments" validate constraint "payments_payment_type_check";

alter table "public"."payments" add constraint "payments_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text]))) not valid;

alter table "public"."payments" validate constraint "payments_status_check";

alter table "public"."payments" add constraint "payments_stripe_invoice_id_key" UNIQUE using index "payments_stripe_invoice_id_key";

alter table "public"."payments" add constraint "payments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."payments" validate constraint "payments_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."referral_clicks" add constraint "referral_clicks_referrer_id_fkey" FOREIGN KEY (referrer_id) REFERENCES public.referrers(id) ON DELETE CASCADE not valid;

alter table "public"."referral_clicks" validate constraint "referral_clicks_referrer_id_fkey";

alter table "public"."referral_payouts" add constraint "referral_payouts_period_month_check" CHECK (((period_month >= 1) AND (period_month <= 12))) not valid;

alter table "public"."referral_payouts" validate constraint "referral_payouts_period_month_check";

alter table "public"."referral_payouts" add constraint "referral_payouts_referrer_id_fkey" FOREIGN KEY (referrer_id) REFERENCES public.referrers(id) ON DELETE CASCADE not valid;

alter table "public"."referral_payouts" validate constraint "referral_payouts_referrer_id_fkey";

alter table "public"."referral_payouts" add constraint "referral_payouts_referrer_id_period_year_period_month_key" UNIQUE using index "referral_payouts_referrer_id_period_year_period_month_key";

alter table "public"."referred_users" add constraint "referred_users_referral_code_referred_user_id_key" UNIQUE using index "referred_users_referral_code_referred_user_id_key";

alter table "public"."referred_users" add constraint "referred_users_referred_user_id_fkey" FOREIGN KEY (referred_user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."referred_users" validate constraint "referred_users_referred_user_id_fkey";

alter table "public"."referred_users" add constraint "referred_users_referrer_id_fkey" FOREIGN KEY (referrer_id) REFERENCES public.referrers(id) ON DELETE SET NULL not valid;

alter table "public"."referred_users" validate constraint "referred_users_referrer_id_fkey";

alter table "public"."referrers" add constraint "referrers_referral_code_key" UNIQUE using index "referrers_referral_code_key";

alter table "public"."referrers" add constraint "referrers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."referrers" validate constraint "referrers_user_id_fkey";

alter table "public"."referrers" add constraint "referrers_user_id_key" UNIQUE using index "referrers_user_id_key";

alter table "public"."user_booster_accounts" add constraint "user_booster_accounts_consumer_account_id_7digit_chk" CHECK (((consumer_account_id IS NULL) OR ((consumer_account_id >= 1000000) AND (consumer_account_id <= 9999999)))) not valid;

alter table "public"."user_booster_accounts" validate constraint "user_booster_accounts_consumer_account_id_7digit_chk";

alter table "public"."user_booster_accounts" add constraint "user_booster_accounts_consumer_account_id_key" UNIQUE using index "user_booster_accounts_consumer_account_id_key";

alter table "public"."user_booster_accounts" add constraint "user_booster_accounts_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES public.booster_plans(id) ON DELETE RESTRICT not valid;

alter table "public"."user_booster_accounts" validate constraint "user_booster_accounts_plan_id_fkey";

alter table "public"."user_booster_accounts" add constraint "user_booster_accounts_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'pending'::text, 'cancelled'::text, 'suspended'::text]))) not valid;

alter table "public"."user_booster_accounts" validate constraint "user_booster_accounts_status_check";

alter table "public"."user_booster_accounts" add constraint "user_booster_accounts_stripe_subscription_id_key" UNIQUE using index "user_booster_accounts_stripe_subscription_id_key";

alter table "public"."user_booster_accounts" add constraint "user_booster_accounts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_booster_accounts" validate constraint "user_booster_accounts_user_id_fkey";

alter table "public"."user_personal_info" add constraint "user_personal_info_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_personal_info" validate constraint "user_personal_info_user_id_fkey";

alter table "public"."user_personal_info" add constraint "user_personal_info_user_id_key" UNIQUE using index "user_personal_info_user_id_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public._validate_consumer_account_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if NEW.consumer_account_id is not null and (NEW.consumer_account_id < 0 or NEW.consumer_account_id >= 10000000) then
    raise exception 'consumer_account_id must be a positive integer less than 10,000,000';
  end if;
  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.backfill_highest_credit_limit()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
begin
  update public.user_booster_accounts
    set highest_credit_limit = credit_limit
  where highest_credit_limit is null and credit_limit is not null;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.bump_referrer_click(p_referral_code text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  UPDATE public.referrers SET total_clicks = total_clicks + 1 WHERE referral_code = p_referral_code;
$function$
;

CREATE OR REPLACE FUNCTION public.bump_referrer_signup(p_referral_code text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  UPDATE public.referrers SET total_signups = total_signups + 1 WHERE referral_code = p_referral_code;
$function$
;

CREATE OR REPLACE FUNCTION public.convert_and_queue_payout(p_referred_user uuid, p_amount numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.referred_users
    SET converted = true,
        conversion_at = COALESCE(conversion_at, now()),
        payout_amount = COALESCE(payout_amount, p_amount),
        payout_status = CASE WHEN payout_status = 'pending' THEN 'pending' ELSE payout_status END
  WHERE referred_user_id = p_referred_user AND converted = false;
END;$function$
;

CREATE OR REPLACE FUNCTION public.generate_referral_code(p_len integer DEFAULT 8)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no confusing chars
  result text := '';
  i int;
BEGIN
  FOR i IN 1..p_len LOOP
    result := result || substr(chars, (floor(random()*length(chars))+1)::int, 1);
  END LOOP;
  -- ensure uniqueness
  IF EXISTS (SELECT 1 FROM public.referrers WHERE referral_code = result) THEN
    RETURN public.generate_referral_code(p_len); -- recurse
  END IF;
  RETURN result;
END;$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin(p_email text)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
AS $function$
  select exists (
    select 1 from public.admin_emails where email = lower(p_email)
  );
$function$
;

CREATE OR REPLACE FUNCTION public.mark_referral_converted(p_referred_user uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.referred_users SET converted = true, conversion_at = now()
  WHERE referred_user_id = p_referred_user AND converted = false;
END;$function$
;

CREATE OR REPLACE FUNCTION public.mark_referral_payout_paid(p_referred_user uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.referred_users
    SET payout_status = 'paid', paid_at = now()
  WHERE referred_user_id = p_referred_user AND payout_status IN ('pending','approved');
END;$function$
;

CREATE OR REPLACE FUNCTION public.refresh_referral_month(p_year integer, p_month integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  r record;
  period_start timestamptz := make_timestamptz(p_year, p_month, 1, 0,0,0,'UTC');
  period_end timestamptz := (period_start + interval '1 month');
  conversions_count int;
BEGIN
  FOR r IN SELECT id FROM public.referrers LOOP
    SELECT count(*) INTO conversions_count
    FROM public.referred_users ru
    WHERE ru.referrer_id = r.id
      AND ru.converted = true
      AND ru.conversion_at >= period_start
      AND ru.conversion_at < period_end;

    -- upsert into referral_payouts
    INSERT INTO public.referral_payouts (referrer_id, period_year, period_month, conversions)
    VALUES (r.id, p_year, p_month, conversions_count)
    ON CONFLICT (referrer_id, period_year, period_month)
    DO UPDATE SET conversions = EXCLUDED.conversions;

    -- update lifetime conversions summary
    UPDATE public.referrers SET lifetime_conversions = (
      SELECT count(*) FROM public.referred_users WHERE referrer_id = r.id AND converted = true
    ) WHERE id = r.id;
  END LOOP;
END;$function$
;

grant delete on table "public"."activity_logs" to "anon";

grant insert on table "public"."activity_logs" to "anon";

grant references on table "public"."activity_logs" to "anon";

grant select on table "public"."activity_logs" to "anon";

grant trigger on table "public"."activity_logs" to "anon";

grant truncate on table "public"."activity_logs" to "anon";

grant update on table "public"."activity_logs" to "anon";

grant delete on table "public"."activity_logs" to "authenticated";

grant insert on table "public"."activity_logs" to "authenticated";

grant references on table "public"."activity_logs" to "authenticated";

grant select on table "public"."activity_logs" to "authenticated";

grant trigger on table "public"."activity_logs" to "authenticated";

grant truncate on table "public"."activity_logs" to "authenticated";

grant update on table "public"."activity_logs" to "authenticated";

grant delete on table "public"."activity_logs" to "service_role";

grant insert on table "public"."activity_logs" to "service_role";

grant references on table "public"."activity_logs" to "service_role";

grant select on table "public"."activity_logs" to "service_role";

grant trigger on table "public"."activity_logs" to "service_role";

grant truncate on table "public"."activity_logs" to "service_role";

grant update on table "public"."activity_logs" to "service_role";

grant delete on table "public"."admin_emails" to "anon";

grant insert on table "public"."admin_emails" to "anon";

grant references on table "public"."admin_emails" to "anon";

grant select on table "public"."admin_emails" to "anon";

grant trigger on table "public"."admin_emails" to "anon";

grant truncate on table "public"."admin_emails" to "anon";

grant update on table "public"."admin_emails" to "anon";

grant delete on table "public"."admin_emails" to "authenticated";

grant insert on table "public"."admin_emails" to "authenticated";

grant references on table "public"."admin_emails" to "authenticated";

grant select on table "public"."admin_emails" to "authenticated";

grant trigger on table "public"."admin_emails" to "authenticated";

grant truncate on table "public"."admin_emails" to "authenticated";

grant update on table "public"."admin_emails" to "authenticated";

grant delete on table "public"."admin_emails" to "service_role";

grant insert on table "public"."admin_emails" to "service_role";

grant references on table "public"."admin_emails" to "service_role";

grant select on table "public"."admin_emails" to "service_role";

grant trigger on table "public"."admin_emails" to "service_role";

grant truncate on table "public"."admin_emails" to "service_role";

grant update on table "public"."admin_emails" to "service_role";

grant delete on table "public"."affiliate_applications" to "anon";

grant insert on table "public"."affiliate_applications" to "anon";

grant references on table "public"."affiliate_applications" to "anon";

grant select on table "public"."affiliate_applications" to "anon";

grant trigger on table "public"."affiliate_applications" to "anon";

grant truncate on table "public"."affiliate_applications" to "anon";

grant update on table "public"."affiliate_applications" to "anon";

grant delete on table "public"."affiliate_applications" to "authenticated";

grant insert on table "public"."affiliate_applications" to "authenticated";

grant references on table "public"."affiliate_applications" to "authenticated";

grant select on table "public"."affiliate_applications" to "authenticated";

grant trigger on table "public"."affiliate_applications" to "authenticated";

grant truncate on table "public"."affiliate_applications" to "authenticated";

grant update on table "public"."affiliate_applications" to "authenticated";

grant delete on table "public"."affiliate_applications" to "service_role";

grant insert on table "public"."affiliate_applications" to "service_role";

grant references on table "public"."affiliate_applications" to "service_role";

grant select on table "public"."affiliate_applications" to "service_role";

grant trigger on table "public"."affiliate_applications" to "service_role";

grant truncate on table "public"."affiliate_applications" to "service_role";

grant update on table "public"."affiliate_applications" to "service_role";

grant delete on table "public"."booster_plans" to "anon";

grant insert on table "public"."booster_plans" to "anon";

grant references on table "public"."booster_plans" to "anon";

grant select on table "public"."booster_plans" to "anon";

grant trigger on table "public"."booster_plans" to "anon";

grant truncate on table "public"."booster_plans" to "anon";

grant update on table "public"."booster_plans" to "anon";

grant delete on table "public"."booster_plans" to "authenticated";

grant insert on table "public"."booster_plans" to "authenticated";

grant references on table "public"."booster_plans" to "authenticated";

grant select on table "public"."booster_plans" to "authenticated";

grant trigger on table "public"."booster_plans" to "authenticated";

grant truncate on table "public"."booster_plans" to "authenticated";

grant update on table "public"."booster_plans" to "authenticated";

grant delete on table "public"."booster_plans" to "service_role";

grant insert on table "public"."booster_plans" to "service_role";

grant references on table "public"."booster_plans" to "service_role";

grant select on table "public"."booster_plans" to "service_role";

grant trigger on table "public"."booster_plans" to "service_role";

grant truncate on table "public"."booster_plans" to "service_role";

grant update on table "public"."booster_plans" to "service_role";

grant delete on table "public"."downloaded_courses" to "anon";

grant insert on table "public"."downloaded_courses" to "anon";

grant references on table "public"."downloaded_courses" to "anon";

grant select on table "public"."downloaded_courses" to "anon";

grant trigger on table "public"."downloaded_courses" to "anon";

grant truncate on table "public"."downloaded_courses" to "anon";

grant update on table "public"."downloaded_courses" to "anon";

grant delete on table "public"."downloaded_courses" to "authenticated";

grant insert on table "public"."downloaded_courses" to "authenticated";

grant references on table "public"."downloaded_courses" to "authenticated";

grant select on table "public"."downloaded_courses" to "authenticated";

grant trigger on table "public"."downloaded_courses" to "authenticated";

grant truncate on table "public"."downloaded_courses" to "authenticated";

grant update on table "public"."downloaded_courses" to "authenticated";

grant delete on table "public"."downloaded_courses" to "service_role";

grant insert on table "public"."downloaded_courses" to "service_role";

grant references on table "public"."downloaded_courses" to "service_role";

grant select on table "public"."downloaded_courses" to "service_role";

grant trigger on table "public"."downloaded_courses" to "service_role";

grant truncate on table "public"."downloaded_courses" to "service_role";

grant update on table "public"."downloaded_courses" to "service_role";

grant delete on table "public"."payment_methods" to "anon";

grant insert on table "public"."payment_methods" to "anon";

grant references on table "public"."payment_methods" to "anon";

grant select on table "public"."payment_methods" to "anon";

grant trigger on table "public"."payment_methods" to "anon";

grant truncate on table "public"."payment_methods" to "anon";

grant update on table "public"."payment_methods" to "anon";

grant delete on table "public"."payment_methods" to "authenticated";

grant insert on table "public"."payment_methods" to "authenticated";

grant references on table "public"."payment_methods" to "authenticated";

grant select on table "public"."payment_methods" to "authenticated";

grant trigger on table "public"."payment_methods" to "authenticated";

grant truncate on table "public"."payment_methods" to "authenticated";

grant update on table "public"."payment_methods" to "authenticated";

grant delete on table "public"."payment_methods" to "service_role";

grant insert on table "public"."payment_methods" to "service_role";

grant references on table "public"."payment_methods" to "service_role";

grant select on table "public"."payment_methods" to "service_role";

grant trigger on table "public"."payment_methods" to "service_role";

grant truncate on table "public"."payment_methods" to "service_role";

grant update on table "public"."payment_methods" to "service_role";

grant delete on table "public"."payments" to "anon";

grant insert on table "public"."payments" to "anon";

grant references on table "public"."payments" to "anon";

grant select on table "public"."payments" to "anon";

grant trigger on table "public"."payments" to "anon";

grant truncate on table "public"."payments" to "anon";

grant update on table "public"."payments" to "anon";

grant delete on table "public"."payments" to "authenticated";

grant insert on table "public"."payments" to "authenticated";

grant references on table "public"."payments" to "authenticated";

grant select on table "public"."payments" to "authenticated";

grant trigger on table "public"."payments" to "authenticated";

grant truncate on table "public"."payments" to "authenticated";

grant update on table "public"."payments" to "authenticated";

grant delete on table "public"."payments" to "service_role";

grant insert on table "public"."payments" to "service_role";

grant references on table "public"."payments" to "service_role";

grant select on table "public"."payments" to "service_role";

grant trigger on table "public"."payments" to "service_role";

grant truncate on table "public"."payments" to "service_role";

grant update on table "public"."payments" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."referral_clicks" to "anon";

grant insert on table "public"."referral_clicks" to "anon";

grant references on table "public"."referral_clicks" to "anon";

grant select on table "public"."referral_clicks" to "anon";

grant trigger on table "public"."referral_clicks" to "anon";

grant truncate on table "public"."referral_clicks" to "anon";

grant update on table "public"."referral_clicks" to "anon";

grant delete on table "public"."referral_clicks" to "authenticated";

grant insert on table "public"."referral_clicks" to "authenticated";

grant references on table "public"."referral_clicks" to "authenticated";

grant select on table "public"."referral_clicks" to "authenticated";

grant trigger on table "public"."referral_clicks" to "authenticated";

grant truncate on table "public"."referral_clicks" to "authenticated";

grant update on table "public"."referral_clicks" to "authenticated";

grant delete on table "public"."referral_clicks" to "service_role";

grant insert on table "public"."referral_clicks" to "service_role";

grant references on table "public"."referral_clicks" to "service_role";

grant select on table "public"."referral_clicks" to "service_role";

grant trigger on table "public"."referral_clicks" to "service_role";

grant truncate on table "public"."referral_clicks" to "service_role";

grant update on table "public"."referral_clicks" to "service_role";

grant delete on table "public"."referral_payouts" to "anon";

grant insert on table "public"."referral_payouts" to "anon";

grant references on table "public"."referral_payouts" to "anon";

grant select on table "public"."referral_payouts" to "anon";

grant trigger on table "public"."referral_payouts" to "anon";

grant truncate on table "public"."referral_payouts" to "anon";

grant update on table "public"."referral_payouts" to "anon";

grant delete on table "public"."referral_payouts" to "authenticated";

grant insert on table "public"."referral_payouts" to "authenticated";

grant references on table "public"."referral_payouts" to "authenticated";

grant select on table "public"."referral_payouts" to "authenticated";

grant trigger on table "public"."referral_payouts" to "authenticated";

grant truncate on table "public"."referral_payouts" to "authenticated";

grant update on table "public"."referral_payouts" to "authenticated";

grant delete on table "public"."referral_payouts" to "service_role";

grant insert on table "public"."referral_payouts" to "service_role";

grant references on table "public"."referral_payouts" to "service_role";

grant select on table "public"."referral_payouts" to "service_role";

grant trigger on table "public"."referral_payouts" to "service_role";

grant truncate on table "public"."referral_payouts" to "service_role";

grant update on table "public"."referral_payouts" to "service_role";

grant delete on table "public"."referred_users" to "anon";

grant insert on table "public"."referred_users" to "anon";

grant references on table "public"."referred_users" to "anon";

grant select on table "public"."referred_users" to "anon";

grant trigger on table "public"."referred_users" to "anon";

grant truncate on table "public"."referred_users" to "anon";

grant update on table "public"."referred_users" to "anon";

grant delete on table "public"."referred_users" to "authenticated";

grant insert on table "public"."referred_users" to "authenticated";

grant references on table "public"."referred_users" to "authenticated";

grant select on table "public"."referred_users" to "authenticated";

grant trigger on table "public"."referred_users" to "authenticated";

grant truncate on table "public"."referred_users" to "authenticated";

grant update on table "public"."referred_users" to "authenticated";

grant delete on table "public"."referred_users" to "service_role";

grant insert on table "public"."referred_users" to "service_role";

grant references on table "public"."referred_users" to "service_role";

grant select on table "public"."referred_users" to "service_role";

grant trigger on table "public"."referred_users" to "service_role";

grant truncate on table "public"."referred_users" to "service_role";

grant update on table "public"."referred_users" to "service_role";

grant delete on table "public"."referrers" to "anon";

grant insert on table "public"."referrers" to "anon";

grant references on table "public"."referrers" to "anon";

grant select on table "public"."referrers" to "anon";

grant trigger on table "public"."referrers" to "anon";

grant truncate on table "public"."referrers" to "anon";

grant update on table "public"."referrers" to "anon";

grant delete on table "public"."referrers" to "authenticated";

grant insert on table "public"."referrers" to "authenticated";

grant references on table "public"."referrers" to "authenticated";

grant select on table "public"."referrers" to "authenticated";

grant trigger on table "public"."referrers" to "authenticated";

grant truncate on table "public"."referrers" to "authenticated";

grant update on table "public"."referrers" to "authenticated";

grant delete on table "public"."referrers" to "service_role";

grant insert on table "public"."referrers" to "service_role";

grant references on table "public"."referrers" to "service_role";

grant select on table "public"."referrers" to "service_role";

grant trigger on table "public"."referrers" to "service_role";

grant truncate on table "public"."referrers" to "service_role";

grant update on table "public"."referrers" to "service_role";

grant delete on table "public"."user_booster_accounts" to "anon";

grant insert on table "public"."user_booster_accounts" to "anon";

grant references on table "public"."user_booster_accounts" to "anon";

grant select on table "public"."user_booster_accounts" to "anon";

grant trigger on table "public"."user_booster_accounts" to "anon";

grant truncate on table "public"."user_booster_accounts" to "anon";

grant update on table "public"."user_booster_accounts" to "anon";

grant delete on table "public"."user_booster_accounts" to "authenticated";

grant insert on table "public"."user_booster_accounts" to "authenticated";

grant references on table "public"."user_booster_accounts" to "authenticated";

grant select on table "public"."user_booster_accounts" to "authenticated";

grant trigger on table "public"."user_booster_accounts" to "authenticated";

grant truncate on table "public"."user_booster_accounts" to "authenticated";

grant update on table "public"."user_booster_accounts" to "authenticated";

grant delete on table "public"."user_booster_accounts" to "service_role";

grant insert on table "public"."user_booster_accounts" to "service_role";

grant references on table "public"."user_booster_accounts" to "service_role";

grant select on table "public"."user_booster_accounts" to "service_role";

grant trigger on table "public"."user_booster_accounts" to "service_role";

grant truncate on table "public"."user_booster_accounts" to "service_role";

grant update on table "public"."user_booster_accounts" to "service_role";

grant delete on table "public"."user_personal_info" to "anon";

grant insert on table "public"."user_personal_info" to "anon";

grant references on table "public"."user_personal_info" to "anon";

grant select on table "public"."user_personal_info" to "anon";

grant trigger on table "public"."user_personal_info" to "anon";

grant truncate on table "public"."user_personal_info" to "anon";

grant update on table "public"."user_personal_info" to "anon";

grant delete on table "public"."user_personal_info" to "authenticated";

grant insert on table "public"."user_personal_info" to "authenticated";

grant references on table "public"."user_personal_info" to "authenticated";

grant select on table "public"."user_personal_info" to "authenticated";

grant trigger on table "public"."user_personal_info" to "authenticated";

grant truncate on table "public"."user_personal_info" to "authenticated";

grant update on table "public"."user_personal_info" to "authenticated";

grant delete on table "public"."user_personal_info" to "service_role";

grant insert on table "public"."user_personal_info" to "service_role";

grant references on table "public"."user_personal_info" to "service_role";

grant select on table "public"."user_personal_info" to "service_role";

grant trigger on table "public"."user_personal_info" to "service_role";

grant truncate on table "public"."user_personal_info" to "service_role";

grant update on table "public"."user_personal_info" to "service_role";


  create policy "Users can insert their own activity logs"
  on "public"."activity_logs"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can view their own activity logs"
  on "public"."activity_logs"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Admin can select all affiliates"
  on "public"."affiliate_applications"
  as permissive
  for select
  to public
using (public.is_admin(auth.email()));



  create policy "User can insert own affiliate row"
  on "public"."affiliate_applications"
  as permissive
  for insert
  to public
with check ((auth.uid() = id));



  create policy "User can select own affiliate row"
  on "public"."affiliate_applications"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "User can update own affiliate row"
  on "public"."affiliate_applications"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "Anyone can view active booster plans"
  on "public"."booster_plans"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "Users can insert their own downloaded courses"
  on "public"."downloaded_courses"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can view their own downloaded courses"
  on "public"."downloaded_courses"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can delete their own payment methods"
  on "public"."payment_methods"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert their own payment methods"
  on "public"."payment_methods"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update their own payment methods"
  on "public"."payment_methods"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view their own payment methods"
  on "public"."payment_methods"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert their own payments"
  on "public"."payments"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can view their own payments"
  on "public"."payments"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "referral_clicks_no_access"
  on "public"."referral_clicks"
  as permissive
  for all
  to public
using (false)
with check (false);



  create policy "referral_payouts_no_client_write"
  on "public"."referral_payouts"
  as permissive
  for all
  to public
using (false)
with check (false);



  create policy "referral_payouts_select_owner"
  on "public"."referral_payouts"
  as permissive
  for select
  to public
using ((auth.uid() IN ( SELECT r.user_id
   FROM public.referrers r
  WHERE (r.id = referral_payouts.referrer_id))));



  create policy "referred_users_no_client_insert"
  on "public"."referred_users"
  as permissive
  for insert
  to public
with check (false);



  create policy "referred_users_select_self"
  on "public"."referred_users"
  as permissive
  for select
  to public
using (((auth.uid() = referred_user_id) OR (auth.uid() IN ( SELECT r.user_id
   FROM public.referrers r
  WHERE (r.id = referred_users.referrer_id)))));



  create policy "referrers_insert_owner"
  on "public"."referrers"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "referrers_select_owner"
  on "public"."referrers"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "referrers_update_status"
  on "public"."referrers"
  as permissive
  for update
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Service role can insert booster accounts"
  on "public"."user_booster_accounts"
  as permissive
  for insert
  to service_role
with check (true);



  create policy "Users can delete their own booster accounts"
  on "public"."user_booster_accounts"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert their own booster accounts"
  on "public"."user_booster_accounts"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update their own booster accounts"
  on "public"."user_booster_accounts"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view their own booster accounts"
  on "public"."user_booster_accounts"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert their own personal info"
  on "public"."user_personal_info"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update their own personal info"
  on "public"."user_personal_info"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view their own personal info"
  on "public"."user_personal_info"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));


CREATE TRIGGER trg_validate_consumer_account_id BEFORE INSERT OR UPDATE ON public.user_booster_accounts FOR EACH ROW EXECUTE FUNCTION public._validate_consumer_account_id();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


