-- =====================================================
-- RLS Security Fixes for Production
-- Created: 2026-02-23
-- =====================================================
-- This migration fixes critical RLS security issues:
-- 1. Profiles table missing RLS + policies
-- 2. Courses table missing RLS + policies  
-- 3. Admin_emails missing policies
-- 4. Payments missing UPDATE/DELETE policies
-- 5. Activity_logs missing UPDATE/DELETE policies
-- =====================================================

-- =====================================================
-- FIX 1: Enable RLS on profiles table + Add missing policies
-- =====================================================
-- NOTE: Profiles table already has 2 policies (update/view own profile)
-- Adding missing policies for INSERT, DELETE, and admin access

-- Ensure RLS is enabled (safe to run multiple times)
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

-- Check existing policies with: 
-- SELECT policyname FROM pg_policies WHERE tablename = 'profiles';

-- Users can insert their own profile (via trigger on signup)
-- Only create if doesn't already exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
    ON "public"."profiles"
    AS PERMISSIVE
    FOR INSERT
    TO public
    WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Admins can view all profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles"
    ON "public"."profiles"
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING (public.is_admin(auth.email()));
  END IF;
END $$;

-- Service role can manage all profiles (for Stripe webhook updates)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Service role can manage profiles'
  ) THEN
    CREATE POLICY "Service role can manage profiles"
    ON "public"."profiles"
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Users should NOT be able to delete their own profiles (data retention)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'No user deletion of profiles'
  ) THEN
    CREATE POLICY "No user deletion of profiles"
    ON "public"."profiles"
    AS RESTRICTIVE
    FOR DELETE
    TO public
    USING (false);
  END IF;
END $$;


-- =====================================================
-- FIX 2: Enable RLS on courses table (CRITICAL)
-- =====================================================
-- ISSUE: courses table has NO RLS enabled
-- RISK: Public can modify course catalog

ALTER TABLE IF EXISTS "public"."courses" ENABLE ROW LEVEL SECURITY;

-- Anyone can view courses (public catalog)
CREATE POLICY "Anyone can view courses"
ON "public"."courses"
AS PERMISSIVE
FOR SELECT
TO public
USING (true);

-- Only service role can modify courses
CREATE POLICY "Service role can manage courses"
ON "public"."courses"
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- =====================================================
-- FIX 3: Add policies for admin_emails table
-- =====================================================
-- ISSUE: admin_emails has RLS enabled but NO policies
-- RISK: Table is completely inaccessible (deny-by-default)

-- Admins can view admin emails
CREATE POLICY "Admins can view admin emails"
ON "public"."admin_emails"
AS PERMISSIVE
FOR SELECT
TO public
USING (public.is_admin(auth.email()));

-- Service role can manage admin emails
CREATE POLICY "Service role can manage admin emails"
ON "public"."admin_emails"
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- =====================================================
-- FIX 4: Add missing UPDATE/DELETE policies for payments
-- =====================================================
-- ISSUE: Users can only INSERT/SELECT payments, cannot UPDATE/DELETE
-- FIX: Add policies to prevent orphaned/incorrect payment records

-- Users CANNOT update payments (only Stripe webhooks via service role)
CREATE POLICY "Service role can update payments"
ON "public"."payments"
AS PERMISSIVE
FOR UPDATE
TO service_role
USING (true);

-- Users CANNOT delete payments (immutable financial records)
CREATE POLICY "No deletion of payments"
ON "public"."payments"
AS RESTRICTIVE
FOR DELETE
TO public
USING (false);


-- =====================================================
-- FIX 5: Add missing UPDATE/DELETE policies for activity_logs
-- =====================================================
-- ISSUE: Users can only INSERT/SELECT activity logs
-- FIX: Activity logs should be append-only (no updates/deletes)

-- Users cannot update activity logs (immutable audit trail)
CREATE POLICY "No updates to activity logs"
ON "public"."activity_logs"
AS RESTRICTIVE
FOR UPDATE
TO public
USING (false);

-- Users cannot delete activity logs (immutable audit trail)
CREATE POLICY "No deletion of activity logs"
ON "public"."activity_logs"
AS RESTRICTIVE
FOR DELETE
TO public
USING (false);

-- Service role can manage activity logs (for cleanup/maintenance)
CREATE POLICY "Service role can manage activity logs"
ON "public"."activity_logs"
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- =====================================================
-- FIX 6: Add DELETE policy for affiliate_applications
-- =====================================================
-- ISSUE: Users cannot delete their own affiliate applications
-- FIX: Allow users to withdraw applications

CREATE POLICY "Users can delete own affiliate application"
ON "public"."affiliate_applications"
AS PERMISSIVE
FOR DELETE
TO public
USING (auth.uid() = id AND affiliate_status = 'pending');


-- =====================================================
-- FIX 7: Add UPDATE policy for payments status
-- =====================================================
-- ISSUE: Admins need to update payment status manually
-- FIX: Allow admins to update payment statuses

CREATE POLICY "Admins can update payments"
ON "public"."payments"
AS PERMISSIVE
FOR UPDATE
TO public
USING (public.is_admin(auth.email()));


-- =====================================================
-- FIX 8: Add UPDATE policy for downloaded_courses
-- =====================================================
-- ISSUE: No reason to update downloaded courses
-- FIX: Explicitly block updates (immutable records)

CREATE POLICY "No updates to downloaded courses"
ON "public"."downloaded_courses"
AS RESTRICTIVE
FOR UPDATE
TO public
USING (false);

CREATE POLICY "Users can delete own downloaded course records"
ON "public"."downloaded_courses"
AS PERMISSIVE
FOR DELETE
TO public
USING (auth.uid() = user_id);


-- =====================================================
-- VERIFICATION QUERIES (Run these to test)
-- =====================================================

-- Verify all tables have RLS enabled:
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename;

-- Verify all policies exist:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- Test as regular user (should see only own data):
-- SELECT * FROM profiles WHERE id = auth.uid();
-- SELECT * FROM payments WHERE user_id = auth.uid();

-- Test as admin (should see all data):
-- SELECT count(*) FROM profiles; -- (if is_admin = true)
