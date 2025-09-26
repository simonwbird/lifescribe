-- Strengthen access control for sensitive views by removing direct read access
-- and exposing least-privilege security-definer RPCs

-- 1) Lock down person_timeline_items view
DO $$
BEGIN
  -- Add security barrier to prevent predicate pushdown that could leak data
  BEGIN
    EXECUTE 'ALTER VIEW public.person_timeline_items SET (security_barrier = true)';
  EXCEPTION WHEN others THEN
    -- Ignore if not supported or view missing this option
    NULL;
  END;
  
  -- Revoke any direct access from app roles
  BEGIN
    EXECUTE 'REVOKE ALL ON TABLE public.person_timeline_items FROM PUBLIC, anon, authenticated';
  EXCEPTION WHEN undefined_table THEN
    NULL; -- View may not exist in some environments
  END;
END$$;

-- Ensure RPC exists (created previously) and grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_person_timeline_items(uuid) TO authenticated;

-- 2) Lock down invites_masked view and provide secure RPC
DO $$
BEGIN
  -- Add security barrier for the invites view as well
  BEGIN
    EXECUTE 'ALTER VIEW public.invites_masked SET (security_barrier = true)';
  EXCEPTION WHEN others THEN
    NULL;
  END;

  -- Revoke any direct access from app roles
  BEGIN
    EXECUTE 'REVOKE ALL ON TABLE public.invites_masked FROM PUBLIC, anon, authenticated';
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
END$$;

-- Secure RPC to fetch masked invites for a specific family that the caller belongs to
CREATE OR REPLACE FUNCTION public.get_family_invites_masked(p_family_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  role public.role_type,
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
    im.id,
    im.email,
    im.role,
    im.created_at,
    im.expires_at,
    im.invited_by,
    im.accepted_at,
    im.family_id
  FROM public.invites_masked im
  WHERE im.family_id = p_family_id
    AND im.family_id IN (
      SELECT m.family_id FROM public.members m WHERE m.profile_id = auth.uid()
    )
  ORDER BY im.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_family_invites_masked(uuid) TO authenticated;