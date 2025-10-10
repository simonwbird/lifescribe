-- Retry: fix recursive RLS by rebuilding policies with correct pg_policies column names
DO $$
DECLARE pol record;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'person_page_permissions'
  ) THEN
    RAISE NOTICE 'Table public.person_page_permissions not found. Skipping policy fixes.';
    RETURN;
  END IF;

  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'person_page_permissions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.person_page_permissions', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.person_page_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ppp_select_own"
ON public.person_page_permissions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "ppp_insert_own"
ON public.person_page_permissions
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "ppp_update_own"
ON public.person_page_permissions
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "ppp_family_admin_all"
ON public.person_page_permissions
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.people p
    JOIN public.members m ON m.family_id = p.family_id
    WHERE p.id = person_page_permissions.person_id
      AND m.profile_id = auth.uid()
      AND m.role = 'admin'::role_type
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.people p
    JOIN public.members m ON m.family_id = p.family_id
    WHERE p.id = person_page_permissions.person_id
      AND m.profile_id = auth.uid()
      AND m.role = 'admin'::role_type
  )
);

CREATE INDEX IF NOT EXISTS idx_ppp_user_id ON public.person_page_permissions (user_id);
CREATE INDEX IF NOT EXISTS idx_ppp_person_id ON public.person_page_permissions (person_id);
