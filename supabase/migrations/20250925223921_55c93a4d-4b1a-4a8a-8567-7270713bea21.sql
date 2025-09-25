-- CRITICAL SECURITY FIX: Implement field-level restrictions for profiles table
-- Problem: Family members can currently see email addresses of other family members
-- Solution: Create separate policies for self-access vs family-access with restricted fields

-- Step 1: Remove overly permissive policies that expose emails to family members
DROP POLICY IF EXISTS "Family members can view basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "profiles_family_access" ON public.profiles;
DROP POLICY IF EXISTS "secure_profiles_family_access_2024" ON public.profiles;

-- Step 2: Keep self-access policy (users can see their own full profile including email)
-- This policy already exists: "secure_profiles_self_access_2024" - keep it

-- Step 3: Create a secure function for family members to access ONLY non-sensitive profile fields
CREATE OR REPLACE FUNCTION public.get_family_member_safe_profiles(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  id uuid,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone,
  simple_mode boolean,
  locale text,
  timezone text,
  country text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Return only NON-SENSITIVE fields (NO email, settings, feature_flags etc.)
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.created_at,
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
  AND p_user_id IS NOT NULL;
$$;

-- Grant execute only to authenticated users
GRANT EXECUTE ON FUNCTION public.get_family_member_safe_profiles TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_family_member_safe_profiles FROM anon, public;