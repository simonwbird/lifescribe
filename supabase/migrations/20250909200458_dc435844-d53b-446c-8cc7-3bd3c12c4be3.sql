-- First, drop ALL existing policies on members table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'members' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.members';
    END LOOP;
END $$;

-- Create a security definer function to get user's family memberships safely
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

-- Create new, safer policies
CREATE POLICY "members_select_policy" 
ON public.members FOR SELECT 
USING (family_id = ANY(public.get_user_family_ids(auth.uid())));

CREATE POLICY "members_insert_policy" 
ON public.members FOR INSERT 
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "members_update_admin_policy" 
ON public.members FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.members m 
    WHERE m.profile_id = auth.uid() 
    AND m.family_id = members.family_id 
    AND m.role = 'admin'
  )
);

CREATE POLICY "members_delete_admin_policy" 
ON public.members FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.members m 
    WHERE m.profile_id = auth.uid() 
    AND m.family_id = members.family_id 
    AND m.role = 'admin'
  )
);