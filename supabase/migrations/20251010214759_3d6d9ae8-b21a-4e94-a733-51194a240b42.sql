-- Create person page themes table
CREATE TABLE IF NOT EXISTS public.person_page_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  palette JSONB NOT NULL DEFAULT '{}', -- {primary, secondary, accent, background}
  font_scale NUMERIC DEFAULT 1.0,
  shape TEXT DEFAULT 'rounded', -- rounded, sharp, soft
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create person page permissions table
CREATE TABLE IF NOT EXISTS public.person_page_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'co_curator', 'steward', 'contributor', 'viewer')),
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(person_id, user_id)
);

-- Create person page blocks table
CREATE TABLE IF NOT EXISTS public.person_page_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- bio, timeline, photos, stories, favorites, relationships, achievements
  content_json JSONB NOT NULL DEFAULT '{}',
  block_order INTEGER NOT NULL DEFAULT 0,
  visibility TEXT NOT NULL DEFAULT 'family' CHECK (visibility IN ('only_me', 'inner_circle', 'family', 'public')),
  is_enabled BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add theme_id to people table if not exists
DO $$ BEGIN
  ALTER TABLE public.people ADD COLUMN IF NOT EXISTS theme_id UUID REFERENCES public.person_page_themes(id);
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_person_page_blocks_person_id ON public.person_page_blocks(person_id);
CREATE INDEX IF NOT EXISTS idx_person_page_blocks_order ON public.person_page_blocks(person_id, block_order);
CREATE INDEX IF NOT EXISTS idx_person_page_permissions_person_id ON public.person_page_permissions(person_id);
CREATE INDEX IF NOT EXISTS idx_person_page_permissions_user_id ON public.person_page_permissions(user_id);

-- Enable RLS
ALTER TABLE public.person_page_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_page_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_page_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for themes (public read, system manage)
CREATE POLICY "Anyone can view themes" ON public.person_page_themes
  FOR SELECT USING (true);

CREATE POLICY "System can manage themes" ON public.person_page_themes
  FOR ALL USING (true);

-- RLS Policies for permissions
CREATE POLICY "Users can view permissions for their family members" ON public.person_page_permissions
  FOR SELECT USING (
    person_id IN (
      SELECT p.id FROM public.people p
      JOIN public.members m ON m.family_id = p.family_id
      WHERE m.profile_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can manage permissions" ON public.person_page_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.person_page_permissions ppp
      WHERE ppp.person_id = person_page_permissions.person_id
      AND ppp.user_id = auth.uid()
      AND ppp.role IN ('owner', 'co_curator')
    )
    OR EXISTS (
      SELECT 1 FROM public.people p
      JOIN public.members m ON m.family_id = p.family_id
      WHERE p.id = person_page_permissions.person_id
      AND m.profile_id = auth.uid()
      AND m.role = 'admin'
    )
  );

-- RLS Policies for blocks
CREATE POLICY "Users can view blocks based on visibility" ON public.person_page_blocks
  FOR SELECT USING (
    is_enabled = true AND (
      -- Public blocks
      visibility = 'public'
      -- Family blocks
      OR (visibility = 'family' AND person_id IN (
        SELECT p.id FROM public.people p
        JOIN public.members m ON m.family_id = p.family_id
        WHERE m.profile_id = auth.uid()
      ))
      -- Inner circle blocks
      OR (visibility = 'inner_circle' AND EXISTS (
        SELECT 1 FROM public.person_page_permissions ppp
        WHERE ppp.person_id = person_page_blocks.person_id
        AND ppp.user_id = auth.uid()
        AND ppp.role IN ('owner', 'co_curator', 'steward', 'contributor')
      ))
      -- Only me blocks
      OR (visibility = 'only_me' AND EXISTS (
        SELECT 1 FROM public.person_page_permissions ppp
        WHERE ppp.person_id = person_page_blocks.person_id
        AND ppp.user_id = auth.uid()
        AND ppp.role = 'owner'
      ))
    )
  );

CREATE POLICY "Authorized users can manage blocks" ON public.person_page_blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.person_page_permissions ppp
      WHERE ppp.person_id = person_page_blocks.person_id
      AND ppp.user_id = auth.uid()
      AND ppp.role IN ('owner', 'co_curator', 'steward')
    )
    OR EXISTS (
      SELECT 1 FROM public.people p
      JOIN public.members m ON m.family_id = p.family_id
      WHERE p.id = person_page_blocks.person_id
      AND m.profile_id = auth.uid()
      AND m.role = 'admin'
    )
  );

-- Insert default theme
INSERT INTO public.person_page_themes (name, palette, font_scale, shape) VALUES
  ('Classic', '{"primary": "#2563eb", "secondary": "#64748b", "accent": "#f59e0b", "background": "#ffffff"}', 1.0, 'rounded')
ON CONFLICT DO NOTHING;