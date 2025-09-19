-- Enhanced audit log system with tamper-evident hashing

-- Create audit action types enum
CREATE TYPE public.audit_action_type AS ENUM (
  'LOGIN', 'LOGOUT', 'SIGNUP', 'PASSWORD_CHANGE', 'EMAIL_CHANGE',
  'STORY_CREATE', 'STORY_UPDATE', 'STORY_DELETE', 'STORY_VIEW',
  'COMMENT_CREATE', 'COMMENT_UPDATE', 'COMMENT_DELETE',
  'REACTION_CREATE', 'REACTION_DELETE',
  'MEDIA_UPLOAD', 'MEDIA_DELETE', 'MEDIA_VIEW',
  'FAMILY_CREATE', 'FAMILY_UPDATE', 'FAMILY_DELETE',
  'MEMBER_INVITE', 'MEMBER_JOIN', 'MEMBER_REMOVE', 'MEMBER_ROLE_CHANGE',
  'ADMIN_ACCESS_GRANTED', 'ADMIN_ACCESS_REVOKED', 'ADMIN_LOGIN',
  'EXPORT_REQUESTED', 'EXPORT_COMPLETED', 'RTBF_REQUESTED', 'RTBF_EXECUTED',
  'SETTINGS_UPDATE', 'PRIVACY_CHANGE', 'PROFILE_UPDATE',
  'RECIPE_CREATE', 'RECIPE_UPDATE', 'RECIPE_DELETE',
  'PROPERTY_CREATE', 'PROPERTY_UPDATE', 'PROPERTY_DELETE',
  'PET_CREATE', 'PET_UPDATE', 'PET_DELETE'
);

-- Create comprehensive audit log table
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_number bigserial UNIQUE NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_type text NOT NULL DEFAULT 'user', -- 'user', 'system', 'admin'
  action audit_action_type NOT NULL,
  entity_type text NOT NULL, -- 'story', 'user', 'family', etc.
  entity_id uuid,
  family_id uuid REFERENCES public.families(id) ON DELETE SET NULL,
  ip_address inet,
  user_agent text,
  session_id text,
  details jsonb DEFAULT '{}',
  before_values jsonb DEFAULT '{}',
  after_values jsonb DEFAULT '{}',
  risk_score integer DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Tamper-evident hashing
  previous_hash text,
  current_hash text NOT NULL,
  hash_algorithm text NOT NULL DEFAULT 'sha256',
  
  -- Immutability constraints
  is_tampered boolean DEFAULT false,
  verified_at timestamp with time zone
);

-- Create admin access tracking table
CREATE TABLE public.admin_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id uuid REFERENCES public.families(id) ON DELETE CASCADE,
  role text NOT NULL,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  last_activity_at timestamp with time zone NOT NULL DEFAULT now(),
  revoked_at timestamp with time zone,
  revoked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revoke_reason text,
  is_active boolean GENERATED ALWAYS AS (revoked_at IS NULL) STORED,
  
  UNIQUE(admin_id, family_id, role, granted_at)
);

-- Create audit log hash verification table (for integrity checks)
CREATE TABLE public.audit_hash_chain (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_sequence bigint NOT NULL,
  end_sequence bigint NOT NULL,
  chain_hash text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  verified_at timestamp with time zone,
  
  UNIQUE(start_sequence, end_sequence)
);

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_hash_chain ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit_log (super admin only for full access)
CREATE POLICY "Super admins can view all audit logs"
ON public.audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (settings->>'role')::text = 'super_admin'
  )
);

CREATE POLICY "System can insert audit logs"
ON public.audit_log
FOR INSERT
WITH CHECK (true);

-- Family admins can view audit logs for their families
CREATE POLICY "Family admins can view family audit logs"
ON public.audit_log
FOR SELECT
USING (
  family_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.members
    WHERE profile_id = auth.uid()
    AND family_id = audit_log.family_id
    AND role = 'admin'
  )
);

-- RLS policies for admin_access_log
CREATE POLICY "Super admins can manage admin access log"
ON public.admin_access_log
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (settings->>'role')::text = 'super_admin'
  )
);

CREATE POLICY "Family admins can view family admin access"
ON public.admin_access_log
FOR SELECT
USING (
  family_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.members
    WHERE profile_id = auth.uid()
    AND family_id = admin_access_log.family_id
    AND role = 'admin'
  )
);

