-- Add QA seed tracking columns to tables that exist
ALTER TABLE people ADD COLUMN IF NOT EXISTS qa_seed BOOLEAN DEFAULT FALSE;
ALTER TABLE people ADD COLUMN IF NOT EXISTS qa_seed_version TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS slug TEXT;

ALTER TABLE stories ADD COLUMN IF NOT EXISTS qa_seed BOOLEAN DEFAULT FALSE;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS qa_seed_version TEXT;

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS qa_seed BOOLEAN DEFAULT FALSE;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS qa_seed_version TEXT;

ALTER TABLE things ADD COLUMN IF NOT EXISTS qa_seed BOOLEAN DEFAULT FALSE;
ALTER TABLE things ADD COLUMN IF NOT EXISTS qa_seed_version TEXT;

ALTER TABLE properties ADD COLUMN IF NOT EXISTS qa_seed BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS qa_seed_version TEXT;

ALTER TABLE tributes ADD COLUMN IF NOT EXISTS qa_seed BOOLEAN DEFAULT FALSE;
ALTER TABLE tributes ADD COLUMN IF NOT EXISTS qa_seed_version TEXT;

ALTER TABLE weekly_digest_settings ADD COLUMN IF NOT EXISTS qa_seed BOOLEAN DEFAULT FALSE;
ALTER TABLE weekly_digest_settings ADD COLUMN IF NOT EXISTS qa_seed_version TEXT;

ALTER TABLE digest_follow_preferences ADD COLUMN IF NOT EXISTS qa_seed BOOLEAN DEFAULT FALSE;
ALTER TABLE digest_follow_preferences ADD COLUMN IF NOT EXISTS qa_seed_version TEXT;

-- Create unique index on people slug for upsert operations
CREATE UNIQUE INDEX IF NOT EXISTS people_family_slug_idx ON people(family_id, slug) WHERE slug IS NOT NULL;

-- Create QA seed log table
CREATE TABLE IF NOT EXISTS qa_seed_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_by UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('seed', 'purge')),
  seed_version TEXT DEFAULT 'v1',
  counts JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT
);

-- Enable RLS on qa_seed_log
ALTER TABLE qa_seed_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view logs
CREATE POLICY "Users can view qa seed logs"
  ON qa_seed_log FOR SELECT
  TO authenticated
  USING (true);

-- Allow system to insert logs
CREATE POLICY "System can insert qa seed logs"
  ON qa_seed_log FOR INSERT
  TO authenticated
  WITH CHECK (ran_by = auth.uid());