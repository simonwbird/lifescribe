-- Create story_pet_links table for tagging pets in stories
CREATE TABLE IF NOT EXISTS public.story_pet_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure unique pet-story pairs
  UNIQUE(story_id, pet_id)
);

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_story_pet_links_story ON public.story_pet_links(story_id);
CREATE INDEX IF NOT EXISTS idx_story_pet_links_pet ON public.story_pet_links(pet_id);
CREATE INDEX IF NOT EXISTS idx_story_pet_links_family ON public.story_pet_links(family_id);

-- Enable RLS
ALTER TABLE public.story_pet_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Family members can manage links in their family
CREATE POLICY "Family members can view pet links"
  ON public.story_pet_links
  FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create pet links"
  ON public.story_pet_links
  FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Link creators can delete their links"
  ON public.story_pet_links
  FOR DELETE
  USING (created_by = auth.uid());

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_pet_links;