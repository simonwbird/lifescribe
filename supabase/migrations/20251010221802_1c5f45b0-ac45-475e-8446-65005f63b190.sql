-- Create person roles enum
CREATE TYPE public.person_role_type AS ENUM (
  'owner',
  'co_curator',
  'steward',
  'contributor',
  'viewer'
);

-- Create person roles table (separate from family member roles)
CREATE TABLE IF NOT EXISTS public.person_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  role person_role_type NOT NULL DEFAULT 'viewer',
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  revoked_at timestamp with time zone,
  revoked_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(person_id, profile_id, role)
);

-- Create death verification documents table
CREATE TABLE IF NOT EXISTS public.death_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  verification_type text NOT NULL DEFAULT 'document',
  document_type text,
  document_url text,
  verified_by uuid NOT NULL REFERENCES auth.users(id),
  verified_at timestamp with time zone NOT NULL DEFAULT now(),
  death_date date,
  death_place text,
  certificate_number text,
  issuing_authority text,
  admin_override boolean DEFAULT false,
  override_reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create memorialization records table
CREATE TABLE IF NOT EXISTS public.memorialization_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  initiated_by uuid NOT NULL REFERENCES auth.users(id),
  initiated_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending',
  verification_id uuid REFERENCES public.death_verifications(id),
  previous_status text NOT NULL,
  previous_blocks jsonb,
  stewards_assigned uuid[] DEFAULT '{}',
  locked_blocks text[] DEFAULT '{}',
  conversion_metadata jsonb DEFAULT '{}',
  is_reversed boolean DEFAULT false,
  reversed_at timestamp with time zone,
  reversed_by uuid REFERENCES auth.users(id),
  reverse_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add constraints
ALTER TABLE public.death_verifications
ADD CONSTRAINT death_verification_type_check
CHECK (verification_type IN ('document', 'admin_override', 'family_attestation'));

ALTER TABLE public.death_verifications
ADD CONSTRAINT death_document_type_check
CHECK (document_type IN ('death_certificate', 'obituary', 'funeral_notice', 'legal_document', 'other'));

ALTER TABLE public.memorialization_records
ADD CONSTRAINT memorialization_status_check
CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'reversed'));

-- Create indexes
CREATE INDEX idx_person_roles_person_id ON public.person_roles(person_id);
CREATE INDEX idx_person_roles_profile_id ON public.person_roles(profile_id);
CREATE INDEX idx_person_roles_role ON public.person_roles(role);
CREATE INDEX idx_death_verifications_person_id ON public.death_verifications(person_id);
CREATE INDEX idx_memorialization_records_person_id ON public.memorialization_records(person_id);
CREATE INDEX idx_memorialization_records_status ON public.memorialization_records(status);

-- Enable RLS
ALTER TABLE public.person_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.death_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memorialization_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for person_roles
CREATE POLICY "Family members can view person roles"
ON public.person_roles FOR SELECT
USING (
  family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid())
);

CREATE POLICY "Family admins can manage person roles"
ON public.person_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.members
    WHERE profile_id = auth.uid()
    AND family_id = person_roles.family_id
    AND role = 'admin'
  )
);

-- RLS Policies for death_verifications
CREATE POLICY "Family members can view death verifications"
ON public.death_verifications FOR SELECT
USING (
  family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid())
);

CREATE POLICY "Family admins can create death verifications"
ON public.death_verifications FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.members
    WHERE profile_id = auth.uid()
    AND family_id = death_verifications.family_id
    AND role = 'admin'
  )
  AND verified_by = auth.uid()
);

-- RLS Policies for memorialization_records
CREATE POLICY "Family members can view memorialization records"
ON public.memorialization_records FOR SELECT
USING (
  family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid())
);

CREATE POLICY "Family admins can manage memorialization"
ON public.memorialization_records FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.members
    WHERE profile_id = auth.uid()
    AND family_id = memorialization_records.family_id
    AND role = 'admin'
  )
);

