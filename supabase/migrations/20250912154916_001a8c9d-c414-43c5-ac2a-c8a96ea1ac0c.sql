-- Update media target check constraint to allow all content types

-- Drop the existing constraint
ALTER TABLE media DROP CONSTRAINT IF EXISTS media_target_check;

-- Add a new comprehensive constraint that allows exactly one target type
ALTER TABLE media ADD CONSTRAINT media_target_check 
CHECK (
  -- Exactly one of the target fields must be non-null
  (
    (story_id IS NOT NULL)::int + 
    (recipe_id IS NOT NULL)::int + 
    (thing_id IS NOT NULL)::int + 
    (property_id IS NOT NULL)::int + 
    (answer_id IS NOT NULL)::int
  ) = 1
);