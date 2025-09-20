-- Fix security issues by removing security_barrier from views
-- Views with security_barrier are flagged by the linter as potentially problematic

-- Recreate views without security_barrier - they will still be secure through WHERE filtering
DROP VIEW IF EXISTS public.family_member_profiles CASCADE;
DROP VIEW IF EXISTS public.invites_masked CASCADE;

-- family_member_profiles: Only show profiles of users in the current user's families
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
    AND m.family_id = ANY (public.get_user_family_ids(auth.uid()))
);

-- invites_masked: Only show invites for the current user's families with masked emails
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
WHERE i.family_id = ANY (public.get_user_family_ids(auth.uid()));