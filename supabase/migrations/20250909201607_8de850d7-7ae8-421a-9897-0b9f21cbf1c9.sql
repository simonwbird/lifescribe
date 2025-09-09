-- Force refresh of RLS policies for families table
ALTER TABLE public.families DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- Drop and recreate the INSERT policy to force refresh
DROP POLICY IF EXISTS "families_insert_policy" ON public.families;

-- Create a very simple insert policy 
CREATE POLICY "families_insert_policy" 
ON public.families FOR INSERT 
WITH CHECK (created_by = auth.uid());

-- Also make sure we grant the necessary permissions
GRANT INSERT ON public.families TO authenticated;
GRANT SELECT ON public.families TO authenticated;