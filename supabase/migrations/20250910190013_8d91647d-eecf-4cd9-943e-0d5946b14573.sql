-- Ensure Simon Bird ↔ Zuzana Bird spouse link exists and clean up incorrect ones

-- First, remove any wrong spouse links for Simon or Zuzana (except with each other)
DELETE FROM relationships 
WHERE relationship_type = 'spouse'
AND (
  -- Simon linked to someone other than Zuzana
  (from_person_id IN (SELECT id FROM people WHERE full_name = 'Simon Bird') 
   AND to_person_id NOT IN (SELECT id FROM people WHERE full_name = 'Zuzana Bird'))
  OR
  (to_person_id IN (SELECT id FROM people WHERE full_name = 'Simon Bird')
   AND from_person_id NOT IN (SELECT id FROM people WHERE full_name = 'Zuzana Bird'))
  OR
  -- Zuzana linked to someone other than Simon  
  (from_person_id IN (SELECT id FROM people WHERE full_name = 'Zuzana Bird')
   AND to_person_id NOT IN (SELECT id FROM people WHERE full_name = 'Simon Bird'))
  OR
  (to_person_id IN (SELECT id FROM people WHERE full_name = 'Zuzana Bird')
   AND from_person_id NOT IN (SELECT id FROM people WHERE full_name = 'Simon Bird'))
);

-- Ensure Simon ↔ Zuzana spouse record exists (if not already present)
INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_at)
SELECT 
  p1.family_id,
  p1.id as from_person_id,
  p2.id as to_person_id,
  'spouse',
  now()
FROM people p1, people p2
WHERE p1.full_name = 'Simon Bird' 
AND p2.full_name = 'Zuzana Bird'
AND NOT EXISTS (
  SELECT 1 FROM relationships r
  WHERE r.family_id = p1.family_id
  AND r.relationship_type = 'spouse'
  AND ((r.from_person_id = p1.id AND r.to_person_id = p2.id)
    OR (r.from_person_id = p2.id AND r.to_person_id = p1.id))
);