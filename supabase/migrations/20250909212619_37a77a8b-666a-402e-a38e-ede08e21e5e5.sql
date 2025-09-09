-- Link some existing stories to people in the Bird Family

-- Get story and person IDs first, then create links
INSERT INTO person_story_links (person_id, story_id, family_id)
SELECT 
    p.id as person_id,
    s.id as story_id,
    p.family_id
FROM people p, stories s
WHERE p.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba'
  AND s.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba'
  AND (
    -- Link treehouse story to John (since it's about childhood)
    (p.full_name = 'John Bird' AND s.title = 'The Summer We Built a Treehouse') OR
    -- Link grandma's cookie recipe to Mary (the grandmother) 
    (p.full_name = 'Mary Bird' AND s.title = 'Grandma''s Secret Cookie Recipe') OR
    -- Link Dad's workshop story to Robert
    (p.full_name = 'Robert Bird' AND s.title = 'Dad''s Workshop Stories') OR
    -- Link first Christmas to Robert and Mary
    (p.full_name = 'Robert Bird' AND s.title = 'Our Family''s First Christmas') OR
    (p.full_name = 'Mary Bird' AND s.title = 'Our Family''s First Christmas') OR
    -- Link road trip to the whole family
    (p.full_name IN ('Robert Bird', 'Mary Bird', 'John Bird', 'Sarah Bird Johnson') AND s.title = 'The Great Family Road Trip of ''85')
  )
ON CONFLICT (person_id, story_id) DO NOTHING;