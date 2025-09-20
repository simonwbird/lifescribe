-- Fix the remaining security definer view issue
-- Drop and recreate person_timeline_items without any security options

DROP VIEW IF EXISTS public.person_timeline_items CASCADE;

-- Recreate person_timeline_items as a standard view without security options
CREATE VIEW public.person_timeline_items AS
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