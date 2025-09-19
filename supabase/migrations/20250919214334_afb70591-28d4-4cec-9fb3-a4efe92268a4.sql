-- Add localization fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS locale text DEFAULT 'en-US';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text DEFAULT 'US';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_format_preference text DEFAULT NULL;

-- Add check constraints for valid values
ALTER TABLE public.profiles ADD CONSTRAINT valid_locale 
  CHECK (locale ~ '^[a-z]{2}-[A-Z]{2}$');

ALTER TABLE public.profiles ADD CONSTRAINT valid_country 
  CHECK (country ~ '^[A-Z]{2}$');

-- Add some common timezone validation (not exhaustive but catches obvious errors)
ALTER TABLE public.profiles ADD CONSTRAINT valid_timezone 
  CHECK (
    timezone = 'UTC' OR 
    timezone LIKE 'America/%' OR 
    timezone LIKE 'Europe/%' OR 
    timezone LIKE 'Asia/%' OR 
    timezone LIKE 'Africa/%' OR 
    timezone LIKE 'Australia/%' OR 
    timezone LIKE 'Pacific/%' OR
    timezone LIKE 'Atlantic/%' OR
    timezone LIKE 'Indian/%'
  );

-- Add index for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_locale_timezone ON public.profiles(locale, timezone);

-- Add helpful comment
COMMENT ON COLUMN public.profiles.locale IS 'BCP-47 language tag (e.g., en-US, en-GB, fr-FR)';
COMMENT ON COLUMN public.profiles.timezone IS 'IANA timezone identifier (e.g., America/New_York, Europe/London)';
COMMENT ON COLUMN public.profiles.country IS 'ISO 3166-1 alpha-2 country code (e.g., US, GB, FR)';
COMMENT ON COLUMN public.profiles.date_format_preference IS 'Optional date format override (e.g., dd/MM/yyyy, MM/dd/yyyy)';