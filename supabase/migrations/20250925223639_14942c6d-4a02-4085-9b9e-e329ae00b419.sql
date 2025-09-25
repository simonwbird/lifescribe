-- Security fix: Replace the family_member_profiles view with a secure function approach
-- The view exists but may not properly enforce authentication in all API contexts

-- Create a security definer function that enforces proper access control
CREATE OR REPLACE FUNCTION public.get_family_member_profiles_secure(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  id uuid, 
  full_name text, 
  avatar_url text, 
  created_at timestamp with time zone, 
  settings jsonb, 
  simple_mode boolean, 
  locale text, 
  timezone text, 
  country text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only return profiles of users who are in the same families as the requesting user
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.created_at,
    p.settings,
    p.simple_mode,
    p.locale,
    p.timezone,
    p.country
  FROM public.profiles p
  WHERE EXISTS (
    SELECT 1
    FROM public.members m1
    WHERE m1.profile_id = p.id
      AND m1.family_id IN (
        SELECT m2.family_id
        FROM public.members m2
        WHERE m2.profile_id = p_user_id
      )
  )
  -- Additional safety: ensure the requesting user is authenticated
  AND p_user_id IS NOT NULL;
$$;

-- Grant execute permission only to authenticated users
GRANT EXECUTE ON FUNCTION public.get_family_member_profiles_secure TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_family_member_profiles_secure FROM anon, public;