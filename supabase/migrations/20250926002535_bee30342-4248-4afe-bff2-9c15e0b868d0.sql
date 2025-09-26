-- Create QA Test Family (simpler approach)
DO $$
DECLARE
  family_id_var UUID;
  elder_id UUID;
  parent_id UUID;  
  teen_id UUID;
BEGIN
  -- Check if family already exists
  SELECT id INTO family_id_var FROM public.families WHERE name = 'QA Test Family' LIMIT 1;
  
  -- Only create if it doesn't exist
  IF family_id_var IS NULL THEN
    -- Create the family
    INSERT INTO public.families (name, description, created_by, status, verified_at) 
    VALUES (
      'QA Test Family',
      'A test family for automated QA testing with realistic data',
      'dc196222-4bf4-4ab9-a3a0-63516064b6dd',
      'active',
      now()
    ) RETURNING id INTO family_id_var;
    
    -- Add QA user as admin member
    INSERT INTO public.members (profile_id, family_id, role)
    VALUES ('dc196222-4bf4-4ab9-a3a0-63516064b6dd', family_id_var, 'admin');
    
    -- Create family tree people
    INSERT INTO public.people (family_id, full_name, given_name, surname, birth_date, birth_year, gender, is_living, notes, created_by) 
    VALUES (family_id_var, 'Elder Test User', 'Elder', 'User', '1935-03-15', 1935, 'female', true, 'Beloved family matriarch with many stories to share', 'dc196222-4bf4-4ab9-a3a0-63516064b6dd')
    RETURNING id INTO elder_id;
    
    INSERT INTO public.people (family_id, full_name, given_name, surname, birth_date, birth_year, gender, is_living, notes, created_by) 
    VALUES (family_id_var, 'Parent Test User', 'Parent', 'User', '1965-08-22', 1965, 'male', true, 'Family administrator and active story contributor', 'dc196222-4bf4-4ab9-a3a0-63516064b6dd')
    RETURNING id INTO parent_id;
    
    INSERT INTO public.people (family_id, full_name, given_name, surname, birth_date, birth_year, gender, is_living, notes, created_by) 
    VALUES (family_id_var, 'Teen Test User', 'Teen', 'User', '2008-12-05', 2008, 'other', true, 'Young family member learning about family history', 'dc196222-4bf4-4ab9-a3a0-63516064b6dd')
    RETURNING id INTO teen_id;
    
    -- Create family relationships
    INSERT INTO public.relationships (family_id, from_person_id, to_person_id, relationship_type, is_biological, created_by) VALUES
    (family_id_var, elder_id, parent_id, 'parent', true, 'dc196222-4bf4-4ab9-a3a0-63516064b6dd'),
    (family_id_var, parent_id, teen_id, 'parent', true, 'dc196222-4bf4-4ab9-a3a0-63516064b6dd');
    
    RAISE NOTICE 'QA Test Family created successfully with ID: %', family_id_var;
  ELSE
    RAISE NOTICE 'QA Test Family already exists with ID: %', family_id_var;
  END IF;
END $$;