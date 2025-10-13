-- Create story_sources table for citation management
CREATE TABLE public.story_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('file', 'link', 'note')),
  source_content TEXT NOT NULL,
  paragraph_index INTEGER,
  display_text TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.story_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Family members can view story sources"
  ON public.story_sources
  FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create story sources"
  ON public.story_sources
  FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Source creators can update their sources"
  ON public.story_sources
  FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Source creators can delete their sources"
  ON public.story_sources
  FOR DELETE
  USING (created_by = auth.uid());

-- Indexes for performance
CREATE INDEX idx_story_sources_story_id ON public.story_sources(story_id);
CREATE INDEX idx_story_sources_family_id ON public.story_sources(family_id);

-- Function to check if story is cited
CREATE OR REPLACE FUNCTION public.is_story_cited(p_story_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.story_sources
    WHERE story_id = p_story_id
  );
$$;

-- Add updated_at trigger
CREATE TRIGGER update_story_sources_updated_at
  BEFORE UPDATE ON public.story_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_memories_updated_at();