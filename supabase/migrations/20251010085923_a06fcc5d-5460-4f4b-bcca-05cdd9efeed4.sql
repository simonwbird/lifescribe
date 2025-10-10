-- Create magic_links table for guest access
CREATE TABLE IF NOT EXISTS public.magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  role_scope TEXT NOT NULL CHECK (role_scope IN ('read-only', 'read-react', 'read-comment')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  max_uses INTEGER NOT NULL DEFAULT 1 CHECK (max_uses >= 1 AND max_uses <= 10),
  current_uses INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON public.magic_links(token) WHERE revoked = false;
CREATE INDEX IF NOT EXISTS idx_magic_links_family ON public.magic_links(family_id);

-- Enable RLS
ALTER TABLE public.magic_links ENABLE ROW LEVEL SECURITY;

-- Family admins can manage magic links
CREATE POLICY "Family admins can manage magic links"
ON public.magic_links
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.members 
    WHERE profile_id = auth.uid() 
    AND family_id = magic_links.family_id 
    AND role = 'admin'
  )
);

-- Drop existing guest_sessions if it exists
DROP TABLE IF EXISTS public.guest_sessions CASCADE;

-- Create guest_sessions table fresh
CREATE TABLE public.guest_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  magic_link_id UUID NOT NULL REFERENCES public.magic_links(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  role_scope TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_guest_sessions_token ON public.guest_sessions(session_token);
CREATE INDEX idx_guest_sessions_family ON public.guest_sessions(family_id);

ALTER TABLE public.guest_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read guest sessions (validated via token in app)
CREATE POLICY "Anyone can read guest sessions"
ON public.guest_sessions
FOR SELECT
USING (true);

-- Log audit events for magic links
CREATE OR REPLACE FUNCTION log_magic_link_event()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      p_actor_id := NEW.created_by,
      p_action := 'INVITE_LINK_CREATED',
      p_entity_type := 'magic_link',
      p_entity_id := NEW.id,
      p_family_id := NEW.family_id,
      p_details := jsonb_build_object(
        'role_scope', NEW.role_scope,
        'max_uses', NEW.max_uses,
        'expires_at', NEW.expires_at
      ),
      p_risk_score := 5
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.revoked = true AND OLD.revoked = false THEN
    PERFORM log_audit_event(
      p_actor_id := NEW.revoked_by,
      p_action := 'INVITE_LINK_REVOKED',
      p_entity_type := 'magic_link',
      p_entity_id := NEW.id,
      p_family_id := NEW.family_id,
      p_details := jsonb_build_object(
        'role_scope', NEW.role_scope,
        'uses', NEW.current_uses
      ),
      p_risk_score := 3
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER magic_link_audit_trigger
AFTER INSERT OR UPDATE ON public.magic_links
FOR EACH ROW
EXECUTE FUNCTION log_magic_link_event();