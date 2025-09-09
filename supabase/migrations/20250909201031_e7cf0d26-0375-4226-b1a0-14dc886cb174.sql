-- Check and fix profiles table policies
-- Drop existing profiles policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.profiles';
    END LOOP;
END $$;

-- Create simple, working profiles policies
CREATE POLICY "profiles_select_policy" 
ON public.profiles FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "profiles_insert_policy" 
ON public.profiles FOR INSERT 
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_policy" 
ON public.profiles FOR UPDATE 
USING (id = auth.uid());