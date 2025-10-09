-- Create event join codes table
CREATE TABLE IF NOT EXISTS public.event_join_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  family_id UUID NOT NULL,
  join_code TEXT NOT NULL UNIQUE,
  qr_data TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Create event ACL (access control list) table for role-based permissions
CREATE TABLE IF NOT EXISTS public.event_acl (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  user_id UUID,
  guest_session_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('contributor', 'viewer', 'guest')),
  family_id UUID NOT NULL,
  granted_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, user_id),
  UNIQUE(event_id, guest_session_id)
);

-- Create guest sessions table for temporary access
CREATE TABLE IF NOT EXISTS public.guest_sessions (
  id TEXT PRIMARY KEY,
  event_id UUID NOT NULL,
  family_id UUID NOT NULL,
  guest_name TEXT,
  guest_email TEXT,
  created_via_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_join_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_acl ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_join_codes
CREATE POLICY "Family members can view join codes"
  ON public.event_join_codes FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create join codes"
  ON public.event_join_codes FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM members WHERE profile_id = auth.uid()
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Code creators can update their codes"
  ON public.event_join_codes FOR UPDATE
  USING (created_by = auth.uid());

-- RLS Policies for event_acl
CREATE POLICY "Users can view their own event permissions"
  ON public.event_acl FOR SELECT
  USING (user_id = auth.uid() OR guest_session_id IS NOT NULL);

CREATE POLICY "Family members can manage event ACL"
  ON public.event_acl FOR ALL
  USING (
    family_id IN (
      SELECT family_id FROM members WHERE profile_id = auth.uid()
    )
  );

-- RLS Policies for guest_sessions
CREATE POLICY "Anyone can view active guest sessions"
  ON public.guest_sessions FOR SELECT
  USING (expires_at > now());

CREATE POLICY "System can create guest sessions"
  ON public.guest_sessions FOR INSERT
  WITH CHECK (true);

-- Function to generate 6-digit join code
CREATE OR REPLACE FUNCTION generate_event_join_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check INT;
BEGIN
  LOOP
    -- Generate 6-digit alphanumeric code (uppercase for readability)
    code := UPPER(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code already exists
    SELECT COUNT(*) INTO exists_check 
    FROM public.event_join_codes 
    WHERE join_code = code AND is_active = true;
    
    EXIT WHEN exists_check = 0;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to validate and use join code
CREATE OR REPLACE FUNCTION use_event_join_code(p_code TEXT, p_guest_session_id TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  code_record RECORD;
  result JSONB;
BEGIN
  -- Get the join code record
  SELECT * INTO code_record
  FROM public.event_join_codes
  WHERE join_code = p_code
    AND is_active = true
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired join code'
    );
  END IF;
  
  -- Check max uses
  IF code_record.max_uses IS NOT NULL AND code_record.current_uses >= code_record.max_uses THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This join code has reached its maximum uses'
    );
  END IF;
  
  -- Increment use count
  UPDATE public.event_join_codes
  SET current_uses = current_uses + 1
  WHERE id = code_record.id;
  
  -- Return event and family information
  RETURN jsonb_build_object(
    'success', true,
    'event_id', code_record.event_id,
    'family_id', code_record.family_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update event_acl updated_at
CREATE OR REPLACE FUNCTION update_event_acl_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER event_acl_updated_at
  BEFORE UPDATE ON public.event_acl
  FOR EACH ROW
  EXECUTE FUNCTION update_event_acl_updated_at();