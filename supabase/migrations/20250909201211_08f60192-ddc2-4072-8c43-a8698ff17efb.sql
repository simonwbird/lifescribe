-- Fix families RLS policy - remove circular dependency
-- Drop existing families policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'families' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.families';
    END LOOP;
END $$;

-- Create simple, working families policies without circular dependencies
-- Allow users to see families they created OR are members of
CREATE POLICY "families_select_simple" 
ON public.families FOR SELECT 
USING (
  created_by = auth.uid() 
  OR id IN (
    SELECT family_id FROM public.members 
    WHERE profile_id = auth.uid()
  )
);

-- Allow any authenticated user to create families (they become the creator)
CREATE POLICY "families_insert_simple" 
ON public.families FOR INSERT 
WITH CHECK (created_by = auth.uid());

-- Only family creators or admins can update families
CREATE POLICY "families_update_simple" 
ON public.families FOR UPDATE 
USING (
  created_by = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.members m 
    WHERE m.profile_id = auth.uid() 
    AND m.family_id = families.id 
    AND m.role = 'admin'
  )
);

-- Only family creators can delete families
CREATE POLICY "families_delete_simple" 
ON public.families FOR DELETE 
USING (created_by = auth.uid());