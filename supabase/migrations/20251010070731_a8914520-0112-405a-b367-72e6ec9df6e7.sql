-- Add status column to stories table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='stories' AND column_name='status') THEN
    ALTER TABLE stories ADD COLUMN status text DEFAULT 'published' 
      CHECK (status IN ('draft', 'published'));
  END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='stories' AND column_name='updated_at') THEN
    ALTER TABLE stories ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create or replace trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_stories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS stories_updated_at_trigger ON stories;
CREATE TRIGGER stories_updated_at_trigger
  BEFORE UPDATE ON stories
  FOR EACH ROW
  EXECUTE FUNCTION update_stories_updated_at();

-- Add index for faster draft queries
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_updated_at ON stories(updated_at DESC);