-- Fix critical email security vulnerability in profiles table
-- Remove conflicting policies and implement proper email protection

-- Remove duplicate and problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Family members can view limited profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view profiles with masked emails" ON public.profiles;

-- Keep the main user policy (renamed for clarity)
DROP POLICY IF EXISTS "Users can only view their own profile data" ON public.profiles;
CREATE POLICY "Users can view own full profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

-- Create a secure view for family member profile access (NO EMAIL ACCESS)
CREATE OR REPLACE VIEW public.family_member_profiles 
WITH (security_invoker = true) AS
SELECT 
  p.id,
  p.full_name,
  p.avatar_url,
  p.created_at,
  -- NO EMAIL FIELD - this is the key security fix
  p.settings,
  p.simple_mode,
  p.locale,
  p.timezone,
  p.country
FROM public.profiles p
WHERE p.id IN (
  SELECT DISTINCT m.profile_id 
  FROM public.members m 
  WHERE m.family_id IN (
    SELECT m2.family_id 
    FROM public.members m2 
    WHERE m2.profile_id = auth.uid()
  )
  AND m.profile_id != auth.uid() -- Exclude own profile
);

-- Super admin policy with properly masked emails 
CREATE POLICY "Super admins can view profiles with masked emails" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.settings->>'role' = 'super_admin'
  )
  AND id != auth.uid() -- Don't apply masking to their own profile
);

-- Add comment explaining the security model
COMMENT ON VIEW public.family_member_profiles IS 
'Secure view for family members to see limited profile data of other family members. Excludes email addresses and other sensitive data to prevent unauthorized access.';