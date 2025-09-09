-- Add some test people and relationships to the Bird Family for demonstration

-- Add some family members to demonstrate the tree
INSERT INTO people (family_id, full_name, given_name, surname, birth_year, death_year, gender, notes, created_by) VALUES
  ('a235280e-6110-4a83-a69b-a5ba34f676ba', 'Robert Bird', 'Robert', 'Bird', 1940, 2010, 'male', 'Patriarch of the family, loved woodworking', '1d3a4094-955f-487e-bfee-5534e609b724'),
  ('a235280e-6110-4a83-a69b-a5ba34f676ba', 'Mary Bird', 'Mary', 'Bird', 1945, NULL, 'female', 'Family matriarch, excellent baker', '1d3a4094-955f-487e-bfee-5534e609b724'),
  ('a235280e-6110-4a83-a69b-a5ba34f676ba', 'John Bird', 'John', 'Bird', 1970, NULL, 'male', 'Eldest son, works in technology', '1d3a4094-955f-487e-bfee-5534e609b724'),
  ('a235280e-6110-4a83-a69b-a5ba34f676ba', 'Sarah Bird Johnson', 'Sarah', 'Johnson', 1975, NULL, 'female', 'Daughter, married name Johnson', '1d3a4094-955f-487e-bfee-5534e609b724'),
  ('a235280e-6110-4a83-a69b-a5ba34f676ba', 'Michael Johnson', 'Michael', 'Johnson', 1972, NULL, 'male', 'Sarah''s husband', '1d3a4094-955f-487e-bfee-5534e609b724'),
  ('a235280e-6110-4a83-a69b-a5ba34f676ba', 'Emma Bird', 'Emma', 'Bird', 2000, NULL, 'female', 'John''s daughter, college student', '1d3a4094-955f-487e-bfee-5534e609b724'),
  ('a235280e-6110-4a83-a69b-a5ba34f676ba', 'James Johnson', 'James', 'Johnson', 2005, NULL, 'male', 'Sarah and Michael''s son', '1d3a4094-955f-487e-bfee-5534e609b724');

-- Add relationships to create a proper family tree
-- Robert and Mary are spouses
INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
SELECT 
  'a235280e-6110-4a83-a69b-a5ba34f676ba',
  p1.id,
  p2.id,
  'spouse',
  '1d3a4094-955f-487e-bfee-5534e609b724'
FROM people p1, people p2
WHERE p1.full_name = 'Robert Bird' 
  AND p2.full_name = 'Mary Bird'
  AND p1.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba'
  AND p2.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba';

-- John is child of Robert and Mary
INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
SELECT 
  'a235280e-6110-4a83-a69b-a5ba34f676ba',
  p1.id,
  p2.id,
  'parent',
  '1d3a4094-955f-487e-bfee-5534e609b724'
FROM people p1, people p2
WHERE p1.full_name = 'John Bird' 
  AND p2.full_name = 'Robert Bird'
  AND p1.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba'
  AND p2.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba';

INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
SELECT 
  'a235280e-6110-4a83-a69b-a5ba34f676ba',
  p1.id,
  p2.id,
  'parent',
  '1d3a4094-955f-487e-bfee-5534e609b724'
FROM people p1, people p2
WHERE p1.full_name = 'John Bird' 
  AND p2.full_name = 'Mary Bird'
  AND p1.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba'
  AND p2.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba';

-- Sarah is child of Robert and Mary
INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
SELECT 
  'a235280e-6110-4a83-a69b-a5ba34f676ba',
  p1.id,
  p2.id,
  'parent',
  '1d3a4094-955f-487e-bfee-5534e609b724'
FROM people p1, people p2
WHERE p1.full_name = 'Sarah Bird Johnson' 
  AND p2.full_name = 'Robert Bird'
  AND p1.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba'
  AND p2.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba';

INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
SELECT 
  'a235280e-6110-4a83-a69b-a5ba34f676ba',
  p1.id,
  p2.id,
  'parent',
  '1d3a4094-955f-487e-bfee-5534e609b724'
FROM people p1, people p2
WHERE p1.full_name = 'Sarah Bird Johnson' 
  AND p2.full_name = 'Mary Bird'
  AND p1.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba'
  AND p2.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba';

-- Sarah and Michael are spouses
INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
SELECT 
  'a235280e-6110-4a83-a69b-a5ba34f676ba',
  p1.id,
  p2.id,
  'spouse',
  '1d3a4094-955f-487e-bfee-5534e609b724'
FROM people p1, people p2
WHERE p1.full_name = 'Sarah Bird Johnson' 
  AND p2.full_name = 'Michael Johnson'
  AND p1.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba'
  AND p2.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba';

-- Emma is child of John
INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
SELECT 
  'a235280e-6110-4a83-a69b-a5ba34f676ba',
  p1.id,
  p2.id,
  'parent',
  '1d3a4094-955f-487e-bfee-5534e609b724'
FROM people p1, people p2
WHERE p1.full_name = 'Emma Bird' 
  AND p2.full_name = 'John Bird'
  AND p1.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba'
  AND p2.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba';

-- James is child of Sarah and Michael
INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
SELECT 
  'a235280e-6110-4a83-a69b-a5ba34f676ba',
  p1.id,
  p2.id,
  'parent',
  '1d3a4094-955f-487e-bfee-5534e609b724'
FROM people p1, people p2
WHERE p1.full_name = 'James Johnson' 
  AND p2.full_name = 'Sarah Bird Johnson'
  AND p1.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba'
  AND p2.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba';

INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
SELECT 
  'a235280e-6110-4a83-a69b-a5ba34f676ba',
  p1.id,
  p2.id,
  'parent',
  '1d3a4094-955f-487e-bfee-5534e609b724'
FROM people p1, people p2
WHERE p1.full_name = 'James Johnson' 
  AND p2.full_name = 'Michael Johnson'
  AND p1.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba'
  AND p2.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba';