-- Fix policy to allow family members to view each other's profiles
DROP POLICY IF EXISTS "Family members can view profiles in their families" ON public.profiles;
CREATE POLICY "Family members can view profiles in their families"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.members m_self
    JOIN public.members m_target
      ON m_target.family_id = m_self.family_id
    WHERE m_self.profile_id = auth.uid()
      AND m_target.profile_id = profiles.id
  )
);

-- Re-assert RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;