-- Function to initiate memorialization
CREATE OR REPLACE FUNCTION public.initiate_memorialization(
  p_person_id uuid,
  p_initiated_by uuid,
  p_verification_id uuid,
  p_steward_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  person_record public.people%ROWTYPE;
  memorialization_id uuid;
  result jsonb;
BEGIN
  -- Get person details
  SELECT * INTO person_record FROM public.people WHERE id = p_person_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Person not found');
  END IF;

  -- Check if person is already memorialized
  IF person_record.status = 'passed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Person already memorialized');
  END IF;

  -- Create memorialization record
  INSERT INTO public.memorialization_records (
    person_id,
    family_id,
    initiated_by,
    verification_id,
    status,
    previous_status,
    stewards_assigned,
    locked_blocks
  ) VALUES (
    p_person_id,
    person_record.family_id,
    p_initiated_by,
    p_verification_id,
    'pending',
    person_record.status,
    p_steward_ids,
    ARRAY['now_next', 'goals', 'upcoming_events']
  ) RETURNING id INTO memorialization_id;

  -- Log audit event
  PERFORM log_audit_event(
    p_actor_id := p_initiated_by,
    p_action := 'PERSON_MEMORIALIZE_INITIATED',
    p_entity_type := 'memorialization',
    p_entity_id := memorialization_id,
    p_family_id := person_record.family_id,
    p_details := jsonb_build_object(
      'person_id', p_person_id,
      'stewards', p_steward_ids,
      'verification_id', p_verification_id
    ),
    p_risk_score := 20
  );

  result := jsonb_build_object(
    'success', true,
    'memorialization_id', memorialization_id,
    'status', 'pending',
    'message', 'Memorialization initiated. Proceed with completion.'
  );
  
  RETURN result;
END;
$$;

