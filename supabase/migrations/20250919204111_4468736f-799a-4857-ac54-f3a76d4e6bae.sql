-- Create enums for feature flags
CREATE TYPE public.feature_flag_status AS ENUM ('draft', 'active', 'inactive', 'archived');
CREATE TYPE public.rollout_type AS ENUM ('global', 'cohort', 'family', 'user');
CREATE TYPE public.targeting_type AS ENUM ('role', 'country', 'cohort', 'family_id', 'user_id');

-- Create feature flags table
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  key text UNIQUE NOT NULL, -- programmatic key like 'new_ui_enabled'
  description text,
  status feature_flag_status NOT NULL DEFAULT 'draft',
  rollout_percentage integer DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  rollout_type rollout_type NOT NULL DEFAULT 'global',
  is_kill_switch boolean DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_changed_by uuid,
  last_changed_at timestamp with time zone
);

-- Create feature flag targeting rules
CREATE TABLE public.feature_flag_targeting (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id uuid NOT NULL REFERENCES public.feature_flags(id) ON DELETE CASCADE,
  targeting_type targeting_type NOT NULL,
  targeting_value text NOT NULL, -- JSON array for multiple values
  rollout_percentage integer DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  is_enabled boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create remote config table
CREATE TABLE public.remote_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  value_type text NOT NULL DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
  default_value jsonb NOT NULL,
  current_value jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_changed_by uuid,
  last_changed_at timestamp with time zone
);

-- Create feature flag user overrides (for testing)
CREATE TABLE public.feature_flag_user_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id uuid NOT NULL REFERENCES public.feature_flags(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_enabled boolean NOT NULL,
  reason text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  
  UNIQUE(flag_id, user_id)
);

-- Create feature flag analytics
CREATE TABLE public.feature_flag_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id uuid NOT NULL REFERENCES public.feature_flags(id) ON DELETE CASCADE,
  user_id uuid,
  family_id uuid,
  event_type text NOT NULL, -- 'evaluated', 'enabled', 'disabled'
  evaluation_result boolean,
  targeting_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flag_targeting ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flag_user_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flag_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for feature flags (super admin only)
CREATE POLICY "Super admins can manage feature flags"
ON public.feature_flags
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (settings->>'role')::text = 'super_admin'
  )
);

CREATE POLICY "Super admins can manage feature flag targeting"
ON public.feature_flag_targeting
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (settings->>'role')::text = 'super_admin'
  )
);

CREATE POLICY "Super admins can manage remote config"
ON public.remote_config
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (settings->>'role')::text = 'super_admin'
  )
);

CREATE POLICY "Super admins can manage user overrides"
ON public.feature_flag_user_overrides
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (settings->>'role')::text = 'super_admin'
  )
);

-- Analytics policies (more permissive for system)
CREATE POLICY "System can create flag analytics"
ON public.feature_flag_analytics
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Super admins can view flag analytics"
ON public.feature_flag_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (settings->>'role')::text = 'super_admin'
  )
);

-- Create indexes for performance
CREATE INDEX idx_feature_flags_status ON public.feature_flags(status);
CREATE INDEX idx_feature_flags_key ON public.feature_flags(key);
CREATE INDEX idx_feature_flag_targeting_flag_id ON public.feature_flag_targeting(flag_id);
CREATE INDEX idx_feature_flag_targeting_type_value ON public.feature_flag_targeting(targeting_type, targeting_value);
CREATE INDEX idx_remote_config_key ON public.remote_config(key);
CREATE INDEX idx_remote_config_active ON public.remote_config(is_active);
CREATE INDEX idx_feature_flag_user_overrides_user_flag ON public.feature_flag_user_overrides(user_id, flag_id);
CREATE INDEX idx_feature_flag_analytics_flag_created ON public.feature_flag_analytics(flag_id, created_at);
CREATE INDEX idx_feature_flag_analytics_user_created ON public.feature_flag_analytics(user_id, created_at);

-- Create update triggers
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_flag_targeting_updated_at
  BEFORE UPDATE ON public.feature_flag_targeting
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_remote_config_updated_at
  BEFORE UPDATE ON public.remote_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to evaluate feature flag for user
