-- Create favorites table with unique constraints
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL,
  family_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('place', 'song', 'food', 'hobby', 'memory', 'other')),
  value TEXT NOT NULL,
  value_hash TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (person_id, type, value_hash)
);

-- Add dynamic_key column to prompt_instances
ALTER TABLE public.prompt_instances 
ADD COLUMN IF NOT EXISTS dynamic_key TEXT UNIQUE;

-- Enable RLS on favorites table
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for favorites
CREATE POLICY "Family members can view favorites"
  ON public.favorites
  FOR SELECT
  USING (family_id IN (
    SELECT family_id FROM public.members WHERE profile_id = auth.uid()
  ));

CREATE POLICY "Family members can insert favorites"
  ON public.favorites
  FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Creators can update their favorites"
  ON public.favorites
  FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Creators can delete their favorites"
  ON public.favorites
  FOR DELETE
  USING (created_by = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_favorites_person_id ON public.favorites(person_id);
CREATE INDEX idx_favorites_family_id ON public.favorites(family_id);
CREATE INDEX idx_favorites_type ON public.favorites(type);
CREATE INDEX idx_favorites_value_hash ON public.favorites(value_hash);
CREATE INDEX idx_prompt_instances_dynamic_key ON public.prompt_instances(dynamic_key);
CREATE INDEX idx_prompt_instances_due_at ON public.prompt_instances(due_at);
CREATE INDEX idx_prompt_instances_expires_at ON public.prompt_instances(expires_at);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_favorites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for updated_at
CREATE TRIGGER update_favorites_updated_at
  BEFORE UPDATE ON public.favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_favorites_updated_at();

-- Create function to compute value hash
CREATE OR REPLACE FUNCTION public.compute_value_hash(input_value TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(lower(trim(input_value)), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public;