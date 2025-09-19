-- Enhance weekly_digest_settings table
ALTER TABLE public.weekly_digest_settings 
ADD COLUMN IF NOT EXISTS is_paused boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pause_reason text,
ADD COLUMN IF NOT EXISTS paused_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS paused_by uuid,
ADD COLUMN IF NOT EXISTS last_forced_send_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS forced_send_by uuid,
ADD COLUMN IF NOT EXISTS content_settings jsonb DEFAULT '{"stories": true, "photos": true, "comments": true, "reactions": true, "birthdays": true, "highlights": true}'::jsonb,
ADD COLUMN IF NOT EXISTS unlock_threshold integer DEFAULT 2,
ADD COLUMN IF NOT EXISTS is_unlocked boolean DEFAULT false;

-- Create digest content cache for previews
CREATE TABLE IF NOT EXISTS public.digest_content_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  digest_week date NOT NULL, -- Start of the week being digested
  content_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  created_by uuid,
  
  UNIQUE(family_id, digest_week)
);

-- Create digest send log
CREATE TABLE IF NOT EXISTS public.digest_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  digest_week date NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  sent_by uuid,
  send_type text NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'forced'
  recipient_count integer DEFAULT 0,
  content_summary jsonb DEFAULT '{}'::jsonb,
  
  UNIQUE(family_id, digest_week, send_type)
);

-- Enable RLS
ALTER TABLE public.digest_content_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digest_send_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for digest_content_cache
CREATE POLICY "Family members can view digest cache"
ON public.digest_content_cache
FOR SELECT
USING (
  family_id IN (
    SELECT family_id FROM public.members 
    WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "System can manage digest cache"
ON public.digest_content_cache
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS policies for digest_send_log
CREATE POLICY "Family members can view digest send log"
ON public.digest_send_log
FOR SELECT
USING (
  family_id IN (
    SELECT family_id FROM public.members 
    WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "System can create digest send log entries"
ON public.digest_send_log
FOR INSERT
WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_digest_content_cache_family_week ON public.digest_content_cache(family_id, digest_week);
CREATE INDEX IF NOT EXISTS idx_digest_content_cache_expires ON public.digest_content_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_digest_send_log_family_week ON public.digest_send_log(family_id, digest_week);
CREATE INDEX IF NOT EXISTS idx_weekly_digest_settings_family ON public.weekly_digest_settings(family_id);

-- Create function to check digest unlock status
CREATE OR REPLACE FUNCTION public.check_digest_unlock_status(p_family_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_count integer;
  settings_threshold integer;
BEGIN
  -- Get member count
  SELECT COUNT(*) INTO member_count
  FROM public.members
  WHERE family_id = p_family_id;
  
  -- Get unlock threshold from settings
  SELECT COALESCE(unlock_threshold, 2) INTO settings_threshold
  FROM public.weekly_digest_settings
  WHERE family_id = p_family_id;
  
  -- Return true if member count meets threshold
  RETURN member_count >= settings_threshold;
END;
$$;

-- Create function to generate digest preview
CREATE OR REPLACE FUNCTION public.generate_digest_preview(p_family_id uuid, p_preview_date date DEFAULT CURRENT_DATE)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  preview_data jsonb := '{}'::jsonb;
  story_count integer;
  photo_count integer;
  comment_count integer;
  birthday_count integer;
BEGIN
  -- Get story count from the past week
  SELECT COUNT(*) INTO story_count
  FROM public.stories
  WHERE family_id = p_family_id 
    AND created_at >= (p_preview_date - interval '7 days')
    AND created_at < p_preview_date;
  
  -- Get photo count from the past week
  SELECT COUNT(*) INTO photo_count
  FROM public.media
  WHERE family_id = p_family_id 
    AND mime_type LIKE 'image/%'
    AND created_at >= (p_preview_date - interval '7 days')
    AND created_at < p_preview_date;
  
  -- Get comment count from the past week
  SELECT COUNT(*) INTO comment_count
  FROM public.comments
  WHERE family_id = p_family_id 
    AND created_at >= (p_preview_date - interval '7 days')
    AND created_at < p_preview_date;
  
  -- Get upcoming birthdays (next 7 days)
  SELECT COUNT(*) INTO birthday_count
  FROM public.people
  WHERE family_id = p_family_id 
    AND birth_date IS NOT NULL
    AND EXTRACT(DOY FROM birth_date) BETWEEN 
        EXTRACT(DOY FROM p_preview_date) AND 
        EXTRACT(DOY FROM p_preview_date + interval '7 days');
  
  -- Build preview data
  preview_data := jsonb_build_object(
    'stories', story_count,
    'photos', photo_count,
    'comments', comment_count,
    'birthdays', birthday_count,
    'generated_at', now(),
    'preview_date', p_preview_date
  );
  
  RETURN preview_data;
END;
$$;