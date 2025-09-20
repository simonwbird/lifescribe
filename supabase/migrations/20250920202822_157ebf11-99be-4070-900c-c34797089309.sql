-- Secure views by constraining rows to the current user's families and enabling security barriers
-- Note: Views cannot have RLS. We harden by filtering with auth.uid() and setting security_barrier.

-- family_member_profiles: constrain to profiles belonging to the current user's families
CREATE OR REPLACE VIEW public.family_member_profiles
WITH (security_barrier = true)
AS
SELECT 
  p.settings,
  p.timezone,
  p.simple_mode,
  p.country,
  p.full_name,
  p.created_at,
  p.id,
  p.avatar_url,
  p.locale
FROM public.profiles p
WHERE EXISTS (
  SELECT 1 
  FROM public.members m
  WHERE m.profile_id = p.id
    AND m.family_id = ANY (public.get_user_family_ids(auth.uid()))
);

-- invites_masked: keep masked email and constrain to the current user's families
CREATE OR REPLACE VIEW public.invites_masked
WITH (security_barrier = true)
AS
SELECT 
  i.created_at,
  CASE 
    WHEN position('@' in i.email) > 1 THEN
      substring(i.email from 1 for 1) || '***' || substring(i.email from position('@' in i.email))
    ELSE NULL
  END AS email,
  i.status,
  i.id,
  i.family_id,
  i.role,
  i.accepted_at,
  i.expires_at,
  i.invited_by
FROM public.invites i
WHERE i.family_id = ANY (public.get_user_family_ids(auth.uid()));
