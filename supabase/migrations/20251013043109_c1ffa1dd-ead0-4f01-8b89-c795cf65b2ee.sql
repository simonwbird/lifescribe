-- Add About Me block to all living people who don't have it yet
INSERT INTO public.person_page_blocks (person_id, type, content_json, block_order, visibility, is_enabled, pinned)
SELECT 
  p.id,
  'about_me',
  '{}'::jsonb,
  0, -- Place at the top
  'family',
  true,
  true
FROM public.people p
WHERE (p.is_living = true OR p.is_living IS NULL)
  AND NOT EXISTS (
    SELECT 1 FROM public.person_page_blocks ppb
    WHERE ppb.person_id = p.id AND ppb.type = 'about_me'
  );

-- Update existing About Me blocks for living people to be pinned
UPDATE public.person_page_blocks
SET pinned = true
WHERE type = 'about_me'
  AND person_id IN (
    SELECT id FROM public.people WHERE is_living = true OR is_living IS NULL
  )
  AND (pinned IS NULL OR pinned = false);

-- Reorder blocks to ensure About Me is right after hero blocks
WITH ranked_blocks AS (
  SELECT 
    id,
    person_id,
    type,
    ROW_NUMBER() OVER (
      PARTITION BY person_id 
      ORDER BY 
        CASE 
          WHEN type IN ('hero', 'hero_life') THEN 0
          WHEN type = 'about_me' THEN 1
          ELSE block_order + 2
        END
    ) as new_order
  FROM public.person_page_blocks
  WHERE person_id IN (SELECT id FROM public.people WHERE is_living = true OR is_living IS NULL)
)
UPDATE public.person_page_blocks ppb
SET block_order = rb.new_order - 1
FROM ranked_blocks rb
WHERE ppb.id = rb.id;