-- Function to complete memorialization
CREATE OR REPLACE FUNCTION public.complete_memorialization(
  p_memorialization_id uuid,
  p_death_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  memorial_record public.memorialization_records%ROWTYPE;
  person_record public.people%ROWTYPE;
  steward_id uuid;
  result jsonb;
BEGIN
  -- Get memorialization details
  SELECT * INTO memorial_record 
  FROM public.memorialization_records 
  WHERE id = p_memorialization_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Memorialization record not found or not pending');
  END IF;

  -- Get person details
  SELECT * INTO person_record FROM public.people WHERE id = memorial_record.person_id;

  -- Update person status
  UPDATE public.people
  SET 
    status = 'passed',
    death_date = p_death_date,
    updated_at = now()
  WHERE id = memorial_record.person_id;

  -- Assign steward roles
  FOREACH steward_id IN ARRAY memorial_record.stewards_assigned
  LOOP
    INSERT INTO public.person_roles (
      person_id,
      profile_id,
      family_id,
      role,
      granted_by
    ) VALUES (
      memorial_record.person_id,
      steward_id,
      memorial_record.family_id,
      'steward',
      memorial_record.initiated_by
    )
    ON CONFLICT (person_id, profile_id, role) DO NOTHING;
  END LOOP;

  -- Downgrade co-curators to contributors
  UPDATE public.person_roles
  SET 
    role = 'contributor',
    updated_at = now()
  WHERE person_id = memorial_record.person_id
    AND role = 'co_curator'
    AND profile_id != ALL(memorial_record.stewards_assigned);

  -- Revoke owner posting rights (keep role but mark as revoked)
  UPDATE public.person_roles
  SET 
    revoked_at = now(),
    updated_at = now()
  WHERE person_id = memorial_record.person_id
    AND role = 'owner';

  -- Complete memorialization record
  UPDATE public.memorialization_records
  SET 
    status = 'completed',
    completed_at = now(),
    updated_at = now()
  WHERE id = p_memorialization_id;

  -- Log audit event
  PERFORM log_audit_event(
    p_actor_id := memorial_record.initiated_by,
    p_action := 'PERSON_MEMORIALIZED',
    p_entity_type := 'person',
    p_entity_id := memorial_record.person_id,
    p_family_id := memorial_record.family_id,
    p_details := jsonb_build_object(
      'memorialization_id', p_memorialization_id,
      'death_date', p_death_date,
      'stewards', memorial_record.stewards_assigned
    ),
    p_risk_score := 25
  );

  result := jsonb_build_object(
    'success', true,
    'person_id', memorial_record.person_id,
    'status', 'completed',
    'message', 'Person successfully memorialized'
  );
  
  RETURN result;
END;
$$;

-- Function to reverse memorialization
CREATE OR REPLACE FUNCTION public.reverse_memorialization(
  p_memorialization_id uuid,
  p_reversed_by uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  memorial_record public.memorialization_records%ROWTYPE;
  result jsonb;
BEGIN
  -- Get memorialization details
  SELECT * INTO memorial_record 
  FROM public.memorialization_records 
  WHERE id = p_memorialization_id AND status = 'completed';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Memorialization record not found or not completed');
  END IF;

  -- Restore person status
  UPDATE public.people
  SET 
    status = memorial_record.previous_status,
    death_date = NULL,
    updated_at = now()
  WHERE id = memorial_record.person_id;

  -- Remove steward roles
  DELETE FROM public.person_roles
  WHERE person_id = memorial_record.person_id
    AND role = 'steward'
    AND profile_id = ANY(memorial_record.stewards_assigned);

  -- Restore co-curator roles
  UPDATE public.person_roles
  SET 
    role = 'co_curator',
    updated_at = now()
  WHERE person_id = memorial_record.person_id
    AND role = 'contributor';

  -- Restore owner posting rights
  UPDATE public.person_roles
  SET 
    revoked_at = NULL,
    updated_at = now()
  WHERE person_id = memorial_record.person_id
    AND role = 'owner';

  -- Mark memorialization as reversed
  UPDATE public.memorialization_records
  SET 
    status = 'reversed',
    is_reversed = true,
    reversed_at = now(),
    reversed_by = p_reversed_by,
    reverse_reason = p_reason,
    updated_at = now()
  WHERE id = p_memorialization_id;

  -- Log audit event
  PERFORM log_audit_event(
    p_actor_id := p_reversed_by,
    p_action := 'PERSON_MEMORIALIZE_REVERSED',
    p_entity_type := 'person',
    p_entity_id := memorial_record.person_id,
    p_family_id := memorial_record.family_id,
    p_details := jsonb_build_object(
      'memorialization_id', p_memorialization_id,
      'reason', p_reason
    ),
    p_risk_score := 30
  );

  result := jsonb_build_object(
    'success', true,
    'person_id', memorial_record.person_id,
    'message', 'Memorialization reversed successfully'
  );
  
  RETURN result;
END;
$$;

-- Function to check if user has specific person role
CREATE OR REPLACE FUNCTION public.has_person_role(
  p_user_id uuid,
  p_person_id uuid,
  p_role person_role_type
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.person_roles
    WHERE profile_id = p_user_id
      AND person_id = p_person_id
      AND role = p_role
      AND revoked_at IS NULL
  );
$$;

-- Function to get user's highest person role
CREATE OR REPLACE FUNCTION public.get_user_person_role(
  p_user_id uuid,
  p_person_id uuid
)
RETURNS person_role_type
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role person_role_type;
BEGIN
  -- Return highest role (in order: owner > steward > co_curator > contributor > viewer)
  SELECT role INTO user_role
  FROM public.person_roles
  WHERE profile_id = p_user_id
    AND person_id = p_person_id
    AND revoked_at IS NULL
  ORDER BY
    CASE role
      WHEN 'owner' THEN 1
      WHEN 'steward' THEN 2
      WHEN 'co_curator' THEN 3
      WHEN 'contributor' THEN 4
      WHEN 'viewer' THEN 5
    END
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'viewer');
END;
$$;

-- Function to check if block is locked for person
CREATE OR REPLACE FUNCTION public.is_block_locked(
  p_person_id uuid,
  p_block_type text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memorialization_records
    WHERE person_id = p_person_id
      AND status = 'completed'
      AND p_block_type = ANY(locked_blocks)
  );
$$;

-- Trigger to auto-create owner role when person is created
CREATE OR REPLACE FUNCTION public.create_person_owner_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.person_roles (
    person_id,
    profile_id,
    family_id,
    role,
    granted_by
  ) VALUES (
    NEW.id,
    NEW.created_by,
    NEW.family_id,
    'owner',
    NEW.created_by
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_person_owner_role
AFTER INSERT ON public.people
FOR EACH ROW
EXECUTE FUNCTION public.create_person_owner_role();