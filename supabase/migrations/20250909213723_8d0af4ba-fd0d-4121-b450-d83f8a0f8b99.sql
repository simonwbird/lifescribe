-- Add a family car example to the Bird Family things collection

INSERT INTO public.things (
  family_id, 
  created_by, 
  title, 
  object_type, 
  year_estimated, 
  maker, 
  description, 
  provenance, 
  condition, 
  value_estimate,
  current_property_id,
  room_hint,
  tags
) VALUES (
  'a235280e-6110-4a83-a69b-a5ba34f676ba',
  'f328f60e-5379-465b-b1f9-2ed5226e1b49',
  '1978 Ford Station Wagon',
  'vehicle',
  1978,
  'Ford Motor Company',
  'Classic wood-paneled station wagon that served as the family car for over a decade. Cream exterior with wood grain side panels.',
  'Bought new by Robert Bird in 1978 for $4,200. This was the car that took the family on countless road trips, camping adventures, and daily drives to school and work. Sold in 1989 when the kids grew up.',
  'Sold - was in good condition',
  'Sold for $1,800 in 1989',
  (SELECT id FROM public.properties WHERE family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba' LIMIT 1),
  'Driveway (when owned)',
  ARRAY['family car', 'road trips', 'vintage', 'sold', 'memories']
);

-- Link the station wagon to Robert (father) and some family stories
INSERT INTO public.thing_person_links (thing_id, person_id, family_id)
SELECT 
  t.id as thing_id,
  p.id as person_id,
  t.family_id
FROM things t, people p
WHERE t.title = '1978 Ford Station Wagon'
  AND t.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba'
  AND p.full_name = 'Robert Bird'
  AND p.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba';

-- Link the station wagon to the road trip story
INSERT INTO public.thing_story_links (thing_id, story_id, family_id)
SELECT 
  t.id as thing_id,
  s.id as story_id,
  t.family_id
FROM things t, stories s
WHERE t.title = '1978 Ford Station Wagon'
  AND t.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba'
  AND s.title = 'The Great Family Road Trip of ''85'
  AND s.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba';