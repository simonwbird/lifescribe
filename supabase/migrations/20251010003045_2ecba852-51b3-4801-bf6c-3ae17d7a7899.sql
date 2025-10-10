-- Fix infinite recursion in members RLS policies
-- Drop problematic policies that reference members table within members policies

DROP POLICY IF EXISTS "Members can view family memberships" ON public.members;
DROP POLICY IF EXISTS "Users can join families via invite" ON public.members;
DROP POLICY IF EXISTS "Admins can update member roles" ON public.members;
DROP POLICY IF EXISTS "Admins can remove members" ON public.members;

-- Recreate policies without circular references
-- Policy 1: Users can view their own membership record directly
CREATE POLICY "Users can view own membership"
ON public.members
FOR SELECT
USING (profile_id = auth.uid());

-- Policy 2: Users can insert themselves when accepting invites (no circular reference)
CREATE POLICY "Users can join via valid invite"
ON public.members
FOR INSERT
WITH CHECK (
  profile_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.invites i
    WHERE i.family_id = members.family_id
    AND i.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND i.status = 'pending'
    AND i.expires_at > now()
  )
);

-- Policy 3: Admins can update roles (using is_family_admin function to avoid recursion)
CREATE POLICY "Family admins can update roles"
ON public.members
FOR UPDATE
USING (is_family_admin(auth.uid(), family_id));

-- Policy 4: Admins can remove members (but not themselves)
CREATE POLICY "Family admins can remove members"
ON public.members
FOR DELETE
USING (
  is_family_admin(auth.uid(), family_id)
  AND profile_id != auth.uid()
);