-- RLS policies for audit_hash_chain (verification table)
CREATE POLICY "Super admins can manage audit hash chain"
ON public.audit_hash_chain
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (settings->>'role')::text = 'super_admin'
  )
);

-- Create indexes for performance
CREATE INDEX idx_audit_log_actor_id ON public.audit_log(actor_id);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);
CREATE INDEX idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_family_id ON public.audit_log(family_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_sequence ON public.audit_log(sequence_number);
CREATE INDEX idx_audit_log_hash ON public.audit_log(current_hash);

CREATE INDEX idx_admin_access_admin_id ON public.admin_access_log(admin_id);
CREATE INDEX idx_admin_access_family_id ON public.admin_access_log(family_id);
CREATE INDEX idx_admin_access_active ON public.admin_access_log(is_active);
CREATE INDEX idx_admin_access_last_activity ON public.admin_access_log(last_activity_at DESC);

-- Function to calculate tamper-evident hash
CREATE OR REPLACE FUNCTION public.calculate_audit_hash(
  p_sequence_number bigint,
  p_actor_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_details jsonb,
  p_previous_hash text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hash_input text;
  calculated_hash text;
BEGIN
  -- Create deterministic hash input
  hash_input := CONCAT(
    COALESCE(p_sequence_number::text, ''),
    '|',
    COALESCE(p_actor_id::text, ''),
    '|',
    COALESCE(p_action, ''),
    '|',
    COALESCE(p_entity_type, ''),
    '|',
    COALESCE(p_entity_id::text, ''),
    '|',
    COALESCE(p_details::text, '{}'),
    '|',
    COALESCE(p_previous_hash, '')
  );
  
  -- Calculate SHA256 hash (simplified - in production would use proper crypto)
  calculated_hash := encode(digest(hash_input, 'sha256'), 'hex');
  
  RETURN calculated_hash;
END;
$$;

-- Function to log comprehensive audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_actor_id uuid DEFAULT NULL,
  p_actor_type text DEFAULT 'user',
  p_action audit_action_type DEFAULT 'STORY_VIEW',
  p_entity_type text DEFAULT 'unknown',
  p_entity_id uuid DEFAULT NULL,
  p_family_id uuid DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_details jsonb DEFAULT '{}',
  p_before_values jsonb DEFAULT '{}',
  p_after_values jsonb DEFAULT '{}',
  p_risk_score integer DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_id uuid;
  previous_hash text;
  current_hash text;
  current_sequence bigint;
BEGIN
  -- Get the last hash for chain integrity
  SELECT current_hash INTO previous_hash
  FROM public.audit_log
  ORDER BY sequence_number DESC
  LIMIT 1;
  
  -- Get next sequence number
  SELECT nextval('audit_log_sequence_number_seq') INTO current_sequence;
  
  -- Calculate current hash
  current_hash := calculate_audit_hash(
    current_sequence,
    p_actor_id,
    p_action::text,
    p_entity_type,
    p_entity_id,
    p_details,
    previous_hash
  );
  
  -- Insert audit log entry
  INSERT INTO public.audit_log (
    actor_id,
    actor_type,
    action,
    entity_type,
    entity_id,
    family_id,
    ip_address,
    user_agent,
    session_id,
    details,
    before_values,
    after_values,
    risk_score,
    previous_hash,
    current_hash
  ) VALUES (
    p_actor_id,
    p_actor_type,
    p_action,
    p_entity_type,
    p_entity_id,
    p_family_id,
    p_ip_address,
    p_user_agent,
    p_session_id,
    p_details,
    p_before_values,
    p_after_values,
    p_risk_score,
    previous_hash,
    current_hash
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;

-- Function to track admin access
CREATE OR REPLACE FUNCTION public.track_admin_access(
  p_admin_id uuid,
  p_family_id uuid,
  p_role text,
  p_granted_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  access_log_id uuid;
BEGIN
  -- Insert or update admin access log
  INSERT INTO public.admin_access_log (
    admin_id,
    family_id,
    role,
    granted_by,
    last_activity_at
  ) VALUES (
    p_admin_id,
    p_family_id,
    p_role,
    p_granted_by,
    now()
  )
  ON CONFLICT (admin_id, family_id, role, granted_at)
  DO UPDATE SET 
    last_activity_at = now()
  RETURNING id INTO access_log_id;
  
  -- Log the audit event
  PERFORM log_audit_event(
    p_actor_id := p_granted_by,
    p_action := 'ADMIN_ACCESS_GRANTED',
    p_entity_type := 'admin_access',
    p_entity_id := access_log_id,
    p_family_id := p_family_id,
    p_details := jsonb_build_object(
      'admin_id', p_admin_id,
      'role', p_role
    )
  );
  
  RETURN access_log_id;
END;
$$;

-- Function to revoke admin access
CREATE OR REPLACE FUNCTION public.revoke_admin_access(
  p_admin_id uuid,
  p_family_id uuid,
  p_role text,
  p_revoked_by uuid,
  p_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  access_log_id uuid;
BEGIN
  -- Update admin access log to mark as revoked
  UPDATE public.admin_access_log
  SET 
    revoked_at = now(),
    revoked_by = p_revoked_by,
    revoke_reason = p_reason
  WHERE admin_id = p_admin_id
    AND family_id = p_family_id
    AND role = p_role
    AND revoked_at IS NULL
  RETURNING id INTO access_log_id;
  
  IF access_log_id IS NOT NULL THEN
    -- Remove from members table if applicable
    DELETE FROM public.members
    WHERE profile_id = p_admin_id
      AND family_id = p_family_id
      AND role::text = p_role;
    
    -- Log the audit event
    PERFORM log_audit_event(
      p_actor_id := p_revoked_by,
      p_action := 'ADMIN_ACCESS_REVOKED',
      p_entity_type := 'admin_access',
      p_entity_id := access_log_id,
      p_family_id := p_family_id,
      p_details := jsonb_build_object(
        'admin_id', p_admin_id,
        'role', p_role,
        'reason', p_reason
      ),
      p_risk_score := 25
    );
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Function to verify audit log integrity
CREATE OR REPLACE FUNCTION public.verify_audit_integrity(
  p_start_sequence bigint DEFAULT NULL,
  p_end_sequence bigint DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_record RECORD;
  expected_hash text;
  verification_result jsonb := jsonb_build_object('valid', true, 'errors', jsonb_build_array());
  error_count integer := 0;
BEGIN
  -- Default to checking last 1000 records if no range specified
  IF p_start_sequence IS NULL THEN
    SELECT MIN(sequence_number) INTO p_start_sequence
    FROM (
      SELECT sequence_number 
      FROM public.audit_log 
      ORDER BY sequence_number DESC 
      LIMIT 1000
    ) recent_logs;
  END IF;
  
  IF p_end_sequence IS NULL THEN
    SELECT MAX(sequence_number) INTO p_end_sequence
    FROM public.audit_log;
  END IF;
  
  -- Verify hash chain
  FOR audit_record IN 
    SELECT * FROM public.audit_log 
    WHERE sequence_number BETWEEN p_start_sequence AND p_end_sequence
    ORDER BY sequence_number ASC
  LOOP
    -- Calculate expected hash
    expected_hash := calculate_audit_hash(
      audit_record.sequence_number,
      audit_record.actor_id,
      audit_record.action::text,
      audit_record.entity_type,
      audit_record.entity_id,
      audit_record.details,
      audit_record.previous_hash
    );
    
    -- Check if hash matches
    IF expected_hash != audit_record.current_hash THEN
      verification_result := jsonb_set(
        verification_result,
        '{valid}',
        'false'::jsonb
      );
      
      verification_result := jsonb_set(
        verification_result,
        '{errors}',
        (verification_result->'errors') || jsonb_build_object(
          'sequence', audit_record.sequence_number,
          'expected_hash', expected_hash,
          'actual_hash', audit_record.current_hash,
          'message', 'Hash mismatch detected'
        )
      );
      
      error_count := error_count + 1;
      
      -- Mark as tampered
      UPDATE public.audit_log 
      SET is_tampered = true 
      WHERE id = audit_record.id;
    END IF;
  END LOOP;
  
  -- Add summary
  verification_result := jsonb_set(
    verification_result,
    '{summary}',
    jsonb_build_object(
      'checked_records', p_end_sequence - p_start_sequence + 1,
      'error_count', error_count,
      'verified_at', now()
    )
  );
  
  RETURN verification_result;
END;
$$;

-- Create triggers to automatically log audit events for key tables
CREATE OR REPLACE FUNCTION public.auto_audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_type audit_action_type;
  entity_type text;
  family_id_val uuid;
BEGIN
  -- Determine action type
  CASE TG_OP
    WHEN 'INSERT' THEN
      CASE TG_TABLE_NAME
        WHEN 'stories' THEN action_type := 'STORY_CREATE';
        WHEN 'comments' THEN action_type := 'COMMENT_CREATE';
        WHEN 'reactions' THEN action_type := 'REACTION_CREATE';
        WHEN 'media' THEN action_type := 'MEDIA_UPLOAD';
        WHEN 'recipes' THEN action_type := 'RECIPE_CREATE';
        WHEN 'properties' THEN action_type := 'PROPERTY_CREATE';
        WHEN 'pets' THEN action_type := 'PET_CREATE';
        ELSE action_type := 'STORY_CREATE'; -- default
      END CASE;
    WHEN 'UPDATE' THEN
      CASE TG_TABLE_NAME
        WHEN 'stories' THEN action_type := 'STORY_UPDATE';
        WHEN 'comments' THEN action_type := 'COMMENT_UPDATE';
        WHEN 'recipes' THEN action_type := 'RECIPE_UPDATE';
        WHEN 'properties' THEN action_type := 'PROPERTY_UPDATE';
        WHEN 'pets' THEN action_type := 'PET_UPDATE';
        ELSE action_type := 'STORY_UPDATE'; -- default
      END CASE;
    WHEN 'DELETE' THEN
      CASE TG_TABLE_NAME
        WHEN 'stories' THEN action_type := 'STORY_DELETE';
        WHEN 'comments' THEN action_type := 'COMMENT_DELETE';
        WHEN 'reactions' THEN action_type := 'REACTION_DELETE';
        WHEN 'media' THEN action_type := 'MEDIA_DELETE';
        WHEN 'recipes' THEN action_type := 'RECIPE_DELETE';
        WHEN 'properties' THEN action_type := 'PROPERTY_DELETE';
        WHEN 'pets' THEN action_type := 'PET_DELETE';
        ELSE action_type := 'STORY_DELETE'; -- default
      END CASE;
  END CASE;
  
  -- Get entity type and family_id
  entity_type := TG_TABLE_NAME;
  
  -- Extract family_id based on table structure
  CASE TG_TABLE_NAME
    WHEN 'stories', 'comments', 'reactions', 'media', 'recipes', 'properties', 'pets' THEN
      CASE TG_OP
        WHEN 'DELETE' THEN family_id_val := OLD.family_id;
        ELSE family_id_val := NEW.family_id;
      END CASE;
  END CASE;
  
  -- Log the audit event
  PERFORM log_audit_event(
    p_actor_id := auth.uid(),
    p_action := action_type,
    p_entity_type := entity_type,
    p_entity_id := CASE TG_OP 
      WHEN 'DELETE' THEN OLD.id 
      ELSE NEW.id 
    END,
    p_family_id := family_id_val,
    p_details := CASE TG_OP
      WHEN 'INSERT' THEN to_jsonb(NEW)
      WHEN 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
      WHEN 'DELETE' THEN to_jsonb(OLD)
    END,
    p_before_values := CASE TG_OP 
      WHEN 'UPDATE' THEN to_jsonb(OLD)
      WHEN 'DELETE' THEN to_jsonb(OLD)
      ELSE '{}'::jsonb
    END,
    p_after_values := CASE TG_OP
      WHEN 'INSERT' THEN to_jsonb(NEW)
      WHEN 'UPDATE' THEN to_jsonb(NEW)
      ELSE '{}'::jsonb
    END
  );
  
  RETURN CASE TG_OP 
    WHEN 'DELETE' THEN OLD 
    ELSE NEW 
  END;
END;
$$;

-- Create audit triggers for key tables
CREATE TRIGGER audit_stories_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.auto_audit_trigger();

CREATE TRIGGER audit_comments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.auto_audit_trigger();

CREATE TRIGGER audit_reactions_trigger
  AFTER INSERT OR DELETE ON public.reactions
  FOR EACH ROW EXECUTE FUNCTION public.auto_audit_trigger();

CREATE TRIGGER audit_media_trigger
  AFTER INSERT OR DELETE ON public.media
  FOR EACH ROW EXECUTE FUNCTION public.auto_audit_trigger();

CREATE TRIGGER audit_recipes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.auto_audit_trigger();

CREATE TRIGGER audit_properties_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.auto_audit_trigger();

CREATE TRIGGER audit_pets_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.auto_audit_trigger();