-- Connect Shirley to both Leon and Bertha as her biological parents
INSERT INTO relationships (relationship_type, from_person_id, to_person_id, family_id, created_by, created_at)
SELECT 
    'parent'::relationship_type,
    p1.id,
    p2.id,
    p1.family_id,
    p1.created_by,
    now()
FROM people p1, people p2
WHERE p1.given_name = 'Leon' 
    AND p2.given_name = 'Shirley' 
    AND p2.surname = 'Lenore'
    AND p1.family_id = p2.family_id
    AND NOT EXISTS (
        SELECT 1 FROM relationships r 
        WHERE r.relationship_type = 'parent'::relationship_type
            AND r.from_person_id = p1.id 
            AND r.to_person_id = p2.id
    );

INSERT INTO relationships (relationship_type, from_person_id, to_person_id, family_id, created_by, created_at)
SELECT 
    'parent'::relationship_type,
    p1.id,
    p2.id,
    p1.family_id,
    p1.created_by,
    now()
FROM people p1, people p2
WHERE p1.given_name = 'Bertha' 
    AND p1.surname = 'Olive'
    AND p2.given_name = 'Shirley' 
    AND p2.surname = 'Lenore'
    AND p1.family_id = p2.family_id
    AND NOT EXISTS (
        SELECT 1 FROM relationships r 
        WHERE r.relationship_type = 'parent'::relationship_type
            AND r.from_person_id = p1.id 
            AND r.to_person_id = p2.id
    );