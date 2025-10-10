-- Create table for tracking person merges
CREATE TABLE IF NOT EXISTS public.person_merges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  source_person_id UUID NOT NULL,
  target_person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  merged_by UUID NOT NULL,
  merged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  merge_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence_score NUMERIC(3,2),
  merge_reasons TEXT[],
  can_undo BOOLEAN NOT NULL DEFAULT true,
  undo_expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  undone_at TIMESTAMP WITH TIME ZONE,
  undone_by UUID
);

CREATE INDEX idx_person_merges_source ON public.person_merges(source_person_id);
CREATE INDEX idx_person_merges_target ON public.person_merges(target_person_id);
CREATE INDEX idx_person_merges_family ON public.person_merges(family_id);
CREATE INDEX idx_person_merges_undo ON public.person_merges(can_undo, undo_expires_at) WHERE can_undo = true;

-- Create table for person redirects/aliases
CREATE TABLE IF NOT EXISTS public.person_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_person_id UUID NOT NULL,
  new_person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  merge_id UUID REFERENCES public.person_merges(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(old_person_id, family_id)
);

CREATE INDEX idx_person_redirects_old ON public.person_redirects(old_person_id);
CREATE INDEX idx_person_redirects_new ON public.person_redirects(new_person_id);

-- Create table for duplicate candidates
CREATE TABLE IF NOT EXISTS public.duplicate_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  person_a_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  person_b_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  confidence_score NUMERIC(3,2) NOT NULL,
  match_reasons TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  heuristic_details JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'merged', 'dismissed', 'reviewed')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(family_id, person_a_id, person_b_id)
);

CREATE INDEX idx_duplicate_candidates_family ON public.duplicate_candidates(family_id);
CREATE INDEX idx_duplicate_candidates_status ON public.duplicate_candidates(status);
CREATE INDEX idx_duplicate_candidates_score ON public.duplicate_candidates(confidence_score DESC);

-- Enable RLS
ALTER TABLE public.person_merges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duplicate_candidates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for person_merges
CREATE POLICY "Family admins can view merge history"
ON public.person_merges
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.members 
    WHERE profile_id = auth.uid() 
    AND family_id = person_merges.family_id 
    AND role = 'admin'
  )
);

CREATE POLICY "Family admins can create merges"
ON public.person_merges
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.members 
    WHERE profile_id = auth.uid() 
    AND family_id = person_merges.family_id 
    AND role = 'admin'
  ) AND merged_by = auth.uid()
);

CREATE POLICY "Family admins can update merges"
ON public.person_merges
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.members 
    WHERE profile_id = auth.uid() 
    AND family_id = person_merges.family_id 
    AND role = 'admin'
  )
);

-- RLS Policies for person_redirects
CREATE POLICY "Family members can view redirects"
ON public.person_redirects
FOR SELECT
TO authenticated
USING (
  family_id IN (
    SELECT family_id FROM public.members WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Family admins can manage redirects"
ON public.person_redirects
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.members 
    WHERE profile_id = auth.uid() 
    AND family_id = person_redirects.family_id 
    AND role = 'admin'
  )
);

-- RLS Policies for duplicate_candidates
CREATE POLICY "Family admins can view duplicates"
ON public.duplicate_candidates
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.members 
    WHERE profile_id = auth.uid() 
    AND family_id = duplicate_candidates.family_id 
    AND role = 'admin'
  )
);

CREATE POLICY "Family admins can manage duplicates"
ON public.duplicate_candidates
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.members 
    WHERE profile_id = auth.uid() 
    AND family_id = duplicate_candidates.family_id 
    AND role = 'admin'
  )
);

-- Function to calculate duplicate score
CREATE OR REPLACE FUNCTION calculate_duplicate_score(
  p_person_a_id UUID,
  p_person_b_id UUID
)
RETURNS TABLE(score NUMERIC, reasons TEXT[], details JSONB) AS $$
DECLARE
  person_a RECORD;
  person_b RECORD;
  calculated_score NUMERIC := 0;
  match_reasons TEXT[] := ARRAY[]::TEXT[];
  match_details JSONB := '{}'::jsonb;
  name_similarity NUMERIC;
  yob_diff INTEGER;
BEGIN
  -- Get person data
  SELECT * INTO person_a FROM public.people WHERE id = p_person_a_id;
  SELECT * INTO person_b FROM public.people WHERE id = p_person_b_id;
  
  IF person_a IS NULL OR person_b IS NULL THEN
    RETURN QUERY SELECT 0::NUMERIC, ARRAY[]::TEXT[], '{}'::jsonb;
    RETURN;
  END IF;
  
  -- Name similarity (50 points max)
  IF person_a.given_name IS NOT NULL AND person_b.given_name IS NOT NULL THEN
    name_similarity := similarity(
      lower(person_a.given_name || ' ' || COALESCE(person_a.surname, '')),
      lower(person_b.given_name || ' ' || COALESCE(person_b.surname, ''))
    );
    
    IF name_similarity > 0.8 THEN
      calculated_score := calculated_score + 50;
      match_reasons := array_append(match_reasons, 'Exact name match');
      match_details := jsonb_set(match_details, '{name_similarity}', to_jsonb(name_similarity));
    ELSIF name_similarity > 0.6 THEN
      calculated_score := calculated_score + 30;
      match_reasons := array_append(match_reasons, 'Similar name');
      match_details := jsonb_set(match_details, '{name_similarity}', to_jsonb(name_similarity));
    END IF;
  END IF;
  
  -- Birth year proximity (25 points max)
  IF person_a.birth_date IS NOT NULL AND person_b.birth_date IS NOT NULL THEN
    yob_diff := ABS(EXTRACT(YEAR FROM person_a.birth_date) - EXTRACT(YEAR FROM person_b.birth_date));
    
    IF yob_diff = 0 THEN
      calculated_score := calculated_score + 25;
      match_reasons := array_append(match_reasons, 'Same birth year');
      match_details := jsonb_set(match_details, '{birth_year_diff}', to_jsonb(yob_diff));
    ELSIF yob_diff = 1 THEN
      calculated_score := calculated_score + 20;
      match_reasons := array_append(match_reasons, 'Birth year ±1');
      match_details := jsonb_set(match_details, '{birth_year_diff}', to_jsonb(yob_diff));
    ELSIF yob_diff <= 3 THEN
      calculated_score := calculated_score + 10;
      match_reasons := array_append(match_reasons, 'Birth year ±3');
      match_details := jsonb_set(match_details, '{birth_year_diff}', to_jsonb(yob_diff));
    END IF;
  END IF;
  
  -- Same birth place (15 points)
  IF person_a.birth_place IS NOT NULL AND person_b.birth_place IS NOT NULL 
     AND lower(person_a.birth_place) = lower(person_b.birth_place) THEN
    calculated_score := calculated_score + 15;
    match_reasons := array_append(match_reasons, 'Same birth place');
  END IF;
  
  -- Shared parent relationships (10 points)
  IF EXISTS (
    SELECT 1 FROM public.relationships r1
    JOIN public.relationships r2 ON r1.from_person_id = r2.from_person_id
    WHERE r1.to_person_id = p_person_a_id 
    AND r2.to_person_id = p_person_b_id
    AND r1.relationship_type = 'parent'
    AND r2.relationship_type = 'parent'
  ) THEN
    calculated_score := calculated_score + 10;
    match_reasons := array_append(match_reasons, 'Shared parent');
  END IF;
  
  -- Normalize score to 0-1 range
  calculated_score := LEAST(calculated_score / 100.0, 1.0);
  
  RETURN QUERY SELECT calculated_score, match_reasons, match_details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;