-- Add biological parent designation to relationships table
ALTER TABLE relationships 
ADD COLUMN is_biological boolean DEFAULT true;

-- Create index for biological parent queries
CREATE INDEX idx_relationships_biological 
ON relationships (to_person_id, relationship_type, is_biological) 
WHERE relationship_type = 'parent' AND is_biological = true;

-- Add comment explaining the new column
COMMENT ON COLUMN relationships.is_biological IS 'Designates whether a parent relationship is biological (true) or step/adoptive (false). Used for family tree connections.';