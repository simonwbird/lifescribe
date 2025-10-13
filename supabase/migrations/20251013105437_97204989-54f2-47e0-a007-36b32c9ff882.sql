-- Create photo_regions table for region tagging on photos
CREATE TABLE public.photo_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.story_assets(id) ON DELETE CASCADE,
  x FLOAT NOT NULL CHECK (x >= 0 AND x <= 1),
  y FLOAT NOT NULL CHECK (y >= 0 AND y <= 1),
  width FLOAT NOT NULL CHECK (width >= 0 AND width <= 1),
  height FLOAT NOT NULL CHECK (height >= 0 AND height <= 1),
  person_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'appears' CHECK (role IN ('subject', 'appears', 'mentioned', 'photographer')),
  label TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create photo_comments table for per-photo comments
CREATE TABLE public.photo_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.story_assets(id) ON DELETE CASCADE,
  region_id UUID REFERENCES public.photo_regions(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  mentions JSONB DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_photo_regions_asset_id ON public.photo_regions(asset_id);
CREATE INDEX idx_photo_regions_person_id ON public.photo_regions(person_id);
CREATE INDEX idx_photo_comments_asset_id ON public.photo_comments(asset_id);
CREATE INDEX idx_photo_comments_region_id ON public.photo_comments(region_id);

-- Create updated_at trigger for photo_regions
CREATE TRIGGER update_photo_regions_updated_at
  BEFORE UPDATE ON public.photo_regions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_memories_updated_at();

-- Enable RLS
ALTER TABLE public.photo_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for photo_regions
CREATE POLICY "Family members can view photo regions"
  ON public.photo_regions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.story_assets sa
      JOIN public.stories s ON s.id = sa.story_id
      JOIN public.members m ON m.family_id = s.family_id
      WHERE sa.id = photo_regions.asset_id
      AND m.profile_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create photo regions"
  ON public.photo_regions FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.story_assets sa
      JOIN public.stories s ON s.id = sa.story_id
      JOIN public.members m ON m.family_id = s.family_id
      WHERE sa.id = photo_regions.asset_id
      AND m.profile_id = auth.uid()
    )
  );

CREATE POLICY "Region creators can update their regions"
  ON public.photo_regions FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Region creators can delete their regions"
  ON public.photo_regions FOR DELETE
  USING (created_by = auth.uid());

-- RLS Policies for photo_comments
CREATE POLICY "Family members can view photo comments"
  ON public.photo_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.story_assets sa
      JOIN public.stories s ON s.id = sa.story_id
      JOIN public.members m ON m.family_id = s.family_id
      WHERE sa.id = photo_comments.asset_id
      AND m.profile_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create photo comments"
  ON public.photo_comments FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.story_assets sa
      JOIN public.stories s ON s.id = sa.story_id
      JOIN public.members m ON m.family_id = s.family_id
      WHERE sa.id = photo_comments.asset_id
      AND m.profile_id = auth.uid()
    )
  );

CREATE POLICY "Comment authors can update their comments"
  ON public.photo_comments FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Comment authors can delete their comments"
  ON public.photo_comments FOR DELETE
  USING (created_by = auth.uid());