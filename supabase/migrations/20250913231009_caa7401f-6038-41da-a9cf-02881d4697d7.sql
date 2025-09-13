-- Add Mary as Bob's second parent so the connection comes from the union (between Jamie and Mary)
INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
VALUES (
  'a235280e-6110-4a83-a69b-a5ba34f676ba',
  '32d2dfb2-40f7-471b-9ea1-cc4a31cca05a', -- Mary (parent)
  '97d847e0-87b6-468c-881e-2dfc7b5503c0', -- Bob Bird (child)
  'parent',
  (SELECT auth.uid())
);