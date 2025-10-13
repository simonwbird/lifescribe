-- Add role column to person_story_links table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'story_person_role') THEN
    CREATE TYPE story_person_role AS ENUM (
      'subject',
      'appears',
      'mentioned',
      'author',
      'photographer',
      'videographer'
    );
  END IF;
END $$;

-- Add role column to person_story_links
ALTER TABLE public.person_story_links 
ADD COLUMN IF NOT EXISTS role story_person_role DEFAULT 'subject';

-- Create index for faster role queries
CREATE INDEX IF NOT EXISTS idx_person_story_links_role 
ON public.person_story_links(role);

-- Update RLS policies to remain the same
-- (existing policies already allow family members to manage links)