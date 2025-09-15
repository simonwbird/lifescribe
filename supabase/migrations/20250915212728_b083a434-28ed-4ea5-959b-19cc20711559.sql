-- Add missing columns to people table if they don't exist
ALTER TABLE people 
ADD COLUMN IF NOT EXISTS alt_names text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS birth_date_precision text DEFAULT 'ymd' CHECK (birth_date_precision IN ('ymd', 'md', 'm', 'unknown')),
ADD COLUMN IF NOT EXISTS death_date_precision text DEFAULT 'ymd' CHECK (death_date_precision IN ('ymd', 'md', 'm', 'unknown'));

-- Create suggestions table for people data corrections
CREATE TABLE IF NOT EXISTS public.suggestions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL,
  person_id uuid REFERENCES public.people(id) ON DELETE CASCADE,
  suggested_by uuid NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'approved', 'rejected')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone
);

-- Enable RLS on suggestions
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- RLS policies for suggestions
CREATE POLICY "Family members can create suggestions"
ON public.suggestions
FOR INSERT
WITH CHECK ((family_id IN ( SELECT members.family_id
   FROM members
  WHERE (members.profile_id = auth.uid()))) AND (suggested_by = auth.uid()));

CREATE POLICY "Family members can view suggestions"
ON public.suggestions
FOR SELECT
USING (family_id IN ( SELECT members.family_id
   FROM members
  WHERE (members.profile_id = auth.uid())));

CREATE POLICY "Family admins can update suggestions"
ON public.suggestions
FOR UPDATE
USING (family_id IN ( SELECT members.family_id
   FROM members
  WHERE (members.profile_id = auth.uid()) AND (members.role = 'admin'::role_type)));

-- Add trigger for updated_at on suggestions
DROP TRIGGER IF EXISTS update_suggestions_updated_at ON public.suggestions;
CREATE TRIGGER update_suggestions_updated_at
  BEFORE UPDATE ON public.suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();