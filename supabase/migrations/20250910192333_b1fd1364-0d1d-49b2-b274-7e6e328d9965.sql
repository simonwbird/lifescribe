-- Fix family tree data integrity: establish correct relationships
-- Correct hierarchy: Robert & Mary have 3 children (John, Sarah, Simon)
--                   Sarah & Michael have 1 child (James)  
--                   Simon & Zuzana have 1 child (Emma)

-- Step 1: Clean up all existing spouse relationships for main family members
DELETE FROM relationships 
WHERE relationship_type = 'spouse'
AND (from_person_id IN (
    SELECT id FROM people WHERE full_name IN ('Robert Bird', 'Mary Bird', 'John Bird', 'Sarah Bird Johnson', 'Michael Johnson', 'Simon Bird', 'Zuzana Bird', 'James Johnson', 'Emma Bird')
  )
  OR to_person_id IN (
    SELECT id FROM people WHERE full_name IN ('Robert Bird', 'Mary Bird', 'John Bird', 'Sarah Bird Johnson', 'Michael Johnson', 'Simon Bird', 'Zuzana Bird', 'James Johnson', 'Emma Bird')
  ));

-- Step 2: Clean up all existing parent relationships for these family members  
DELETE FROM relationships
WHERE relationship_type = 'parent'
AND (from_person_id IN (
    SELECT id FROM people WHERE full_name IN ('Robert Bird', 'Mary Bird', 'John Bird', 'Sarah Bird Johnson', 'Michael Johnson', 'Simon Bird', 'Zuzana Bird', 'James Johnson', 'Emma Bird')
  )
  OR to_person_id IN (
    SELECT id FROM people WHERE full_name IN ('Robert Bird', 'Mary Bird', 'John Bird', 'Sarah Bird Johnson', 'Michael Johnson', 'Simon Bird', 'Zuzana Bird', 'James Johnson', 'Emma Bird')
  ));

-- Step 3: Insert correct spouse relationships
INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_at)
SELECT 
  p1.family_id,
  p1.id,
  p2.id,
  'spouse',
  now()
FROM people p1, people p2
WHERE (
  -- Robert ↔ Mary
  (p1.full_name = 'Robert Bird' AND p2.full_name = 'Mary Bird') OR
  -- Sarah ↔ Michael  
  (p1.full_name = 'Sarah Bird Johnson' AND p2.full_name = 'Michael Johnson') OR
  -- Simon ↔ Zuzana
  (p1.full_name = 'Simon Bird' AND p2.full_name = 'Zuzana Bird')
)
AND p1.family_id = p2.family_id;

-- Step 4: Insert correct parent relationships
INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_at)
SELECT 
  p_parent.family_id,
  p_parent.id,
  p_child.id,
  'parent',
  now()
FROM people p_parent, people p_child
WHERE p_parent.family_id = p_child.family_id
AND (
  -- Robert & Mary → John, Sarah, Simon
  (p_parent.full_name = 'Robert Bird' AND p_child.full_name IN ('John Bird', 'Sarah Bird Johnson', 'Simon Bird')) OR
  (p_parent.full_name = 'Mary Bird' AND p_child.full_name IN ('John Bird', 'Sarah Bird Johnson', 'Simon Bird')) OR
  -- Sarah & Michael → James
  (p_parent.full_name = 'Sarah Bird Johnson' AND p_child.full_name = 'James Johnson') OR
  (p_parent.full_name = 'Michael Johnson' AND p_child.full_name = 'James Johnson') OR
  -- Simon & Zuzana → Emma
  (p_parent.full_name = 'Simon Bird' AND p_child.full_name = 'Emma Bird') OR
  (p_parent.full_name = 'Zuzana Bird' AND p_child.full_name = 'Emma Bird')
);

-- Step 5: Add constraints to prevent future data integrity issues
-- Unique constraint for spouse pairs (canonicalized to prevent duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS ux_spouse_pair 
ON relationships (
  family_id,
  LEAST(from_person_id, to_person_id),
  GREATEST(from_person_id, to_person_id)
) 
WHERE relationship_type = 'spouse';

-- Unique constraint for parent relationships (prevent duplicate parent→child links)
CREATE UNIQUE INDEX IF NOT EXISTS ux_parent_relationship
ON relationships (family_id, relationship_type, from_person_id, to_person_id)
WHERE relationship_type = 'parent';