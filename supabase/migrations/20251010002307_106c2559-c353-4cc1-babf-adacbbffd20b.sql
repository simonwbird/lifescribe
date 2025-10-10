-- Grant QA tester super admin privileges
DO $$
DECLARE
  qa_user_id uuid;
  current_settings jsonb;
BEGIN
  -- Get QA tester user ID
  SELECT id INTO qa_user_id
  FROM auth.users
  WHERE email = 'qa-tester@lifescribe.family';

  IF qa_user_id IS NULL THEN
    RAISE EXCEPTION 'QA tester user not found';
  END IF;

  -- Get current settings
  SELECT settings INTO current_settings
  FROM public.profiles
  WHERE id = qa_user_id;

  -- Update profile settings to add super_admin role
  UPDATE public.profiles
  SET settings = COALESCE(current_settings, '{}'::jsonb) || '{"role": "super_admin"}'::jsonb
  WHERE id = qa_user_id;

  RAISE NOTICE 'QA tester (%) granted super_admin privileges', qa_user_id;
END $$;