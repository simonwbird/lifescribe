-- Create QA Test Family and populate with realistic test data
-- Step by step approach to avoid RETURNING multiple rows issue

DO $$
DECLARE
  family_id_var UUID;
  qa_user_id UUID := 'dc196222-4bf4-4ab9-a3a0-63516064b6dd';
BEGIN
  -- Create the family (if not exists)
  INSERT INTO public.families (name, description, created_by, status, verified_at) 
  VALUES (
    'QA Test Family',
    'A test family for automated QA testing with realistic data',
    qa_user_id,
    'active',
    now()
  ) 
  ON CONFLICT DO NOTHING;

  -- Get family ID
  SELECT id INTO family_id_var FROM public.families WHERE name = 'QA Test Family' LIMIT 1;
  
  -- Add QA user as admin member (if not already exists)
  INSERT INTO public.members (profile_id, family_id, role)
  VALUES (qa_user_id, family_id_var, 'admin')
  ON CONFLICT DO NOTHING;
  
  -- Create family tree people one by one
  INSERT INTO public.people (family_id, full_name, given_name, surname, birth_date, birth_year, gender, is_living, notes, created_by) 
  VALUES (family_id_var, 'Elder Test User', 'Elder', 'User', '1935-03-15', 1935, 'female', true, 'Beloved family matriarch with many stories to share', qa_user_id)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO public.people (family_id, full_name, given_name, surname, birth_date, birth_year, gender, is_living, notes, created_by) 
  VALUES (family_id_var, 'Parent Test User', 'Parent', 'User', '1965-08-22', 1965, 'male', true, 'Family administrator and active story contributor', qa_user_id)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO public.people (family_id, full_name, given_name, surname, birth_date, birth_year, gender, is_living, notes, created_by) 
  VALUES (family_id_var, 'Teen Test User', 'Teen', 'User', '2008-12-05', 2008, 'other', true, 'Young family member learning about family history', qa_user_id)
  ON CONFLICT DO NOTHING;

END $$;