-- Reset QA tester password and ensure proper setup
DO $$
DECLARE
  qa_user_id uuid;
BEGIN
  -- Get QA tester user ID
  SELECT id INTO qa_user_id
  FROM auth.users
  WHERE email = 'qa-tester@lifescribe.family';

  IF qa_user_id IS NULL THEN
    RAISE EXCEPTION 'QA tester user not found';
  END IF;

  -- Update auth.users to reset password and confirm email
  UPDATE auth.users
  SET 
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    encrypted_password = crypt('Test1234!', gen_salt('bf'))
  WHERE id = qa_user_id;

  -- Ensure they have admin role in all their families
  UPDATE public.members
  SET role = 'admin'::role_type
  WHERE profile_id = qa_user_id;

  -- Log the update
  RAISE NOTICE 'QA tester (%) password reset to Test1234! and confirmed as admin', qa_user_id;
END $$;