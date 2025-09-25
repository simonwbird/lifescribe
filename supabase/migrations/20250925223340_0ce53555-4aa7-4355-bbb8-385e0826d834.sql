-- Fix critical security vulnerabilities by properly configuring RLS policies
-- First drop existing policies to avoid conflicts

-- Fix profiles table - restrict email access properly
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Family members can view basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- Create secure policies for profiles table
CREATE POLICY "profiles_own_access" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "profiles_family_access" 
ON public.profiles 
FOR SELECT 
USING (
  id IN (
    SELECT m1.profile_id 
    FROM public.members m1
    WHERE m1.family_id IN (
      SELECT m2.family_id 
      FROM public.members m2 
      WHERE m2.profile_id = auth.uid()
    )
  )
);

CREATE POLICY "profiles_own_update" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid());

-- Fix invites table
DROP POLICY IF EXISTS "invites_select_policy" ON public.invites;
DROP POLICY IF EXISTS "Family admins can view family invites" ON public.invites;
DROP POLICY IF EXISTS "Invitees can view their own invites" ON public.invites;

CREATE POLICY "invites_admin_access" 
ON public.invites 
FOR SELECT 
USING (
  family_id IN (
    SELECT family_id 
    FROM public.members 
    WHERE profile_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "invites_own_access" 
ON public.invites 
FOR SELECT 
USING (email = auth.email());

-- Fix people table
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "people_select_policy" ON public.people;

CREATE POLICY "people_family_access" 
ON public.people 
FOR ALL 
USING (
  family_id IN (
    SELECT family_id 
    FROM public.members 
    WHERE profile_id = auth.uid()
  )
);

-- Fix properties table  
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "properties_select_policy" ON public.properties;

CREATE POLICY "properties_family_access" 
ON public.properties 
FOR ALL 
USING (
  family_id IN (
    SELECT family_id 
    FROM public.members 
    WHERE profile_id = auth.uid()
  )
);