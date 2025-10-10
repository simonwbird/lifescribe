-- Promote QA tester to admin in their families
-- This ensures the QA tester account can properly seed and manage test data

DO $$
DECLARE
  qa_user_id uuid;
BEGIN
  -- Find the QA tester user by email pattern
  SELECT id INTO qa_user_id
  FROM auth.users
  WHERE email ILIKE '%qa-tester%' OR email ILIKE '%qa%test%'
  LIMIT 1;

  -- If QA tester exists, promote them to admin in all their families
  IF qa_user_id IS NOT NULL THEN
    UPDATE public.members
    SET role = 'admin'::role_type
    WHERE profile_id = qa_user_id;
    
    RAISE NOTICE 'Promoted QA tester (%) to admin in their families', qa_user_id;
  ELSE
    RAISE NOTICE 'No QA tester user found';
  END IF;
END $$;