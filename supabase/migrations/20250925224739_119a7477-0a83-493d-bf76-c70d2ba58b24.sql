-- CRITICAL SECURITY FIX: Protect email addresses in invites table only (not the view)
-- Problem: The invites table contains email addresses that could be harvested if publicly accessible  
-- Solution: Ensure only family admins and invitees themselves can access invite data

-- First, remove any overly permissive policies
DROP POLICY IF EXISTS "Family members can view limited invite data" ON public.invites;
DROP POLICY IF EXISTS "invites_family_access" ON public.invites;

-- Create restrictive policies for the invites table

-- 1. Only family ADMINS can see full invite details including emails
CREATE POLICY "invites_admin_access_only" 
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

-- 2. Invitees can view their own invites by matching email
CREATE POLICY "invites_invitee_self_access" 
ON public.invites 
FOR SELECT 
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 3. Only family admins can create invites
CREATE POLICY "invites_admin_create_only" 
ON public.invites 
FOR INSERT 
WITH CHECK (
  family_id IN (
    SELECT family_id 
    FROM public.members 
    WHERE profile_id = auth.uid() 
    AND role = 'admin'
  )
);

-- 4. Only family admins can update invites  
CREATE POLICY "invites_admin_update_only" 
ON public.invites 
FOR UPDATE 
USING (
  family_id IN (
    SELECT family_id 
    FROM public.members 
    WHERE profile_id = auth.uid() 
    AND role = 'admin'
  )
);

-- 5. Only family admins can delete invites
CREATE POLICY "invites_admin_delete_only" 
ON public.invites 
FOR DELETE 
USING (
  family_id IN (
    SELECT family_id 
    FROM public.members 
    WHERE profile_id = auth.uid() 
    AND role = 'admin'
  )
);