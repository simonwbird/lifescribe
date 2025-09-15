-- Fix security issues

-- 1. Remove public access to questions table and restrict to authenticated family members only
DROP POLICY IF EXISTS "Anyone can view questions" ON public.questions;

-- Create new secure policy for questions table
CREATE POLICY "Family members can view questions" 
ON public.questions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.members 
    WHERE profile_id = auth.uid()
  )
);

-- 2. Enable leaked password protection in auth settings
-- Note: This needs to be enabled in the Supabase dashboard Auth settings
-- The SQL command would be:
-- UPDATE auth.config SET leaked_password_protection = true;
-- But this requires superuser privileges, so it must be done via dashboard

-- 3. Add additional security to profiles table to ensure email privacy
-- Update profiles RLS policy to be more explicit about email protection
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

CREATE POLICY "Users can only view their own profile data" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

-- 4. Ensure no other ways to access profile emails exist
-- Check if any functions or views might expose profile data
-- Add a policy to prevent any potential data leaks through joins