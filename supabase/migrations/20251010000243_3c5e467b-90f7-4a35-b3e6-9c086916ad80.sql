-- Create a view to show current user's family memberships and roles
CREATE OR REPLACE VIEW public.v_my_roles AS
SELECT
  f.id AS family_id,
  f.name AS family_name,
  m.role,
  m.joined_at
FROM public.members m
JOIN public.families f ON f.id = m.family_id
WHERE m.profile_id = auth.uid();

-- Enable RLS on the view (it's safe because it uses auth.uid())
ALTER VIEW public.v_my_roles SET (security_invoker = true);

-- Grant access to authenticated users
GRANT SELECT ON public.v_my_roles TO authenticated;

-- Verify and update RLS policies for members table
-- Policy: Members can view their own memberships and other members in their families
DROP POLICY IF EXISTS "Members can view family memberships" ON public.members;
CREATE POLICY "Members can view family memberships" ON public.members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.family_id = members.family_id
        AND m.profile_id = auth.uid()
    )
  );

-- Policy: Users can insert themselves as members when accepting invites
DROP POLICY IF EXISTS "Users can join families via invite" ON public.members;
CREATE POLICY "Users can join families via invite" ON public.members
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

-- Policy: Admins can update member roles
DROP POLICY IF EXISTS "Admins can update member roles" ON public.members;
CREATE POLICY "Admins can update member roles" ON public.members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.family_id = members.family_id
        AND m.profile_id = auth.uid()
        AND m.role = 'admin'
    )
  );

-- Policy: Admins can delete members (but not themselves)
DROP POLICY IF EXISTS "Admins can remove members" ON public.members;
CREATE POLICY "Admins can remove members" ON public.members
  FOR DELETE
  USING (
    members.profile_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.family_id = members.family_id
        AND m.profile_id = auth.uid()
        AND m.role = 'admin'
    )
  );

-- Verify RLS policies for invites table
-- Policy: Family members can view invites for their families
DROP POLICY IF EXISTS "Family members can view invites" ON public.invites;
CREATE POLICY "Family members can view invites" ON public.invites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.family_id = invites.family_id
        AND m.profile_id = auth.uid()
    )
  );

-- Policy: Only admins can create invites
DROP POLICY IF EXISTS "Admins can create invites" ON public.invites;
CREATE POLICY "Admins can create invites" ON public.invites
  FOR INSERT
  WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.family_id = invites.family_id
        AND m.profile_id = auth.uid()
        AND m.role = 'admin'
    )
  );

-- Policy: Admins can update invites (to revoke, etc.)
DROP POLICY IF EXISTS "Admins can update invites" ON public.invites;
CREATE POLICY "Admins can update invites" ON public.invites
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.family_id = invites.family_id
        AND m.profile_id = auth.uid()
        AND m.role = 'admin'
    )
  );

-- Policy: Anyone can accept an invite with valid token
DROP POLICY IF EXISTS "Users can accept invites for their email" ON public.invites;
CREATE POLICY "Users can accept invites for their email" ON public.invites
  FOR UPDATE
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending'
    AND expires_at > now()
  );