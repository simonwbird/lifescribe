-- Create content_type enum for stories
CREATE TYPE content_type AS ENUM ('text', 'photo', 'voice', 'video', 'mixed');

-- Add content_type column to stories table
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS content_type content_type DEFAULT 'text'::content_type;

-- Create story_assets table for media attachments
CREATE TABLE IF NOT EXISTS public.story_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'audio', 'video', 'doc')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on story_assets
ALTER TABLE public.story_assets ENABLE ROW LEVEL SECURITY;

-- RLS policies for story_assets
CREATE POLICY "Family members can view story assets"
  ON public.story_assets FOR SELECT
  USING (
    story_id IN (
      SELECT id FROM public.stories 
      WHERE family_id IN (
        SELECT family_id FROM public.members WHERE profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "Story creators can insert assets"
  ON public.story_assets FOR INSERT
  WITH CHECK (
    story_id IN (
      SELECT id FROM public.stories WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Story creators can update their assets"
  ON public.story_assets FOR UPDATE
  USING (
    story_id IN (
      SELECT id FROM public.stories WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Story creators can delete their assets"
  ON public.story_assets FOR DELETE
  USING (
    story_id IN (
      SELECT id FROM public.stories WHERE profile_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_prompt_id ON public.stories(prompt_id);
CREATE INDEX IF NOT EXISTS idx_stories_content_type ON public.stories(content_type);
CREATE INDEX IF NOT EXISTS idx_story_assets_story_id ON public.story_assets(story_id);
CREATE INDEX IF NOT EXISTS idx_story_assets_type ON public.story_assets(type);
CREATE INDEX IF NOT EXISTS idx_person_story_links_story_id ON public.person_story_links(story_id);
CREATE INDEX IF NOT EXISTS idx_person_story_links_person_id ON public.person_story_links(person_id);

-- Add trigger for story_assets updated_at
CREATE OR REPLACE FUNCTION update_story_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_story_assets_updated_at
  BEFORE UPDATE ON public.story_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_story_assets_updated_at();