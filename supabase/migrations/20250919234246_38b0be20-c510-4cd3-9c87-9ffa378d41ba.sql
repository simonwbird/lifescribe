-- Add missing foreign key relationship between weekly_digest_settings and families
ALTER TABLE public.weekly_digest_settings 
ADD CONSTRAINT weekly_digest_settings_family_id_fkey 
FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_weekly_digest_settings_family_id 
ON public.weekly_digest_settings(family_id);