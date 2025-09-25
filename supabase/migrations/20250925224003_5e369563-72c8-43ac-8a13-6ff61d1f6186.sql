-- Fix invites table security - restrict email access to admins only
-- Problem: Regular family members can see invitation email addresses

-- Drop existing permissive invite policies
DROP POLICY IF EXISTS "Family members can view limited invite data" ON public.invites;
DROP POLICY IF EXISTS "invites_admin_access" ON public.invites;
DROP POLICY IF EXISTS "invites_own_access" ON public.invites;

-- Create restrictive invite policies - NO email exposure to regular family members
CREATE POLICY "invites_admin_only_with_emails" 
ON public.invites 
FOR SELECT 
USING (
  -- Only family admins can see full invite data including email addresses
  family_id IN (
    SELECT family_id 
    FROM public.members 
    WHERE profile_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "invites_own_invitations_only" 
ON public.invites 
FOR SELECT 
USING (
  -- Invitees can only see their own invites by matching their authenticated email
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Secure invite management policies
CREATE POLICY "invites_admin_create" 
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

CREATE POLICY "invites_admin_modify" 
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

CREATE POLICY "invites_admin_delete" 
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