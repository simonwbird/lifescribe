-- Fix families table RLS policy for creation
-- First, drop existing policies on families table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'families' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.families';
    END LOOP;
END $$;

-- Create new, working policies for families table
CREATE POLICY "families_select_policy" 
ON public.families FOR SELECT 
USING (id = ANY(public.get_user_family_ids(auth.uid())));

CREATE POLICY "families_insert_policy" 
ON public.families FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "families_update_policy" 
ON public.families FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.members m 
    WHERE m.profile_id = auth.uid() 
    AND m.family_id = families.id 
    AND m.role = 'admin'
  )
);

CREATE POLICY "families_delete_policy" 
ON public.families FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.members m 
    WHERE m.profile_id = auth.uid() 
    AND m.family_id = families.id 
    AND m.role = 'admin'
  )
);