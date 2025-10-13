-- Add privacy and place fields to stories table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'story_privacy') THEN
    CREATE TYPE story_privacy AS ENUM (
      'private',
      'link_only',
      'public'
    );
  END IF;
END $$;

-- Add columns to stories table
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS privacy story_privacy DEFAULT 'private',
ADD COLUMN IF NOT EXISTS place_text TEXT;

-- Create index for privacy queries
CREATE INDEX IF NOT EXISTS idx_stories_privacy 
ON public.stories(privacy);

-- Add columns to families table for default privacy
ALTER TABLE public.families
ADD COLUMN IF NOT EXISTS default_privacy story_privacy DEFAULT 'private';