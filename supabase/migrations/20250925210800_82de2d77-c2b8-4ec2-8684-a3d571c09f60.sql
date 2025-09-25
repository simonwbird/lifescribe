-- Add onboarding columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_step text,
ADD COLUMN IF NOT EXISTS email_verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS locked_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamp with time zone;

-- Create onboarding_steps enum for better type safety
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'onboarding_step_type') THEN
        CREATE TYPE onboarding_step_type AS ENUM (
            'welcome',
            'profile_setup', 
            'family_setup',
            'preferences',
            'completed'
        );
    END IF;
END $$;

-- Update existing rows to have a default value before changing type
UPDATE public.profiles 
SET onboarding_step = 'welcome' 
WHERE onboarding_step IS NULL;

-- Change column type to enum and set default
ALTER TABLE public.profiles 
ALTER COLUMN onboarding_step TYPE onboarding_step_type USING onboarding_step::onboarding_step_type,
ALTER COLUMN onboarding_step SET DEFAULT 'welcome'::onboarding_step_type;

-- Create function to update email_verified_at when user confirms email
CREATE OR REPLACE FUNCTION public.update_email_verified_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if email_confirmed_at changed from NULL to a timestamp
    IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
        UPDATE public.profiles 
        SET email_verified_at = NEW.email_confirmed_at,
            updated_at = now()
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger on auth.users table (if it doesn't exist)
DROP TRIGGER IF EXISTS update_email_verified_on_auth_users ON auth.users;
CREATE TRIGGER update_email_verified_on_auth_users
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_email_verified_trigger();

-- Create function to handle onboarding progress
CREATE OR REPLACE FUNCTION public.update_onboarding_step(
    p_user_id uuid,
    p_step onboarding_step_type,
    p_data jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
    current_step onboarding_step_type;
BEGIN
    -- Get current step
    SELECT onboarding_step INTO current_step
    FROM public.profiles
    WHERE id = p_user_id;
    
    -- Update step and merge any additional data
    UPDATE public.profiles
    SET 
        onboarding_step = p_step,
        onboarding_completed_at = CASE 
            WHEN p_step = 'completed' THEN now()
            ELSE onboarding_completed_at
        END,
        settings = COALESCE(settings, '{}'::jsonb) || p_data,
        updated_at = now()
    WHERE id = p_user_id;
    
    -- Return updated state
    SELECT jsonb_build_object(
        'success', true,
        'previous_step', current_step,
        'current_step', p_step,
        'completed', p_step = 'completed',
        'updated_at', now()
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Create function to get onboarding state
CREATE OR REPLACE FUNCTION public.get_onboarding_state(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    profile_data record;
    family_data record;
    result jsonb;
BEGIN
    -- Get profile data
    SELECT 
        onboarding_step,
        onboarding_completed_at,
        email_verified_at,
        locked_until,
        full_name,
        settings
    INTO profile_data
    FROM public.profiles
    WHERE id = p_user_id;
    
    -- Get family membership info
    SELECT 
        f.id as family_id,
        f.name as family_name,
        m.role as member_role
    INTO family_data
    FROM public.members m
    JOIN public.families f ON f.id = m.family_id
    WHERE m.profile_id = p_user_id
    LIMIT 1;
    
    -- Build result
    result := jsonb_build_object(
        'current_step', profile_data.onboarding_step,
        'is_complete', profile_data.onboarding_completed_at IS NOT NULL,
        'completed_at', profile_data.onboarding_completed_at,
        'email_verified', profile_data.email_verified_at IS NOT NULL,
        'email_verified_at', profile_data.email_verified_at,
        'is_locked', profile_data.locked_until IS NOT NULL AND profile_data.locked_until > now(),
        'locked_until', profile_data.locked_until,
        'has_profile', profile_data.full_name IS NOT NULL AND length(trim(profile_data.full_name)) > 0,
        'has_family', family_data.family_id IS NOT NULL,
        'family_info', CASE 
            WHEN family_data.family_id IS NOT NULL THEN
                jsonb_build_object(
                    'id', family_data.family_id,
                    'name', family_data.family_name,
                    'role', family_data.member_role
                )
            ELSE NULL
        END,
        'settings', COALESCE(profile_data.settings, '{}'::jsonb)
    );
    
    RETURN result;
END;
$$;