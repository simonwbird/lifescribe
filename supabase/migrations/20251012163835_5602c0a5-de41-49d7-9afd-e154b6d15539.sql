-- Security Fix Migration: Address Critical Security Issues
-- Fixes: super_admin in profiles.settings, missing search_path, guest_sessions exposure

-- ==========================================
-- 1. CREATE USER ROLES TABLE (Fix: CLIENT_SIDE_AUTH)
-- ==========================================

-- Create app_role enum if not exists
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'moderator', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES auth.users(id),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role, family_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(user_id, role) WHERE revoked_at IS NULL;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Migrate existing super_admins from profiles.settings to user_roles
INSERT INTO public.user_roles (user_id, role, granted_at)
SELECT 
  id as user_id,
  'super_admin'::app_role as role,
  created_at as granted_at
FROM public.profiles
WHERE settings->>'role' = 'super_admin'
ON CONFLICT (user_id, role, family_id) DO NOTHING;

-- ==========================================
-- 2. UPDATE is_super_admin FUNCTION (Fix: CLIENT_SIDE_AUTH)
-- ==========================================

-- Update the is_super_admin function to use user_roles table
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'::app_role
      AND revoked_at IS NULL
  );
$$;

-- Create helper function to check any role
CREATE OR REPLACE FUNCTION public.has_app_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND revoked_at IS NULL
  );
$$;

-- ==========================================
-- 3. FIX GUEST_SESSIONS RLS (Fix: PUBLIC_USER_DATA)
-- ==========================================

-- Drop the insecure policy that allows anyone to read guest sessions
DROP POLICY IF EXISTS "Anyone can read guest sessions" ON public.guest_sessions;
DROP POLICY IF EXISTS "Anyone can view active guest sessions" ON public.guest_sessions;

-- Create secure policy: only allow authenticated family members to view guest sessions
CREATE POLICY "Family members can view guest sessions"
ON public.guest_sessions
FOR SELECT
TO authenticated
USING (
  family_id IN (
    SELECT family_id FROM public.members WHERE profile_id = auth.uid()
  )
);

-- Allow guest sessions to be created by system (edge functions)
CREATE POLICY "System can create guest sessions"
ON public.guest_sessions
FOR INSERT
WITH CHECK (true);

-- Allow guest sessions to update their own last activity
CREATE POLICY "Guest sessions can update last activity"
ON public.guest_sessions
FOR UPDATE
USING (true)
WITH CHECK (true);

-- ==========================================
-- 4. FIX SECURITY DEFINER FUNCTIONS (Fix: DEFINER_OR_RPC_BYPASS)
-- ==========================================

-- Fix functions that are missing SET search_path
-- These are the critical SECURITY DEFINER functions from the db-functions list

CREATE OR REPLACE FUNCTION public.update_tree_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_weekly_digest_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_person_role(p_user_id uuid, p_person_id uuid, p_role person_role_type)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.person_roles
    WHERE profile_id = p_user_id
      AND person_id = p_person_id
      AND role = p_role
      AND revoked_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.create_queue_item_from_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.moderation_queue_items (
    flag_id,
    family_id,
    item_type,
    item_id,
    priority,
    sla_due_at
  ) VALUES (
    NEW.id,
    NEW.family_id,
    NEW.item_type,
    NEW.item_id,
    NEW.severity,
    now() + interval '24 hours'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_verify_provisional_family()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

CREATE OR REPLACE FUNCTION public.verify_expired_provisional_families()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.approve_guestbook_entry(p_entry_id uuid, p_moderator_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.guestbook_entries
  SET 
    status = 'approved',
    moderated_by = p_moderator_id,
    moderated_at = now()
  WHERE id = p_entry_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_magic_link_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_prompt_instance_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

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

CREATE OR REPLACE FUNCTION public.generate_event_join_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  exists_check INT;
BEGIN
  LOOP
    code := UPPER(substring(md5(random()::text) from 1 for 6));
    
    SELECT COUNT(*) INTO exists_check 
    FROM public.event_join_codes 
    WHERE join_code = code AND is_active = true;
    
    EXIT WHEN exists_check = 0;
  END LOOP;
  
  RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id uuid,
  p_family_id uuid,
  p_action text,
  p_details jsonb DEFAULT '{}'::jsonb,
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

-- ==========================================
-- 5. RLS POLICIES FOR USER_ROLES TABLE
-- ==========================================

-- Super admins can view all user roles
CREATE POLICY "Super admins can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  public.has_app_role(auth.uid(), 'super_admin'::app_role)
);

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Family admins can view roles within their family
CREATE POLICY "Family admins can view family roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  family_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.members
    WHERE profile_id = auth.uid()
    AND members.family_id = user_roles.family_id
    AND role = 'admin'
  )
);

-- Only super admins can insert/update/delete roles
CREATE POLICY "Super admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  public.has_app_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  public.has_app_role(auth.uid(), 'super_admin'::app_role)
);

-- Create audit trigger for user_roles changes
CREATE OR REPLACE FUNCTION public.audit_user_roles_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      p_actor_id := auth.uid(),
      p_action := 'ROLE_GRANTED',
      p_entity_type := 'user_role',
      p_entity_id := NEW.id,
      p_family_id := NEW.family_id,
      p_details := jsonb_build_object(
        'user_id', NEW.user_id,
        'role', NEW.role,
        'granted_by', NEW.granted_by
      ),
      p_risk_score := 20
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.revoked_at IS NOT NULL AND OLD.revoked_at IS NULL THEN
    PERFORM log_audit_event(
      p_actor_id := auth.uid(),
      p_action := 'ROLE_REVOKED',
      p_entity_type := 'user_role',
      p_entity_id := NEW.id,
      p_family_id := NEW.family_id,
      p_details := jsonb_build_object(
        'user_id', NEW.user_id,
        'role', NEW.role,
        'revoked_by', NEW.revoked_by
      ),
      p_risk_score := 20
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_user_roles_trigger
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.audit_user_roles_changes();

-- ==========================================
-- COMMENTS FOR DOCUMENTATION
-- ==========================================

COMMENT ON TABLE public.user_roles IS 'Secure storage for user roles, separated from profiles table to prevent client-side manipulation';
COMMENT ON FUNCTION public.is_super_admin IS 'Security definer function to check super admin status - always use this instead of checking profiles.settings';
COMMENT ON FUNCTION public.has_app_role IS 'Security definer function to check any application role';
COMMENT ON POLICY "Family members can view guest sessions" ON public.guest_sessions IS 'Restricts guest session data to authenticated family members only';