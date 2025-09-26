-- Drop existing functions to allow recreation with correct signatures
DROP FUNCTION IF EXISTS public.get_family_invites_masked(uuid);
DROP FUNCTION IF EXISTS public.get_all_family_invites_masked();

-- Drop the invites_masked view entirely to prevent any direct access
DROP VIEW IF EXISTS public.invites_masked CASCADE;

-- Create a comprehensive secure RPC for accessing invitation data
-- This replaces the invites_masked view with controlled access
CREATE OR REPLACE FUNCTION public.get_family_invites_masked(p_family_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  role public.role_type,
  status text,
  created_at timestamptz,
  expires_at timestamptz,
  invited_by uuid,
  accepted_at timestamptz,
  family_id uuid
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    i.id,
    -- Mask email addresses for privacy
    CASE 
      WHEN position('@' in i.email) > 1 THEN
        substring(i.email from 1 for 1) || '***' || substring(i.email from position('@' in i.email))
      ELSE '***'
    END AS email,
    i.role,
    i.status,
    i.created_at,
    i.expires_at,
    i.invited_by,
    i.accepted_at,
    i.family_id
  FROM public.invites i
  WHERE i.family_id = p_family_id
    -- Security: Only return invites for families where the caller is a member
    AND i.family_id IN (
      SELECT m.family_id 
      FROM public.members m 
      WHERE m.profile_id = auth.uid()
    )
  ORDER BY i.created_at DESC;
$$;

-- Create an additional function for admin access to all invites (if needed)
CREATE OR REPLACE FUNCTION public.get_all_family_invites_masked()
RETURNS TABLE (
  id uuid,
  email text,
  role public.role_type,
  status text,
  created_at timestamptz,
  expires_at timestamptz,
  invited_by uuid,
  accepted_at timestamptz,
  family_id uuid
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    i.id,
    -- Mask email addresses for privacy
    CASE 
      WHEN position('@' in i.email) > 1 THEN
        substring(i.email from 1 for 1) || '***' || substring(i.email from position('@' in i.email))
      ELSE '***'
    END AS email,
    i.role,
    i.status,
    i.created_at,
    i.expires_at,
    i.invited_by,
    i.accepted_at,
    i.family_id
  FROM public.invites i
  WHERE i.family_id IN (
    SELECT m.family_id 
    FROM public.members m 
    WHERE m.profile_id = auth.uid()
  )
  ORDER BY i.created_at DESC;
$$;

-- Grant permissions to authenticated users only
GRANT EXECUTE ON FUNCTION public.get_family_invites_masked(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_family_invites_masked() TO authenticated;

-- Add security comments
COMMENT ON FUNCTION public.get_family_invites_masked IS 'Secure access to masked invitation data for a specific family - requires family membership';
COMMENT ON FUNCTION public.get_all_family_invites_masked IS 'Secure access to masked invitation data for all families the user belongs to';