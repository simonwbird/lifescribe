-- Create a secure function to get user auth metadata including last sign in
CREATE OR REPLACE FUNCTION public.get_user_auth_metadata(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'last_sign_in_at', au.last_sign_in_at,
    'created_at', au.created_at,
    'email_confirmed_at', au.email_confirmed_at
  )
  FROM auth.users au
  WHERE au.id = p_user_id;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_auth_metadata(uuid) TO authenticated;

-- Create a function specifically for admins to view multiple users' auth data
CREATE OR REPLACE FUNCTION public.get_users_auth_metadata_admin()
RETURNS TABLE (
  user_id uuid,
  last_sign_in_at timestamp with time zone,
  created_at timestamp with time zone,
  email_confirmed_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the calling user is a super admin
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can access this function';
  END IF;

  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.last_sign_in_at,
    au.created_at,
    au.email_confirmed_at
  FROM auth.users au;
END;
$$;

-- Grant execute permission to authenticated users (function checks role internally)
GRANT EXECUTE ON FUNCTION public.get_users_auth_metadata_admin() TO authenticated;