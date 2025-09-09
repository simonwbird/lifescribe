-- Fix infinite recursion in members table policies
-- Drop the problematic policies first
DROP POLICY IF EXISTS "Family members can view members" ON public.members;
DROP POLICY IF EXISTS "Family admins can manage members" ON public.members;
DROP POLICY IF EXISTS "Users can join families" ON public.members;

-- Create a security definer function to get user's family memberships
-- This bypasses RLS to avoid recursion
CREATE OR REPLACE FUNCTION public.get_user_family_ids(user_id uuid)
RETURNS uuid[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT family_id 
    FROM public.members 
    WHERE profile_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create new policies using the security definer function
CREATE POLICY "Users can view members of their families" 
ON public.members FOR SELECT 
USING (family_id = ANY(public.get_user_family_ids(auth.uid())));

CREATE POLICY "Users can insert themselves into families" 
ON public.members FOR INSERT 
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Family admins can update member roles" 
ON public.members FOR UPDATE 
USING (
  family_id = ANY(public.get_user_family_ids(auth.uid())) 
  AND EXISTS (
    SELECT 1 FROM public.members m 
    WHERE m.profile_id = auth.uid() 
    AND m.family_id = members.family_id 
    AND m.role = 'admin'
  )
);

CREATE POLICY "Family admins can delete members" 
ON public.members FOR DELETE 
USING (
  family_id = ANY(public.get_user_family_ids(auth.uid())) 
  AND EXISTS (
    SELECT 1 FROM public.members m 
    WHERE m.profile_id = auth.uid() 
    AND m.family_id = members.family_id 
    AND m.role = 'admin'
  )
);