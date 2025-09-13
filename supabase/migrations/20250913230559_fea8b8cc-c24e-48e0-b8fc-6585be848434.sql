-- Connect Bob Bird to Jamie William Bird as his child
INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
VALUES (
  'a235280e-6110-4a83-a69b-a5ba34f676ba',
  '44444444-4444-4444-4444-444444444444', -- Jamie William Bird (parent)
  '97d847e0-87b6-468c-881e-2dfc7b5503c0', -- Bob Bird (child)
  'parent',
  (SELECT auth.uid())
);

-- Clean up duplicate Bob records, keeping the one we just connected
DELETE FROM people 
WHERE given_name = 'Bob' 
AND surname = 'Bird' 
AND id != '97d847e0-87b6-468c-881e-2dfc7b5503c0'
AND family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba';