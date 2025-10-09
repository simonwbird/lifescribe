-- Security Fix: Ensure profiles table is only accessible to authenticated users
-- Drop redundant and potentially confusing policies
DROP POLICY IF EXISTS "profiles_own_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_update" ON public.profiles;
DROP POLICY IF EXISTS "secure_profiles_self_access_2024" ON public.profiles;

-- Recreate clean, secure policies with explicit authentication checks
-- Policy 1: Users can only view their own profile (authenticated users only)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid() AND auth.uid() IS NOT NULL);

-- Policy 2: Super admins can view all profiles (authenticated super admins only)
DROP POLICY IF EXISTS "Super admins can view profiles" ON public.profiles;
CREATE POLICY "Super admins can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()) AND auth.uid() IS NOT NULL);

-- Policy 3: Users can only update their own profile (authenticated users only)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid() AND auth.uid() IS NOT NULL)
WITH CHECK (id = auth.uid() AND auth.uid() IS NOT NULL);

-- Policy 4: Users can only insert their own profile (authenticated users only)
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid() AND auth.uid() IS NOT NULL);

-- Policy 5: Users can only delete their own profile (authenticated users only)
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (id = auth.uid() AND auth.uid() IS NOT NULL);

-- Add comment explaining the security model
COMMENT ON TABLE public.profiles IS 'User profile data - RLS enforced. Only authenticated users can access their own profile data. Super admins can view all profiles for moderation purposes.';

-- Verify RLS is enabled (should already be, but double-check)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owner (defense in depth)
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;