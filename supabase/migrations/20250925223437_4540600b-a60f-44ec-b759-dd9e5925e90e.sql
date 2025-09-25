-- Critical security fix: Remove public access and create restrictive RLS policies

-- First, check if tables have RLS enabled and ensure they do
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- Drop any overly permissive policies that might exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Public read access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_select" ON public.profiles;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.invites;
DROP POLICY IF EXISTS "Public read access" ON public.invites;
DROP POLICY IF EXISTS "invites_public_select" ON public.invites;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.people;
DROP POLICY IF EXISTS "Public read access" ON public.people;
DROP POLICY IF EXISTS "people_public_select" ON public.people;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.properties;
DROP POLICY IF EXISTS "Public read access" ON public.properties;
DROP POLICY IF EXISTS "properties_public_select" ON public.properties;

-- Create restrictive policies with unique names for profiles
CREATE POLICY "secure_profiles_self_access_2024" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "secure_profiles_family_access_2024" 
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

-- Create restrictive policies for invites
CREATE POLICY "secure_invites_admin_only_2024" 
ON public.invites 
FOR SELECT 
USING (
  family_id IN (
    SELECT family_id 
    FROM public.members 
    WHERE profile_id = auth.uid() 
    AND role = 'admin'
  ) OR email = auth.email()
);