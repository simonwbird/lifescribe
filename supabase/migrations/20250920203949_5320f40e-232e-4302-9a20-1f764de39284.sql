-- Fix SECURITY DEFINER view warnings by explicitly setting SECURITY INVOKER
-- According to Postgres documentation, views default to SECURITY DEFINER
-- We need to explicitly set them to SECURITY INVOKER for better security

DROP VIEW IF EXISTS public.family_member_profiles CASCADE;
DROP VIEW IF EXISTS public.invites_masked CASCADE;
DROP VIEW IF EXISTS public.person_timeline_items CASCADE;

-- Recreate all views with explicit SECURITY INVOKER
CREATE VIEW public.family_member_profiles 
WITH (security_invoker = true) AS
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

CREATE VIEW public.invites_masked 
WITH (security_invoker = true) AS
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

CREATE VIEW public.person_timeline_items 
WITH (security_invoker = true) AS
SELECT 
  psl.person_id,
  s.id AS item_id,
  'story'::text AS item_type,
  COALESCE(s.occurred_on, s.created_at::date) AS happened_on,
  s.occurred_precision,
  s.is_approx,
  s.title,
  left(s.content, 240) AS excerpt,
  s.family_id
FROM person_story_links psl
JOIN stories s ON s.id = psl.story_id
WHERE s.family_id IN (
  SELECT family_id 
  FROM members 
  WHERE profile_id = auth.uid()
)
UNION ALL
SELECT 
  pal.person_id,
  a.id AS item_id,
  'answer'::text AS item_type,
  COALESCE(a.occurred_on, a.created_at::date) AS happened_on,
  a.occurred_precision,
  a.is_approx,
  q.question_text AS title,
  left(a.answer_text, 240) AS excerpt,
  a.family_id
FROM person_answer_links pal
JOIN answers a ON a.id = pal.answer_id
LEFT JOIN questions q ON q.id = a.question_id
WHERE a.family_id IN (
  SELECT family_id 
  FROM members 
  WHERE profile_id = auth.uid()
);