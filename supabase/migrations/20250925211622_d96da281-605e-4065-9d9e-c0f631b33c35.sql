-- Create table for tracking authentication rate limits
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_key text NOT NULL, -- email:ip composite key
  email text NOT NULL,
  ip_address inet,
  user_agent text,
  attempted_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_tracking_key ON public.auth_rate_limits(tracking_key);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_attempted_at ON public.auth_rate_limits(attempted_at);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_email ON public.auth_rate_limits(email);

-- Enable RLS
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for system access (edge functions can manage this table)
CREATE POLICY "System can manage rate limits" ON public.auth_rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Function to clean up old rate limit records (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_auth_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.auth_rate_limits
  WHERE attempted_at < (now() - interval '24 hours');
END;
$$;

-- Function to check if user is currently locked out
CREATE OR REPLACE FUNCTION public.is_user_locked_out(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lockout_time timestamp with time zone;
BEGIN
  SELECT locked_until INTO lockout_time
  FROM public.profiles
  WHERE email = p_email;
  
  RETURN lockout_time IS NOT NULL AND lockout_time > now();
END;
$$;

-- Function to unlock a user (for admin use)
CREATE OR REPLACE FUNCTION public.unlock_user(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tracking_key_pattern text;
BEGIN
  -- Clear the lockout
  UPDATE public.profiles
  SET locked_until = NULL,
      updated_at = now()
  WHERE email = p_email;
  
  -- Clear rate limit records for this email
  DELETE FROM public.auth_rate_limits
  WHERE email = p_email;
  
  RETURN true;
END;
$$;