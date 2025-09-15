-- Add mode to profiles settings
-- Update existing profiles to include mode in settings
UPDATE public.profiles 
SET settings = settings || '{"mode": "studio"}'::jsonb 
WHERE settings IS NOT NULL;

-- For profiles without settings, set default
UPDATE public.profiles 
SET settings = '{"labs_enabled": false, "mode": "studio"}'::jsonb 
WHERE settings IS NULL;