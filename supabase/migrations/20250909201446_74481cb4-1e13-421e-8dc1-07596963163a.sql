-- Comprehensive fix for families RLS policies
-- First ensure RLS is enabled
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "families_select_policy" ON public.families;
DROP POLICY IF EXISTS "families_insert_policy" ON public.families;  
DROP POLICY IF EXISTS "families_insert_new" ON public.families;
DROP POLICY IF EXISTS "families_update_policy" ON public.families;
DROP POLICY IF EXISTS "families_delete_policy" ON public.families;

-- Create new working policies
-- Allow users to see families they are members of
CREATE POLICY "families_select_policy" 
ON public.families FOR SELECT 
USING (id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid()));

-- Allow any authenticated user to create families (they become the creator)
CREATE POLICY "families_insert_policy" 
ON public.families FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- Allow family creators and admins to update families
CREATE POLICY "families_update_policy" 
ON public.families FOR UPDATE 
USING (
  created_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.members 
    WHERE family_id = families.id 
    AND profile_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow only family creators to delete families
CREATE POLICY "families_delete_policy" 
ON public.families FOR DELETE 
USING (created_by = auth.uid());