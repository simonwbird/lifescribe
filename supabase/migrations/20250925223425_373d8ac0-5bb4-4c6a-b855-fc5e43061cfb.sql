-- Fix critical security vulnerabilities by properly configuring RLS policies
-- This addresses multiple PUBLIC_DATA security findings

-- 1. Fix profiles table - restrict email access to users themselves and family members
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Family members can view basic profile info" 
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

-- 2. Fix invites table - only family admins and invitees can see invites
DROP POLICY IF EXISTS "invites_select_policy" ON public.invites;
CREATE POLICY "Family admins can view family invites" 
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

CREATE POLICY "Invitees can view their own invites" 
ON public.invites 
FOR SELECT 
USING (email = auth.email());

-- 3. Fix people table - only family members can access
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "people_select_policy" ON public.people;
CREATE POLICY "Family members can view people in their family" 
ON public.people 
FOR SELECT 
USING (
  family_id IN (
    SELECT family_id 
    FROM public.members 
    WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Family members can manage people in their family" 
ON public.people 
FOR ALL 
USING (
  family_id IN (
    SELECT family_id 
    FROM public.members 
    WHERE profile_id = auth.uid()
  )
);

-- 4. Fix properties table - only family members can access
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "properties_select_policy" ON public.properties;
CREATE POLICY "Family members can view properties in their family" 
ON public.properties 
FOR SELECT 
USING (
  family_id IN (
    SELECT family_id 
    FROM public.members 
    WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Family members can manage properties in their family" 
ON public.properties 
FOR ALL 
USING (
  family_id IN (
    SELECT family_id 
    FROM public.members 
    WHERE profile_id = auth.uid()
  )
);

-- 5. Ensure other sensitive tables have proper RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;