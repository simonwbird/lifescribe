
-- Initialize tribute preset blocks for people who have passed but have no blocks yet
-- This specifically targets Shirley Lenore Thomas's page to reveal the new tribute design

DO $$
DECLARE
  person_record RECORD;
BEGIN
  -- Find people who have passed but have no person_page_blocks
  FOR person_record IN 
    SELECT p.id 
    FROM people p
    LEFT JOIN person_page_blocks ppb ON ppb.person_id = p.id
    WHERE p.is_living = false 
    AND p.death_date IS NOT NULL
    AND ppb.id IS NULL
    GROUP BY p.id
  LOOP
    -- Insert tribute preset blocks
    INSERT INTO person_page_blocks (person_id, type, content_json, block_order, visibility, is_enabled)
    VALUES 
      (person_record.id, 'hero_memorial', '{}'::jsonb, 0, 'public', true),
      (person_record.id, 'life_arc_timeline', '{}'::jsonb, 1, 'public', true),
      (person_record.id, 'story_collage', '{}'::jsonb, 2, 'family', true),
      (person_record.id, 'audio_remembrances', '{}'::jsonb, 3, 'family', true),
      (person_record.id, 'gallery', '{}'::jsonb, 4, 'public', true),
      (person_record.id, 'relationships', '{}'::jsonb, 5, 'public', true),
      (person_record.id, 'guestbook_tribute', '{}'::jsonb, 6, 'public', true),
      (person_record.id, 'service_events', '{}'::jsonb, 7, 'public', true);
    
    RAISE NOTICE 'Initialized tribute blocks for person: %', person_record.id;
  END LOOP;
END $$;

-- Verify the blocks were created
SELECT 
  p.full_name,
  COUNT(ppb.id) as block_count,
  array_agg(ppb.type ORDER BY ppb.block_order) as block_types
FROM people p
LEFT JOIN person_page_blocks ppb ON ppb.person_id = p.id
WHERE p.is_living = false
GROUP BY p.id, p.full_name
ORDER BY p.full_name;