CREATE OR REPLACE FUNCTION public.evaluate_feature_flag(
  p_flag_key text,
  p_user_id uuid DEFAULT NULL,
  p_family_id uuid DEFAULT NULL,
  p_user_role text DEFAULT NULL,
  p_user_country text DEFAULT NULL,
  p_user_cohort text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  flag_record public.feature_flags%ROWTYPE;
  override_record public.feature_flag_user_overrides%ROWTYPE;
  targeting_rules public.feature_flag_targeting%ROWTYPE;
  evaluation_result boolean := false;
  targeting_reason text := 'default_disabled';
  random_value integer;
BEGIN
  -- Get the flag
  SELECT * INTO flag_record
  FROM public.feature_flags
  WHERE key = p_flag_key AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'enabled', false,
      'reason', 'flag_not_found_or_inactive'
    );
  END IF;
  
  -- Check for user override first
  IF p_user_id IS NOT NULL THEN
    SELECT * INTO override_record
    FROM public.feature_flag_user_overrides
    WHERE flag_id = flag_record.id 
      AND user_id = p_user_id
      AND (expires_at IS NULL OR expires_at > now());
    
    IF FOUND THEN
      RETURN jsonb_build_object(
        'enabled', override_record.is_enabled,
        'reason', 'user_override'
      );
    END IF;
  END IF;
  
  -- Check targeting rules
  FOR targeting_rules IN 
    SELECT * FROM public.feature_flag_targeting 
    WHERE flag_id = flag_record.id AND is_enabled = true
    ORDER BY created_at
  LOOP
    CASE targeting_rules.targeting_type
      WHEN 'role' THEN
        IF p_user_role IS NOT NULL AND targeting_rules.targeting_value::jsonb ? p_user_role THEN
          random_value := floor(random() * 100) + 1;
          IF random_value <= targeting_rules.rollout_percentage THEN
            evaluation_result := true;
            targeting_reason := 'role_targeting';
            EXIT;
          END IF;
        END IF;
      
      WHEN 'country' THEN
        IF p_user_country IS NOT NULL AND targeting_rules.targeting_value::jsonb ? p_user_country THEN
          random_value := floor(random() * 100) + 1;
          IF random_value <= targeting_rules.rollout_percentage THEN
            evaluation_result := true;
            targeting_reason := 'country_targeting';
            EXIT;
          END IF;
        END IF;
      
      WHEN 'cohort' THEN
        IF p_user_cohort IS NOT NULL AND targeting_rules.targeting_value::jsonb ? p_user_cohort THEN
          random_value := floor(random() * 100) + 1;
          IF random_value <= targeting_rules.rollout_percentage THEN
            evaluation_result := true;
            targeting_reason := 'cohort_targeting';
            EXIT;
          END IF;
        END IF;
      
      WHEN 'family_id' THEN
        IF p_family_id IS NOT NULL AND targeting_rules.targeting_value::jsonb ? p_family_id::text THEN
          random_value := floor(random() * 100) + 1;
          IF random_value <= targeting_rules.rollout_percentage THEN
            evaluation_result := true;
            targeting_reason := 'family_targeting';
            EXIT;
          END IF;
        END IF;
      
      WHEN 'user_id' THEN
        IF p_user_id IS NOT NULL AND targeting_rules.targeting_value::jsonb ? p_user_id::text THEN
          random_value := floor(random() * 100) + 1;
          IF random_value <= targeting_rules.rollout_percentage THEN
            evaluation_result := true;
            targeting_reason := 'user_targeting';
            EXIT;
          END IF;
        END IF;
    END CASE;
  END LOOP;
  
  -- If no targeting rules matched, check global rollout
  IF NOT evaluation_result AND flag_record.rollout_type = 'global' THEN
    random_value := floor(random() * 100) + 1;
    IF random_value <= flag_record.rollout_percentage THEN
      evaluation_result := true;
      targeting_reason := 'global_rollout';
    END IF;
  END IF;
  
  -- Log analytics
  INSERT INTO public.feature_flag_analytics (
    flag_id, user_id, family_id, event_type, evaluation_result, targeting_reason
  ) VALUES (
    flag_record.id, p_user_id, p_family_id, 'evaluated', evaluation_result, targeting_reason
  );
  
  RETURN jsonb_build_object(
    'enabled', evaluation_result,
    'reason', targeting_reason,
    'flag_id', flag_record.id
  );
END;
$$;

-- Insert default remote config values
INSERT INTO public.remote_config (key, name, description, value_type, default_value, current_value, created_by) VALUES
('prompt_rotation_interval_hours', 'Prompt Rotation Interval', 'How often to rotate prompts in hours', 'number', '24'::jsonb, '24'::jsonb, '00000000-0000-0000-0000-000000000000'),
('max_upload_size_mb', 'Maximum Upload Size', 'Maximum file upload size in MB', 'number', '50'::jsonb, '50'::jsonb, '00000000-0000-0000-0000-000000000000'),
('autosave_interval_seconds', 'Autosave Interval', 'How often to autosave drafts in seconds', 'number', '30'::jsonb, '30'::jsonb, '00000000-0000-0000-0000-000000000000'),
('digest_unlock_threshold', 'Digest Unlock Threshold', 'Number of family members required to unlock digest features', 'number', '2'::jsonb, '2'::jsonb, '00000000-0000-0000-0000-000000000000'),
('max_family_members', 'Maximum Family Members', 'Maximum number of members allowed per family', 'number', '50'::jsonb, '50'::jsonb, '00000000-0000-0000-0000-000000000000'),
('enable_voice_transcription', 'Enable Voice Transcription', 'Whether voice transcription is enabled', 'boolean', 'true'::jsonb, 'true'::jsonb, '00000000-0000-0000-0000-000000000000');

-- Insert sample feature flags
INSERT INTO public.feature_flags (key, name, description, status, rollout_percentage, rollout_type, created_by) VALUES
('new_ui_enabled', 'New UI Design', 'Enable the new user interface design', 'active', 25, 'global', '00000000-0000-0000-0000-000000000000'),
('advanced_search', 'Advanced Search', 'Enable advanced search capabilities', 'active', 100, 'global', '00000000-0000-0000-0000-000000000000'),
('beta_features', 'Beta Features', 'Enable beta testing features', 'active', 0, 'cohort', '00000000-0000-0000-0000-000000000000');