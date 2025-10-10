-- Create helper function to grant owner access to person pages
-- This is useful for development and testing

CREATE OR REPLACE FUNCTION grant_person_owner_access(
  p_person_id UUID,
  p_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  permission_id UUID;
BEGIN
  -- Insert or update permission
  INSERT INTO public.person_page_permissions (
    person_id,
    user_id,
    role,
    granted_by
  ) VALUES (
    p_person_id,
    p_user_id,
    'owner',
    p_user_id
  )
  ON CONFLICT (person_id, user_id) 
  DO UPDATE SET 
    role = 'owner',
    granted_by = EXCLUDED.granted_by,
    updated_at = now()
  RETURNING id INTO permission_id;
  
  RETURN permission_id;
END;
$$;

COMMENT ON FUNCTION grant_person_owner_access IS 'Helper function for granting owner access to person pages. Usage: SELECT grant_person_owner_access(person_id, user_id);';