-- Connect Shirley to both Leon and Bertha as her biological parents
INSERT INTO relationships (type, parent_id, child_id, created_at)
SELECT 
    'parent',
    p1.id,
    p2.id,
    now()
FROM people p1, people p2
WHERE p1.given_name = 'Leon' 
    AND p2.given_name = 'Shirley' 
    AND p2.surname = 'Lenore'
    AND NOT EXISTS (
        SELECT 1 FROM relationships r 
        WHERE r.type = 'parent' 
            AND r.parent_id = p1.id 
            AND r.child_id = p2.id
    );

INSERT INTO relationships (type, parent_id, child_id, created_at)
SELECT 
    'parent',
    p1.id,
    p2.id,
    now()
FROM people p1, people p2
WHERE p1.given_name = 'Bertha' 
    AND p1.surname = 'Olive'
    AND p2.given_name = 'Shirley' 
    AND p2.surname = 'Lenore'
    AND NOT EXISTS (
        SELECT 1 FROM relationships r 
        WHERE r.type = 'parent' 
            AND r.parent_id = p1.id 
            AND r.child_id = p2.id
    );