-- Create change suggestions system
CREATE TABLE IF NOT EXISTS public.content_change_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  suggested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  suggester_name TEXT,
  suggester_email TEXT,
  block_id UUID,
  change_type TEXT NOT NULL CHECK (change_type IN ('block_content', 'block_add', 'block_remove', 'person_info')),
  current_value JSONB,
  suggested_value JSONB NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_suggestions_person_status ON public.content_change_suggestions(person_id, status);
CREATE INDEX idx_suggestions_family ON public.content_change_suggestions(family_id, status);

-- Enable RLS
ALTER TABLE public.content_change_suggestions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create suggestions
CREATE POLICY "Anyone can create change suggestions"
ON public.content_change_suggestions
FOR INSERT
WITH CHECK (true);

-- Policy: Stewards and owners can view suggestions
CREATE POLICY "Stewards can view suggestions"
ON public.content_change_suggestions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.person_roles pr
    WHERE pr.person_id = content_change_suggestions.person_id
    AND pr.profile_id = auth.uid()
    AND pr.role IN ('owner', 'steward', 'co_curator')
    AND pr.revoked_at IS NULL
  )
);

-- Policy: Suggestion authors can view their own
CREATE POLICY "Authors can view own suggestions"
ON public.content_change_suggestions
FOR SELECT
USING (suggested_by = auth.uid());

-- Policy: Stewards can update suggestions
CREATE POLICY "Stewards can update suggestions"
ON public.content_change_suggestions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.person_roles pr
    WHERE pr.person_id = content_change_suggestions.person_id
    AND pr.profile_id = auth.uid()
    AND pr.role IN ('owner', 'steward', 'co_curator')
    AND pr.revoked_at IS NULL
  )
);

-- Function to approve change suggestion
CREATE OR REPLACE FUNCTION approve_change_suggestion(
  p_suggestion_id UUID,
  p_reviewer_id UUID,
  p_apply_changes BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  suggestion_record content_change_suggestions%ROWTYPE;
BEGIN
  -- Get suggestion
  SELECT * INTO suggestion_record
  FROM content_change_suggestions
  WHERE id = p_suggestion_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Suggestion not found';
  END IF;

  -- Check permission
  IF NOT has_person_role(p_reviewer_id, suggestion_record.person_id, 'steward')
     AND NOT has_person_role(p_reviewer_id, suggestion_record.person_id, 'owner')
     AND NOT has_person_role(p_reviewer_id, suggestion_record.person_id, 'co_curator') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Update suggestion status
  UPDATE content_change_suggestions
  SET 
    status = 'approved',
    reviewed_by = p_reviewer_id,
    reviewed_at = now()
  WHERE id = p_suggestion_id;

  -- Log the approval
  PERFORM log_content_change(
    p_content_type := 'suggestion',
    p_content_id := p_suggestion_id,
    p_family_id := suggestion_record.family_id,
    p_editor_id := p_reviewer_id,
    p_action_type := 'approve_suggestion',
    p_change_reason := 'Suggestion approved'
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function to reject change suggestion
CREATE OR REPLACE FUNCTION reject_change_suggestion(
  p_suggestion_id UUID,
  p_reviewer_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  suggestion_record content_change_suggestions%ROWTYPE;
BEGIN
  -- Get suggestion
  SELECT * INTO suggestion_record
  FROM content_change_suggestions
  WHERE id = p_suggestion_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Suggestion not found';
  END IF;

  -- Check permission
  IF NOT has_person_role(p_reviewer_id, suggestion_record.person_id, 'steward')
     AND NOT has_person_role(p_reviewer_id, suggestion_record.person_id, 'owner')
     AND NOT has_person_role(p_reviewer_id, suggestion_record.person_id, 'co_curator') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Update suggestion status
  UPDATE content_change_suggestions
  SET 
    status = 'rejected',
    reviewed_by = p_reviewer_id,
    reviewed_at = now(),
    review_reason = p_reason
  WHERE id = p_suggestion_id;

  RETURN jsonb_build_object('success', true);
END;
$$;