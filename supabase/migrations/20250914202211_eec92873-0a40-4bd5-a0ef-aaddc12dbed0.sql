-- Ensure an explicit unmarried partnership between Leon and Bertha (same family)
INSERT INTO relationships (relationship_type, from_person_id, to_person_id, family_id, created_by, created_at)
SELECT 
  'unmarried'::relationship_type,
  LEAST(p1.id, p2.id),
  GREATEST(p1.id, p2.id),
  p1.family_id,
  COALESCE(p1.created_by, p2.created_by),
  now()
FROM people p1
JOIN people p2 ON p1.family_id = p2.family_id
WHERE p1.given_name = 'Bertha' AND p1.surname = 'Olive'
  AND p2.given_name = 'Leon'
  AND NOT EXISTS (
    SELECT 1 FROM relationships r
    WHERE r.family_id = p1.family_id
      AND r.relationship_type = 'unmarried'::relationship_type
      AND ((r.from_person_id = p1.id AND r.to_person_id = p2.id)
        OR (r.from_person_id = p2.id AND r.to_person_id = p1.id))
  );