-- Fix SECURITY DEFINER view warnings by inlining the get_user_family_ids logic
-- This eliminates the dependency on SECURITY DEFINER functions while maintaining security

-- Drop and recreate views without SECURITY DEFINER function calls
DROP VIEW IF EXISTS public.family_member_profiles CASCADE;
DROP VIEW IF EXISTS public.invites_masked CASCADE;

-- family_member_profiles: Inline the family membership check
CREATE VIEW public.family_member_profiles AS
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
    AND m.family_id IN (
      SELECT family_id 
      FROM public.members 
      WHERE profile_id = auth.uid()
    )
);

-- invites_masked: Inline the family membership check with email masking
CREATE VIEW public.invites_masked AS
SELECT 
  i.id,
  i.family_id,
  i.role,
  CASE 
    WHEN position('@' in i.email) > 1 THEN
      substring(i.email from 1 for 1) || '***' || substring(i.email from position('@' in i.email))
    ELSE '***'
  END AS email,
  i.status,
  i.created_at,
  i.accepted_at,
  i.expires_at,
  i.invited_by
FROM public.invites i
WHERE i.family_id IN (
  SELECT family_id 
  FROM public.members 
  WHERE profile_id = auth.uid()
);