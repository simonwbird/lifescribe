-- Fix the view to be security invoker instead of security definer
create or replace view public.person_timeline_items
with (security_invoker = true) as
select
  psl.person_id,
  s.id as item_id,
  'story'::text as item_type,
  coalesce(s.occurred_on, s.created_at::date) as happened_on,
  s.occurred_precision,
  s.is_approx,
  s.title as title,
  left(s.content, 240) as excerpt,
  s.family_id
from public.person_story_links psl
join public.stories s on s.id = psl.story_id

union all
select
  pal.person_id,
  a.id as item_id,
  'answer'::text as item_type,
  coalesce(a.occurred_on, a.created_at::date) as happened_on,
  a.occurred_precision,
  a.is_approx,
  q.question_text as title,
  left(a.answer_text, 240) as excerpt,
  a.family_id
from public.person_answer_links pal
join public.answers a on a.id = pal.answer_id
left join public.questions q on q.id = a.question_id;