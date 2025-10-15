-- Create pet_milestones table for tracking custom and auto-generated milestones
CREATE TABLE IF NOT EXISTS public.pet_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  auto_generated BOOLEAN NOT NULL DEFAULT false,
  milestone_type TEXT, -- 'birthday', 'gotcha_anniversary', 'custom'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_pet_milestones_pet_id ON public.pet_milestones(pet_id);
CREATE INDEX idx_pet_milestones_family_id ON public.pet_milestones(family_id);
CREATE INDEX idx_pet_milestones_date ON public.pet_milestones(date);

-- Enable RLS
ALTER TABLE public.pet_milestones ENABLE ROW LEVEL SECURITY;

-- Family members can view milestones
CREATE POLICY "Family members can view milestones"
  ON public.pet_milestones
  FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    )
  );

-- Family members can create milestones
CREATE POLICY "Family members can create milestones"
  ON public.pet_milestones
  FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Milestone creators can update their milestones
CREATE POLICY "Milestone creators can update milestones"
  ON public.pet_milestones
  FOR UPDATE
  USING (created_by = auth.uid());

-- Milestone creators can delete their milestones
CREATE POLICY "Milestone creators can delete milestones"
  ON public.pet_milestones
  FOR DELETE
  USING (created_by = auth.uid());

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pet_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pet_milestones_updated_at_trigger
  BEFORE UPDATE ON public.pet_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_pet_milestones_updated_at();