-- Re-enable RLS and create a simple working policy
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DROP POLICY IF EXISTS "families_select_policy" ON public.families;
DROP POLICY IF EXISTS "families_insert_policy" ON public.families;
DROP POLICY IF EXISTS "families_update_policy" ON public.families;
DROP POLICY IF EXISTS "families_delete_policy" ON public.families;

-- Create simple working policies
CREATE POLICY "families_select_policy" 
ON public.families FOR SELECT 
USING (
  created_by = auth.uid() OR 
  id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid())
);

CREATE POLICY "families_insert_policy" 
ON public.families FOR INSERT 
WITH CHECK (created_by = auth.uid());

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

CREATE POLICY "families_delete_policy" 
ON public.families FOR DELETE 
USING (created_by = auth.uid());