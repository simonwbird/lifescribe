-- Add labs_enabled to profiles table
ALTER TABLE public.profiles 
ADD COLUMN settings jsonb DEFAULT '{"labs_enabled": false}'::jsonb;

-- Update existing profiles to have the default settings
UPDATE public.profiles 
SET settings = '{"labs_enabled": false}'::jsonb 
WHERE settings IS NULL;