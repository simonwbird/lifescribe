-- Update weekly_digest_settings default to enabled
ALTER TABLE public.weekly_digest_settings 
ALTER COLUMN enabled SET DEFAULT true;

-- Add pause_expires_at column for 30-day pause tracking
ALTER TABLE public.weekly_digest_settings 
ADD COLUMN IF NOT EXISTS pause_expires_at timestamp with time zone;

-- Update existing trigger to enable digest by default
CREATE OR REPLACE FUNCTION public.enable_digest_for_new_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if this is the family's first member
  IF NOT EXISTS (
    SELECT 1 FROM members 
    WHERE family_id = NEW.family_id AND id != NEW.id
  ) THEN
    -- Create default digest settings for the family with enabled=true
    INSERT INTO weekly_digest_settings (
      family_id,
      enabled,
      delivery_day,
      delivery_hour,
      delivery_timezone,
      recipients,
      created_by,
      is_unlocked,
      unlock_threshold
    ) VALUES (
      NEW.family_id,
      true, -- Enabled by default
      0, -- Sunday
      9, -- 9 AM
      'America/New_York',
      '{}',
      NEW.profile_id,
      false,
      2
    )
    ON CONFLICT (family_id) DO UPDATE SET
      enabled = true,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to pause digest for 30 days
CREATE OR REPLACE FUNCTION public.pause_digest_30_days(p_family_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  UPDATE public.weekly_digest_settings
  SET 
    is_paused = true,
    pause_reason = '30_day_pause',
    paused_at = now(),
    paused_by = p_user_id,
    pause_expires_at = now() + interval '30 days',
    updated_at = now()
  WHERE family_id = p_family_id;
  
  result := jsonb_build_object(
    'success', true,
    'message', 'Digest paused for 30 days',
    'expires_at', now() + interval '30 days'
  );
  
  RETURN result;
END;
$$;

-- Function to resume digest
CREATE OR REPLACE FUNCTION public.resume_digest(p_family_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  UPDATE public.weekly_digest_settings
  SET 
    is_paused = false,
    pause_reason = NULL,
    paused_at = NULL,
    paused_by = NULL,
    pause_expires_at = NULL,
    updated_at = now()
  WHERE family_id = p_family_id;
  
  result := jsonb_build_object(
    'success', true,
    'message', 'Digest resumed'
  );
  
  RETURN result;
END;
$$;

-- Drop and recreate function to get followed members for digest
DROP FUNCTION IF EXISTS public.get_digest_followed_members(uuid, uuid);

CREATE FUNCTION public.get_digest_followed_members(p_family_id uuid, p_user_id uuid)
RETURNS TABLE(member_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user has any follow preferences set
  IF EXISTS (
    SELECT 1 FROM digest_follow_preferences 
    WHERE family_id = p_family_id AND user_id = p_user_id
  ) THEN
    -- Return only followed members
    RETURN QUERY
    SELECT followed_member_id
    FROM digest_follow_preferences
    WHERE family_id = p_family_id AND user_id = p_user_id;
  ELSE
    -- No preferences set = follow everyone
    RETURN QUERY
    SELECT profile_id
    FROM members
    WHERE family_id = p_family_id;
  END IF;
END;
$$;