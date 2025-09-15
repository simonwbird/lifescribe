-- Create suggestions table for edit suggestions
CREATE TABLE public.suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL,
  person_id UUID NOT NULL,
  suggested_by UUID NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- RLS policies for suggestions
CREATE POLICY "Family members can create suggestions"
ON public.suggestions FOR INSERT
WITH CHECK (
  space_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()) 
  AND suggested_by = auth.uid()
);

CREATE POLICY "Family members can view suggestions"
ON public.suggestions FOR SELECT
USING (space_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()));

CREATE POLICY "Family admins can update suggestions"
ON public.suggestions FOR UPDATE
USING (space_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid() AND role = 'admin'));

-- Update people table to add email field if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'people' AND column_name = 'email') THEN
    ALTER TABLE public.people ADD COLUMN email TEXT;
  END IF;
END $$;

-- Create updated_at trigger for suggestions
CREATE TRIGGER update_suggestions_updated_at
  BEFORE UPDATE ON public.suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_suggestions_space_id ON public.suggestions(space_id);
CREATE INDEX idx_suggestions_person_id ON public.suggestions(person_id);
CREATE INDEX idx_suggestions_status ON public.suggestions(status);