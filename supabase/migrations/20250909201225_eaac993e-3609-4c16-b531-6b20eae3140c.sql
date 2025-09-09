-- Simple fix: just update the families INSERT policy
DROP POLICY IF EXISTS "families_insert_policy" ON public.families;

-- Create a simple insert policy that allows authenticated users to create families
CREATE POLICY "families_insert_new" 
ON public.families FOR INSERT 
WITH CHECK (created_by = auth.uid());