-- Add affiliate_joined to allowed activity types
ALTER TABLE "public"."activity_logs" DROP CONSTRAINT "activity_logs_activity_type_check";

ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_activity_type_check" 
  CHECK (activity_type = ANY (ARRAY[
    'account_created'::text, 
    'plan_added'::text, 
    'plan_cancelled'::text, 
    'payment_made'::text, 
    'payment_failed'::text, 
    'profile_updated'::text, 
    'password_changed'::text, 
    'course_downloaded'::text,
    'affiliate_joined'::text
  ]));
