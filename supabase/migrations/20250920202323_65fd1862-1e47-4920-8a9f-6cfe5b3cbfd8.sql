-- Fix security issue: Add RLS policies to tables missing protection

-- Enable RLS on family_member_profiles table
ALTER TABLE public.family_member_profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on invites_masked table  
ALTER TABLE public.invites_masked ENABLE ROW LEVEL SECURITY;

-- Create policy for family_member_profiles
-- Allow users to view profiles of members in their families
CREATE POLICY "Users can view family member profiles" 
ON public.family_member_profiles 
FOR SELECT 
USING (
  id IN (
    SELECT m.profile_id 
    FROM public.members m 
    WHERE m.family_id IN (
      SELECT family_id 
      FROM public.members 
      WHERE profile_id = auth.uid()
    )
  )
);

-- Create policy for invites_masked  
-- Allow family admins to view masked invite data for their families
CREATE POLICY "Family admins can view masked invites" 
ON public.invites_masked 
FOR SELECT 
USING (
  family_id IN (
    SELECT family_id 
    FROM public.members 
    WHERE profile_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow family members to view limited masked invite data (without sensitive info)
CREATE POLICY "Family members can view basic masked invites" 
ON public.invites_masked 
FOR SELECT 
USING (
  family_id IN (
    SELECT family_id 
    FROM public.members 
    WHERE profile_id = auth.uid()
  ) 
  AND NOT EXISTS (
    SELECT 1 
    FROM public.members 
    WHERE profile_id = auth.uid() 
    AND family_id = invites_masked.family_id 
    AND role = 'admin'
  )
);