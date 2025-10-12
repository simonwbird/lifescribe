-- Create table for storing custom page layouts per person
CREATE TABLE IF NOT EXISTS public.person_page_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  layout_map JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(person_id)
);

-- Enable RLS
ALTER TABLE public.person_page_layouts ENABLE ROW LEVEL SECURITY;

-- Policy: Family members can view layouts
CREATE POLICY "Family members can view page layouts"
  ON public.person_page_layouts
  FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    )
  );

-- Policy: Stewards can create/update layouts
CREATE POLICY "Stewards can manage page layouts"
  ON public.person_page_layouts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.person_roles pr
      WHERE pr.person_id = person_page_layouts.person_id
        AND pr.profile_id = auth.uid()
        AND pr.role IN ('owner', 'steward', 'co_curator')
        AND pr.revoked_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.person_roles pr
      WHERE pr.person_id = person_page_layouts.person_id
        AND pr.profile_id = auth.uid()
        AND pr.role IN ('owner', 'steward', 'co_curator')
        AND pr.revoked_at IS NULL
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_person_page_layouts_person_id ON public.person_page_layouts(person_id);
CREATE INDEX idx_person_page_layouts_family_id ON public.person_page_layouts(family_id);

-- Add updated_at trigger
CREATE TRIGGER update_person_page_layouts_updated_at
  BEFORE UPDATE ON public.person_page_layouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tree_updated_at_column();