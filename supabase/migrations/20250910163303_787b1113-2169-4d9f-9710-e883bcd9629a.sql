-- Fix inverted family relationships and remove incorrect spouse link

-- First, delete all existing parent relationships (they're all backwards)
DELETE FROM relationships WHERE relationship_type = 'parent';

-- Delete the incorrect James ↔ Emma spouse relationship  
DELETE FROM relationships 
WHERE relationship_type = 'spouse' 
AND (
  (from_person_id IN (
    SELECT id FROM people WHERE full_name = 'James Johnson'
  ) AND to_person_id IN (
    SELECT id FROM people WHERE full_name = 'Emma Bird'
  ))
  OR
  (from_person_id IN (
    SELECT id FROM people WHERE full_name = 'Emma Bird'  
  ) AND to_person_id IN (
    SELECT id FROM people WHERE full_name = 'James Johnson'
  ))
);

-- Now insert the correct parent relationships
-- Robert Bird → parent → John Bird, Sarah Bird Johnson, Simon Bird
INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_at)
SELECT 
  p1.family_id,
  p1.id as from_person_id,
  p2.id as to_person_id, 
  'parent',
  now()
FROM people p1, people p2
WHERE p1.full_name = 'Robert Bird' 
AND p2.full_name IN ('John Bird', 'Sarah Bird Johnson', 'Simon Bird');

-- Mary Bird → parent → John Bird, Sarah Bird Johnson, Simon Bird  
INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_at)
SELECT 
  p1.family_id,
  p1.id as from_person_id,
  p2.id as to_person_id,
  'parent', 
  now()
FROM people p1, people p2
WHERE p1.full_name = 'Mary Bird'
AND p2.full_name IN ('John Bird', 'Sarah Bird Johnson', 'Simon Bird');

-- Simon Bird → parent → Emma Bird
INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_at)
SELECT 
  p1.family_id,
  p1.id as from_person_id,
  p2.id as to_person_id,
  'parent',
  now()
FROM people p1, people p2  
WHERE p1.full_name = 'Simon Bird'
AND p2.full_name = 'Emma Bird';

-- Zuzana Bird → parent → Emma Bird
INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_at)
SELECT 
  p1.family_id,
  p1.id as from_person_id,
  p2.id as to_person_id,
  'parent',
  now()
FROM people p1, people p2
WHERE p1.full_name = 'Zuzana Bird' 
AND p2.full_name = 'Emma Bird';

-- Sarah Bird Johnson → parent → James Johnson
INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_at)
SELECT 
  p1.family_id,
  p1.id as from_person_id,
  p2.id as to_person_id,
  'parent',
  now()
FROM people p1, people p2
WHERE p1.full_name = 'Sarah Bird Johnson'
AND p2.full_name = 'James Johnson';

-- Michael Johnson → parent → James Johnson  
INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_at)
SELECT 
  p1.family_id,
  p1.id as from_person_id,
  p2.id as to_person_id,
  'parent',
  now()
FROM people p1, people p2
WHERE p1.full_name = 'Michael Johnson'
AND p2.full_name = 'James Johnson';