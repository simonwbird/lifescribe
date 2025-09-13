-- Clear existing data and import new family tree from CSV
-- First, get the user's family_id (assuming they're already logged in)
DO $$
DECLARE
    user_family_id UUID;
    current_user_id UUID := auth.uid();
    person_record RECORD;
    gedcom_to_uuid_map JSONB := '{}';
    new_person_id UUID;
    spouse_person_id UUID;
    parent1_person_id UUID;
    parent2_person_id UUID;
BEGIN
    -- Get the user's family_id
    SELECT family_id INTO user_family_id 
    FROM members 
    WHERE profile_id = current_user_id 
    LIMIT 1;
    
    IF user_family_id IS NULL THEN
        RAISE EXCEPTION 'No family found for current user';
    END IF;
    
    -- Clear existing data for this family
    DELETE FROM relationships WHERE family_id = user_family_id;
    DELETE FROM people WHERE family_id = user_family_id;
    
    -- Step 1: Create all people first and build GEDCOM ID mapping
    -- Simon William Bird
    INSERT INTO people (family_id, given_name, surname, gender, birth_year, created_by) 
    VALUES (user_family_id, 'Simon William', 'Bird', 'male', 1978, current_user_id) 
    RETURNING id INTO new_person_id;
    gedcom_to_uuid_map := jsonb_set(gedcom_to_uuid_map, ARRAY['@I1@'], to_jsonb(new_person_id::text));
    
    -- Zuzana Buckova
    INSERT INTO people (family_id, given_name, surname, gender, birth_year, created_by) 
    VALUES (user_family_id, 'Zuzana', 'Buckova', 'female', 1983, current_user_id) 
    RETURNING id INTO new_person_id;
    gedcom_to_uuid_map := jsonb_set(gedcom_to_uuid_map, ARRAY['@I2@'], to_jsonb(new_person_id::text));
    
    -- Lucy Shirley Bird
    INSERT INTO people (family_id, given_name, surname, gender, birth_year, created_by) 
    VALUES (user_family_id, 'Lucy Shirley', 'Bird', 'female', 2014, current_user_id) 
    RETURNING id INTO new_person_id;
    gedcom_to_uuid_map := jsonb_set(gedcom_to_uuid_map, ARRAY['@I3@'], to_jsonb(new_person_id::text));
    
    -- Jamie William Bird
    INSERT INTO people (family_id, given_name, surname, gender, birth_year, created_by) 
    VALUES (user_family_id, 'Jamie William', 'Bird', 'male', 2016, current_user_id) 
    RETURNING id INTO new_person_id;
    gedcom_to_uuid_map := jsonb_set(gedcom_to_uuid_map, ARRAY['@I4@'], to_jsonb(new_person_id::text));
    
    -- David Edward Bird
    INSERT INTO people (family_id, given_name, surname, gender, birth_year, created_by) 
    VALUES (user_family_id, 'David Edward', 'Bird', 'male', 1947, current_user_id) 
    RETURNING id INTO new_person_id;
    gedcom_to_uuid_map := jsonb_set(gedcom_to_uuid_map, ARRAY['@I5@'], to_jsonb(new_person_id::text));
    
    -- Helen Bird
    INSERT INTO people (family_id, given_name, surname, gender, birth_year, created_by) 
    VALUES (user_family_id, 'Helen', 'Bird', 'female', 1953, current_user_id) 
    RETURNING id INTO new_person_id;
    gedcom_to_uuid_map := jsonb_set(gedcom_to_uuid_map, ARRAY['@I6@'], to_jsonb(new_person_id::text));
    
    -- Edward Ellis Bird (deceased)
    INSERT INTO people (family_id, given_name, surname, gender, birth_year, death_year, created_by) 
    VALUES (user_family_id, 'Edward Ellis', 'Bird', 'male', 1922, 1984, current_user_id) 
    RETURNING id INTO new_person_id;
    gedcom_to_uuid_map := jsonb_set(gedcom_to_uuid_map, ARRAY['@I7@'], to_jsonb(new_person_id::text));
    
    -- Helen Dorothy Viccars (deceased)
    INSERT INTO people (family_id, given_name, surname, gender, birth_year, death_year, created_by) 
    VALUES (user_family_id, 'Helen Dorothy', 'Viccars', 'female', 1926, 1999, current_user_id) 
    RETURNING id INTO new_person_id;
    gedcom_to_uuid_map := jsonb_set(gedcom_to_uuid_map, ARRAY['@I8@'], to_jsonb(new_person_id::text));
    
    -- Henry George Kemter (deceased)
    INSERT INTO people (family_id, given_name, surname, gender, birth_year, death_year, created_by) 
    VALUES (user_family_id, 'Henry George', 'Kemter', 'male', 1922, 2008, current_user_id) 
    RETURNING id INTO new_person_id;
    gedcom_to_uuid_map := jsonb_set(gedcom_to_uuid_map, ARRAY['@I9@'], to_jsonb(new_person_id::text));
    
    -- Shirley Lenore Thomas (deceased)
    INSERT INTO people (family_id, given_name, surname, gender, birth_year, death_year, created_by) 
    VALUES (user_family_id, 'Shirley Lenore', 'Thomas', 'female', 1928, 2014, current_user_id) 
    RETURNING id INTO new_person_id;
    gedcom_to_uuid_map := jsonb_set(gedcom_to_uuid_map, ARRAY['@I10@'], to_jsonb(new_person_id::text));
    
    -- George Alfred Kemter (deceased)
    INSERT INTO people (family_id, given_name, surname, gender, birth_year, death_year, created_by) 
    VALUES (user_family_id, 'George Alfred', 'Kemter', 'male', 1887, 1971, current_user_id) 
    RETURNING id INTO new_person_id;
    gedcom_to_uuid_map := jsonb_set(gedcom_to_uuid_map, ARRAY['@I11@'], to_jsonb(new_person_id::text));
    
    -- Ada Windeler (deceased)
    INSERT INTO people (family_id, given_name, surname, gender, birth_year, death_year, created_by) 
    VALUES (user_family_id, 'Ada', 'Windeler', 'female', 1885, 1967, current_user_id) 
    RETURNING id INTO new_person_id;
    gedcom_to_uuid_map := jsonb_set(gedcom_to_uuid_map, ARRAY['@I12@'], to_jsonb(new_person_id::text));
    
    -- Archibald C Viccars (deceased)
    INSERT INTO people (family_id, given_name, surname, gender, birth_year, death_year, created_by) 
    VALUES (user_family_id, 'Archibald C', 'Viccars', 'male', 1890, 1939, current_user_id) 
    RETURNING id INTO new_person_id;
    gedcom_to_uuid_map := jsonb_set(gedcom_to_uuid_map, ARRAY['@I13@'], to_jsonb(new_person_id::text));
    
    -- Annie May Cragg (deceased)
    INSERT INTO people (family_id, given_name, surname, gender, birth_year, death_year, created_by) 
    VALUES (user_family_id, 'Annie May', 'Cragg', 'female', 1895, 1968, current_user_id) 
    RETURNING id INTO new_person_id;
    gedcom_to_uuid_map := jsonb_set(gedcom_to_uuid_map, ARRAY['@I14@'], to_jsonb(new_person_id::text));
    
    -- William B Thomas (deceased)
    INSERT INTO people (family_id, given_name, surname, gender, birth_year, death_year, created_by) 
    VALUES (user_family_id, 'William B', 'Thomas', 'male', 1894, 1976, current_user_id) 
    RETURNING id INTO new_person_id;
    gedcom_to_uuid_map := jsonb_set(gedcom_to_uuid_map, ARRAY['@I15@'], to_jsonb(new_person_id::text));
    
    -- Bertha Olive Stork (deceased)
    INSERT INTO people (family_id, given_name, surname, gender, birth_year, death_year, created_by) 
    VALUES (user_family_id, 'Bertha Olive', 'Stork', 'female', 1895, 1975, current_user_id) 
    RETURNING id INTO new_person_id;
    gedcom_to_uuid_map := jsonb_set(gedcom_to_uuid_map, ARRAY['@I16@'], to_jsonb(new_person_id::text));
    
    -- Matthew David Bird
    INSERT INTO people (family_id, given_name, surname, gender, birth_year, created_by) 
    VALUES (user_family_id, 'Matthew David', 'Bird', 'male', 1980, current_user_id) 
    RETURNING id INTO new_person_id;
    gedcom_to_uuid_map := jsonb_set(gedcom_to_uuid_map, ARRAY['@I17@'], to_jsonb(new_person_id::text));
    
    -- Adam George Bird
    INSERT INTO people (family_id, given_name, surname, gender, birth_year, created_by) 
    VALUES (user_family_id, 'Adam George', 'Bird', 'male', 1981, current_user_id) 
    RETURNING id INTO new_person_id;
    gedcom_to_uuid_map := jsonb_set(gedcom_to_uuid_map, ARRAY['@I18@'], to_jsonb(new_person_id::text));
    
    -- James Edward Bird
    INSERT INTO people (family_id, given_name, surname, gender, birth_year, created_by) 
    VALUES (user_family_id, 'James Edward', 'Bird', 'male', 1984, current_user_id) 
    RETURNING id INTO new_person_id;
    gedcom_to_uuid_map := jsonb_set(gedcom_to_uuid_map, ARRAY['@I19@'], to_jsonb(new_person_id::text));
    
    -- Step 2: Create spouse relationships
    -- Simon (@I1@) + Zuzana (@I2@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I1@')::UUID,
        (gedcom_to_uuid_map->>'@I2@')::UUID,
        'spouse',
        current_user_id
    );
    
    -- David (@I5@) + Helen (@I6@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I5@')::UUID,
        (gedcom_to_uuid_map->>'@I6@')::UUID,
        'spouse',
        current_user_id
    );
    
    -- Edward (@I7@) + Helen Dorothy (@I8@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I7@')::UUID,
        (gedcom_to_uuid_map->>'@I8@')::UUID,
        'spouse',
        current_user_id
    );
    
    -- Henry (@I9@) + Shirley (@I10@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I9@')::UUID,
        (gedcom_to_uuid_map->>'@I10@')::UUID,
        'spouse',
        current_user_id
    );
    
    -- George (@I11@) + Ada (@I12@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I11@')::UUID,
        (gedcom_to_uuid_map->>'@I12@')::UUID,
        'spouse',
        current_user_id
    );
    
    -- Archibald (@I13@) + Annie (@I14@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I13@')::UUID,
        (gedcom_to_uuid_map->>'@I14@')::UUID,
        'spouse',
        current_user_id
    );
    
    -- William (@I15@) + Bertha (@I16@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I15@')::UUID,
        (gedcom_to_uuid_map->>'@I16@')::UUID,
        'spouse',
        current_user_id
    );
    
    -- Step 3: Create parent-child relationships
    -- David (@I5@) -> Simon (@I1@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I5@')::UUID,
        (gedcom_to_uuid_map->>'@I1@')::UUID,
        'parent',
        current_user_id
    );
    
    -- Helen (@I6@) -> Simon (@I1@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I6@')::UUID,
        (gedcom_to_uuid_map->>'@I1@')::UUID,
        'parent',
        current_user_id
    );
    
    -- Simon (@I1@) -> Lucy (@I3@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I1@')::UUID,
        (gedcom_to_uuid_map->>'@I3@')::UUID,
        'parent',
        current_user_id
    );
    
    -- Zuzana (@I2@) -> Lucy (@I3@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I2@')::UUID,
        (gedcom_to_uuid_map->>'@I3@')::UUID,
        'parent',
        current_user_id
    );
    
    -- Simon (@I1@) -> Jamie (@I4@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I1@')::UUID,
        (gedcom_to_uuid_map->>'@I4@')::UUID,
        'parent',
        current_user_id
    );
    
    -- Zuzana (@I2@) -> Jamie (@I4@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I2@')::UUID,
        (gedcom_to_uuid_map->>'@I4@')::UUID,
        'parent',
        current_user_id
    );
    
    -- Edward (@I7@) -> David (@I5@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I7@')::UUID,
        (gedcom_to_uuid_map->>'@I5@')::UUID,
        'parent',
        current_user_id
    );
    
    -- Helen Dorothy (@I8@) -> David (@I5@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I8@')::UUID,
        (gedcom_to_uuid_map->>'@I5@')::UUID,
        'parent',
        current_user_id
    );
    
    -- Henry (@I9@) -> Helen (@I6@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I9@')::UUID,
        (gedcom_to_uuid_map->>'@I6@')::UUID,
        'parent',
        current_user_id
    );
    
    -- Shirley (@I10@) -> Helen (@I6@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I10@')::UUID,
        (gedcom_to_uuid_map->>'@I6@')::UUID,
        'parent',
        current_user_id
    );
    
    -- George (@I11@) -> Henry (@I9@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I11@')::UUID,
        (gedcom_to_uuid_map->>'@I9@')::UUID,
        'parent',
        current_user_id
    );
    
    -- Ada (@I12@) -> Henry (@I9@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I12@')::UUID,
        (gedcom_to_uuid_map->>'@I9@')::UUID,
        'parent',
        current_user_id
    );
    
    -- Archibald (@I13@) -> Helen Dorothy (@I8@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I13@')::UUID,
        (gedcom_to_uuid_map->>'@I8@')::UUID,
        'parent',
        current_user_id
    );
    
    -- Annie (@I14@) -> Helen Dorothy (@I8@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I14@')::UUID,
        (gedcom_to_uuid_map->>'@I8@')::UUID,
        'parent',
        current_user_id
    );
    
    -- William (@I15@) -> Shirley (@I10@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I15@')::UUID,
        (gedcom_to_uuid_map->>'@I10@')::UUID,
        'parent',
        current_user_id
    );
    
    -- Bertha (@I16@) -> Shirley (@I10@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I16@')::UUID,
        (gedcom_to_uuid_map->>'@I10@')::UUID,
        'parent',
        current_user_id
    );
    
    -- David (@I5@) -> Matthew (@I17@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I5@')::UUID,
        (gedcom_to_uuid_map->>'@I17@')::UUID,
        'parent',
        current_user_id
    );
    
    -- Helen (@I6@) -> Matthew (@I17@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I6@')::UUID,
        (gedcom_to_uuid_map->>'@I17@')::UUID,
        'parent',
        current_user_id
    );
    
    -- David (@I5@) -> Adam (@I18@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I5@')::UUID,
        (gedcom_to_uuid_map->>'@I18@')::UUID,
        'parent',
        current_user_id
    );
    
    -- Helen (@I6@) -> Adam (@I18@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I6@')::UUID,
        (gedcom_to_uuid_map->>'@I18@')::UUID,
        'parent',
        current_user_id
    );
    
    -- David (@I5@) -> James (@I19@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I5@')::UUID,
        (gedcom_to_uuid_map->>'@I19@')::UUID,
        'parent',
        current_user_id
    );
    
    -- Helen (@I6@) -> James (@I19@)
    INSERT INTO relationships (family_id, from_person_id, to_person_id, relationship_type, created_by)
    VALUES (
        user_family_id,
        (gedcom_to_uuid_map->>'@I6@')::UUID,
        (gedcom_to_uuid_map->>'@I19@')::UUID,
        'parent',
        current_user_id
    );
    
    RAISE NOTICE 'Successfully imported family tree data: 19 people with relationships';
    
END $$;