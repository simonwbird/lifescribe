-- Strengthen profiles RLS and add safe family_member_profiles view via SECURITY DEFINER function

-- Ensure RLS is enabled on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting or permissive policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own full profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can only view their own profile data" ON public.profiles;
DROP POLICY IF EXISTS "Family members can view limited profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view profiles with masked emails" ON public.profiles;
DROP POLICY IF EXISTS "Family members can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Recreate minimal, strict policies
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid());

-- Allow super admins to view all profiles for admin tooling (counts/search)
CREATE POLICY "Super admins can view profiles"
ON public.profiles
FOR SELECT
USING (public.is_super_admin(auth.uid()));

-- Create SECURITY DEFINER function to safely expose limited family member profile fields
CREATE OR REPLACE FUNCTION public.get_family_member_profiles(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  created_at timestamptz,
  settings jsonb,
  simple_mode boolean,
  locale text,
  timezone text,
  country text
) AS $$
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
    FROM public.members m
    WHERE m.profile_id = p.id
      AND m.family_id = ANY (public.get_user_family_ids(p_user_id))
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Recreate the safe view based on the function (no email column exposed)
DROP VIEW IF EXISTS public.family_member_profiles;
CREATE VIEW public.family_member_profiles
WITH (security_invoker = true)
AS
SELECT * FROM public.get_family_member_profiles();

COMMENT ON VIEW public.family_member_profiles IS 
  'Safe view of family members limited to non-sensitive fields (no email). Backed by SECURITY DEFINER function.';

-- Grant usage to authenticated clients
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'authenticated'
  ) THEN
    GRANT SELECT ON public.family_member_profiles TO authenticated;
  END IF;
END $$;