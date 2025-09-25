-- Phase 5: Enhanced Sharing & Permissions System

-- Update role_type enum to match the new role structure
ALTER TYPE role_type ADD VALUE IF NOT EXISTS 'viewer';
ALTER TYPE role_type ADD VALUE IF NOT EXISTS 'contributor';

-- Add new columns to invites table for better management
ALTER TABLE public.invites 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS accepted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS revoked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS revoked_by uuid,
ADD COLUMN IF NOT EXISTS revoke_reason text,
ADD COLUMN IF NOT EXISTS invite_method text DEFAULT 'email',
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Create index for better performance on invite queries
CREATE INDEX IF NOT EXISTS idx_invites_status ON public.invites(status);
CREATE INDEX IF NOT EXISTS idx_invites_family_status ON public.invites(family_id, status);

-- Create a function to validate email addresses
CREATE OR REPLACE FUNCTION public.validate_email(email_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN email_address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;

-- Create a function to get role permissions
CREATE OR REPLACE FUNCTION public.get_role_permissions(user_role role_type)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE user_role
    WHEN 'admin' THEN
      RETURN jsonb_build_object(
        'can_invite', true,
        'can_manage_family', true,
        'can_create_stories', true,
        'can_comment', true,
        'can_edit_own', true,
        'can_delete_own', true,
        'can_moderate', true
      );
    WHEN 'contributor' THEN
      RETURN jsonb_build_object(
        'can_invite', false,
        'can_manage_family', false,
        'can_create_stories', true,
        'can_comment', true,
        'can_edit_own', true,
        'can_delete_own', true,
        'can_moderate', false
      );
    WHEN 'member' THEN -- Legacy role, same as contributor
      RETURN jsonb_build_object(
        'can_invite', false,
        'can_manage_family', false,
        'can_create_stories', true,
        'can_comment', true,
        'can_edit_own', true,
        'can_delete_own', true,
        'can_moderate', false
      );
    WHEN 'viewer' THEN
      RETURN jsonb_build_object(
        'can_invite', false,
        'can_manage_family', false,
        'can_create_stories', false,
        'can_comment', true,
        'can_edit_own', false,
        'can_delete_own', false,
        'can_moderate', false
      );
    WHEN 'guest' THEN -- Legacy role, same as viewer
      RETURN jsonb_build_object(
        'can_invite', false,
        'can_manage_family', false,
        'can_create_stories', false,
        'can_comment', true,
        'can_edit_own', false,
        'can_delete_own', false,
        'can_moderate', false
      );
    ELSE
      RETURN jsonb_build_object();
  END CASE;
END;
$$;

-- Create function to revoke invite
CREATE OR REPLACE FUNCTION public.revoke_invite(p_invite_id uuid, p_revoked_by uuid, p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record public.invites%ROWTYPE;
  result jsonb;
BEGIN
  -- Get invite details
  SELECT * INTO invite_record FROM public.invites WHERE id = p_invite_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invite not found');
  END IF;

  -- Check if user has permission to revoke (must be admin of the family)
  IF NOT EXISTS (
    SELECT 1 FROM public.members 
    WHERE profile_id = p_revoked_by 
    AND family_id = invite_record.family_id 
    AND role = 'admin'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  -- Update invite to revoked status
  UPDATE public.invites
  SET 
    status = 'revoked',
    revoked_at = now(),
    revoked_by = p_revoked_by,
    revoke_reason = p_reason,
    updated_at = now()
  WHERE id = p_invite_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Invite revoked successfully',
    'revoked_at', now()
  );
END;
$$;

-- Create function to resend invite
CREATE OR REPLACE FUNCTION public.resend_invite(p_invite_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record public.invites%ROWTYPE;
  new_token text;
  new_expires_at timestamp with time zone;
BEGIN
  -- Get invite details
  SELECT * INTO invite_record FROM public.invites WHERE id = p_invite_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invite not found');
  END IF;

  -- Check if invite is still pending
  IF invite_record.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Can only resend pending invites');
  END IF;

  -- Generate new token and expiry
  new_token := encode(gen_random_bytes(32), 'hex');
  new_expires_at := now() + interval '7 days';

  -- Update invite with new token and expiry
  UPDATE public.invites
  SET 
    token = new_token,
    expires_at = new_expires_at,
    sent_at = now(),
    updated_at = now()
  WHERE id = p_invite_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Invite resent successfully',
    'token', new_token,
    'expires_at', new_expires_at
  );
END;
$$;