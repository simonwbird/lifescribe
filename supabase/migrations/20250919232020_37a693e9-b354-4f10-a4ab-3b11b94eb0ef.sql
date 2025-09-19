-- Enhance person_timeline_items view security with additional safeguards
-- Since we can't add RLS directly to views, we'll recreate it with explicit family filtering

-- Drop and recreate the view with built-in family access controls
DROP VIEW IF EXISTS public.person_timeline_items;

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
  LEFT(s.content, 240) AS excerpt,
  s.family_id
FROM person_story_links psl
JOIN stories s ON s.id = psl.story_id
-- Explicit family access control in the view itself
WHERE s.family_id IN (
  SELECT m.family_id 
  FROM members m 
  WHERE m.profile_id = auth.uid()
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
  LEFT(a.answer_text, 240) AS excerpt,
  a.family_id
FROM person_answer_links pal
JOIN answers a ON a.id = pal.answer_id
LEFT JOIN questions q ON q.id = a.question_id
-- Explicit family access control in the view itself
WHERE a.family_id IN (
  SELECT m.family_id 
  FROM members m 
  WHERE m.profile_id = auth.uid()
);

-- Add a comment explaining the security approach
COMMENT ON VIEW public.person_timeline_items IS 
'Timeline view with defense-in-depth security: inherits RLS from underlying tables AND includes explicit family-based filtering to prevent any potential data exposure through complex joins/unions.';