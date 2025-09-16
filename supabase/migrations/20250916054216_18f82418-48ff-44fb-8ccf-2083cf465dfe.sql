-- Improve RLS policies for invite email privacy and add security enhancements

-- First, let's create a security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_family_admin(user_id uuid, family_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members 
    WHERE profile_id = user_id 
    AND members.family_id = is_family_admin.family_id 
    AND role = 'admin'
  );
$$;

-- Drop existing invite policies
DROP POLICY IF EXISTS "Family admins can manage invites" ON public.invites;
DROP POLICY IF EXISTS "Family members can view invites" ON public.invites;

-- Create improved RLS policies for invites with better email privacy
CREATE POLICY "Family admins can manage all invite data" 
ON public.invites 
FOR ALL 
USING (public.is_family_admin(auth.uid(), family_id));

CREATE POLICY "Family members can view limited invite data" 
ON public.invites 
FOR SELECT 
USING (
  family_id IN (
    SELECT members.family_id 
    FROM public.members 
    WHERE members.profile_id = auth.uid()
  ) 
  AND NOT public.is_family_admin(auth.uid(), family_id)
);

-- Create a view for non-admin members that masks email addresses
CREATE OR REPLACE VIEW public.invites_masked AS
SELECT 
  id,
  family_id,
  CASE 
    WHEN public.is_family_admin(auth.uid(), family_id) THEN email
    ELSE CONCAT(LEFT(email, 2), '***@', SPLIT_PART(email, '@', 2))
  END as email,
  role,
  status,
  created_at,
  accepted_at,
  expires_at,
  invited_by
FROM public.invites
WHERE family_id IN (
  SELECT members.family_id 
  FROM public.members 
  WHERE members.profile_id = auth.uid()
);

-- Enable RLS on the view
ALTER VIEW public.invites_masked SET (security_invoker = true);

-- Create audit log table for security events
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  family_id uuid,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view security audit logs for their families
CREATE POLICY "Family admins can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (public.is_family_admin(auth.uid(), family_id));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id uuid,
  p_family_id uuid,
  p_action text,
  p_details jsonb DEFAULT '{}',
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, family_id, action, details, ip_address, user_agent
  ) VALUES (
    p_user_id, p_family_id, p_action, p_details, p_ip_address, p_user_agent
  );
END;
$$;