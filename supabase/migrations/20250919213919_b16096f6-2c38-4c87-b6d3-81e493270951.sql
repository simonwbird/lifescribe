-- Fix RLS infinite recursion for profiles by using a SECURITY DEFINER helper

-- 1) Drop the recursive policy if it exists
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

-- 2) Create a helper function that safely checks super admin role
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = _user_id
      AND p.settings->>'role' = 'super_admin'
  );
$$;

-- 3) Recreate the policy using the helper function (no self-references in the policy)
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  public.is_super_admin(auth.uid())
);
