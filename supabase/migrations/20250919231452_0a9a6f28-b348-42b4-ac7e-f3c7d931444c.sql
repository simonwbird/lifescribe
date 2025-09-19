-- Fix security issue: Add RLS policies to invites_masked table
-- This table appears to be missing RLS policies entirely

-- Enable RLS on invites_masked table
ALTER TABLE public.invites_masked ENABLE ROW LEVEL SECURITY;

-- Policy: Family admins can view all invite data for their families
CREATE POLICY "Family admins can view family invites_masked" 
ON public.invites_masked 
FOR SELECT 
USING (
  family_id IN (
    SELECT m.family_id 
    FROM public.members m 
    WHERE m.profile_id = auth.uid() 
    AND m.role = 'admin'
  )
);

-- Policy: Family members can view limited invite data for their families  
CREATE POLICY "Family members can view limited invites_masked" 
ON public.invites_masked 
FOR SELECT 
USING (
  family_id IN (
    SELECT m.family_id 
    FROM public.members m 
    WHERE m.profile_id = auth.uid()
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.members m2 
    WHERE m2.profile_id = auth.uid() 
    AND m2.family_id = invites_masked.family_id 
    AND m2.role = 'admin'
  )
);

-- Policy: Super admins can view all masked invites
CREATE POLICY "Super admins can view all invites_masked" 
ON public.invites_masked 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND settings->>'role' = 'super_admin'
  )
);