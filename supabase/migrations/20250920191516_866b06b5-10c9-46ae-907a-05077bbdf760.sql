-- Add provisional status and verification support to families table
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'provisional')),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

-- Create families preflight edge function table for tracking preflight checks
CREATE TABLE IF NOT EXISTS public.families_preflight_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_slug TEXT NOT NULL,
  hashed_signals JSONB NOT NULL DEFAULT '{}',
  risk_level TEXT NOT NULL CHECK (risk_level IN ('none', 'possible', 'high')),
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  requester_ip INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.families_preflight_log ENABLE ROW LEVEL SECURITY;

-- Create policy for preflight log (system only)
CREATE POLICY "System can manage preflight log" 
ON public.families_preflight_log 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create function to auto-verify provisional families
CREATE OR REPLACE FUNCTION public.auto_verify_provisional_family()
RETURNS TRIGGER AS $$
BEGIN
  -- If a second member is joining a provisional family, verify it
  IF TG_OP = 'INSERT' THEN
    UPDATE public.families
    SET status = 'active', verified_at = now()
    WHERE id = NEW.family_id 
      AND status = 'provisional'
      AND verified_at IS NULL
      AND (
        SELECT COUNT(*) FROM public.members 
        WHERE family_id = NEW.family_id
      ) >= 2;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-verification
CREATE TRIGGER auto_verify_on_second_member
  AFTER INSERT ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_verify_provisional_family();

-- Create function for time-based verification (to be called by scheduled job)
CREATE OR REPLACE FUNCTION public.verify_expired_provisional_families()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.families
  SET status = 'active', verified_at = now()
  WHERE status = 'provisional'
    AND verified_at IS NULL
    AND created_at < (now() - interval '7 days');
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;