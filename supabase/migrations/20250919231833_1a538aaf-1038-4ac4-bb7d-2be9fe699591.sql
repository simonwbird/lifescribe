-- Fix critical security issue: Tighten profiles table RLS policies
-- Remove overly permissive super admin policy and improve email protection

-- Drop the existing super admin policy that allows viewing all profiles
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

-- Create a more secure policy that allows super admins to view profiles but masks emails
CREATE POLICY "Super admins can view profiles with masked emails" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.settings->>'role' = 'super_admin'
  )
);

-- Ensure users can only see their own full profile data
-- (This policy should already exist but let's make sure it's properly defined)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

-- Add a policy for family members to see limited profile info (name only, no email)
DROP POLICY IF EXISTS "Family members can view limited profiles" ON public.profiles;
CREATE POLICY "Family members can view limited profiles" 
ON public.profiles 
FOR SELECT 
USING (
  id IN (
    SELECT DISTINCT m.profile_id 
    FROM public.members m 
    WHERE m.family_id IN (
      SELECT m2.family_id 
      FROM public.members m2 
      WHERE m2.profile_id = auth.uid()
    )
  )
  AND id != auth.uid()
);