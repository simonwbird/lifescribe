-- Clear existing family data and import the specific family from CSV
DELETE FROM relationships WHERE family_id IN (SELECT id FROM families);
DELETE FROM people WHERE family_id IN (SELECT id FROM families);

-- Insert the Bird family data based on the CSV
-- First, let's assume we're working with the first family (you can adjust the family_id as needed)
DO $$
DECLARE
    bird_family_id uuid;
    current_user_id uuid;
BEGIN
    -- Get current user
    SELECT auth.uid() INTO current_user_id;
    
    -- Get or create the Bird family
    SELECT id INTO bird_family_id FROM families LIMIT 1;
    
    IF bird_family_id IS NULL THEN
        INSERT INTO families (name, description, created_by) 
        VALUES ('Bird Family', 'The Bird family tree', current_user_id)
        RETURNING id INTO bird_family_id;
    END IF;

    -- Insert people from the CSV data
    INSERT INTO people (id, given_name, surname, full_name, gender, birth_date, death_date, family_id, created_by) VALUES
    -- Simon and Zuzana (current generation)
    ('11111111-1111-1111-1111-111111111111', 'Simon William', 'Bird', 'Simon William Bird', 'male', '1978-01-01', NULL, bird_family_id, current_user_id),
    ('22222222-2222-2222-2222-222222222222', 'Zuzana', 'Buckova', 'Zuzana Buckova', 'female', '1983-01-01', NULL, bird_family_id, current_user_id),
    
    -- Their children
    ('33333333-3333-3333-3333-333333333333', 'Lucy Shirley', 'Bird', 'Lucy Shirley Bird', 'female', '2014-01-01', NULL, bird_family_id, current_user_id),
    ('44444444-4444-4444-4444-444444444444', 'Jamie William', 'Bird', 'Jamie William Bird', 'male', '2016-01-01', NULL, bird_family_id, current_user_id),
    
    -- Simon's parents
    ('55555555-5555-5555-5555-555555555555', 'David Edward', 'Bird', 'David Edward Bird', 'male', '1947-01-01', NULL, bird_family_id, current_user_id),
    ('66666666-6666-6666-6666-666666666666', 'Helen', 'Bird', 'Helen Bird', 'female', '1953-01-01', NULL, bird_family_id, current_user_id),
    
    -- Simon's siblings
    ('17171717-1717-1717-1717-171717171717', 'Matthew David', 'Bird', 'Matthew David Bird', 'male', '1980-01-01', NULL, bird_family_id, current_user_id),
    ('18181818-1818-1818-1818-181818181818', 'Adam George', 'Bird', 'Adam George Bird', 'male', '1981-01-01', NULL, bird_family_id, current_user_id),
    ('19191919-1919-1919-1919-191919191919', 'James Edward', 'Bird', 'James Edward Bird', 'male', '1984-01-01', NULL, bird_family_id, current_user_id),
    
    -- David's parents (Simon's grandparents)
    ('77777777-7777-7777-7777-777777777777', 'Edward Ellis', 'Bird', 'Edward Ellis Bird', 'male', '1922-01-01', '1984-01-01', bird_family_id, current_user_id),
    ('88888888-8888-8888-8888-888888888888', 'Helen Dorothy', 'Viccars', 'Helen Dorothy Viccars', 'female', '1926-01-01', '1999-01-01', bird_family_id, current_user_id),
    
    -- Helen's parents (Simon's grandparents)
    ('99999999-9999-9999-9999-999999999999', 'Henry George', 'Kemter', 'Henry George Kemter', 'male', '1922-01-01', '2008-01-01', bird_family_id, current_user_id),
    ('10101010-1010-1010-1010-101010101010', 'Shirley Lenore', 'Thomas', 'Shirley Lenore Thomas', 'female', '1928-01-01', '2014-01-01', bird_family_id, current_user_id),
    
    -- Great-grandparents
    ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'George Alfred', 'Kemter', 'George Alfred Kemter', 'male', '1887-01-01', '1971-01-01', bird_family_id, current_user_id),
    ('12121212-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Ada', 'Windeler', 'Ada Windeler', 'female', '1885-01-01', '1967-01-01', bird_family_id, current_user_id),
    ('13131313-cccc-cccc-cccc-cccccccccccc', 'Archibald C', 'Viccars', 'Archibald C Viccars', 'male', '1890-01-01', '1939-01-01', bird_family_id, current_user_id),
    ('14141414-dddd-dddd-dddd-dddddddddddd', 'Annie May', 'Cragg', 'Annie May Cragg', 'female', '1895-01-01', '1968-01-01', bird_family_id, current_user_id),
    ('15151515-eeee-eeee-eeee-eeeeeeeeeeee', 'William B', 'Thomas', 'William B Thomas', 'male', '1894-01-01', '1976-01-01', bird_family_id, current_user_id),
    ('16161616-ffff-ffff-ffff-ffffffffffff', 'Bertha Olive', 'Stork', 'Bertha Olive Stork', 'female', '1895-01-01', '1975-01-01', bird_family_id, current_user_id),
    ('20202020-2020-2020-2020-202020202020', 'William G', 'Kemter', 'William G Kemter', 'male', '1955-01-01', NULL, bird_family_id, current_user_id),
    ('21212121-2121-2121-2121-212121212121', 'Bentley', 'Kerry-Anne', 'Bentley Kerry-Anne', 'female', NULL, NULL, bird_family_id, current_user_id),
    ('22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Leon', 'Phillips', 'Leon Phillips', 'male', '1885-01-01', '1957-01-01', bird_family_id, current_user_id);

    -- Insert relationships
    INSERT INTO relationships (from_person_id, to_person_id, relationship_type, family_id, created_by) VALUES
    -- Marriages/Spouses
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'spouse', bird_family_id, current_user_id),
    ('55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', 'spouse', bird_family_id, current_user_id),
    ('77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888', 'spouse', bird_family_id, current_user_id),
    ('99999999-9999-9999-9999-999999999999', '10101010-1010-1010-1010-101010101010', 'spouse', bird_family_id, current_user_id),
    ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '12121212-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'spouse', bird_family_id, current_user_id),
    ('13131313-cccc-cccc-cccc-cccccccccccc', '14141414-dddd-dddd-dddd-dddddddddddd', 'spouse', bird_family_id, current_user_id),
    ('15151515-eeee-eeee-eeee-eeeeeeeeeeee', '16161616-ffff-ffff-ffff-ffffffffffff', 'spouse', bird_family_id, current_user_id),
    ('20202020-2020-2020-2020-202020202020', '21212121-2121-2121-2121-212121212121', 'spouse', bird_family_id, current_user_id),
    ('22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '16161616-ffff-ffff-ffff-ffffffffffff', 'spouse', bird_family_id, current_user_id),
    
    -- Parent-Child relationships
    ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'parent', bird_family_id, current_user_id),
    ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'parent', bird_family_id, current_user_id),
    ('55555555-5555-5555-5555-555555555555', '17171717-1717-1717-1717-171717171717', 'parent', bird_family_id, current_user_id),
    ('66666666-6666-6666-6666-666666666666', '17171717-1717-1717-1717-171717171717', 'parent', bird_family_id, current_user_id),
    ('55555555-5555-5555-5555-555555555555', '18181818-1818-1818-1818-181818181818', 'parent', bird_family_id, current_user_id),
    ('66666666-6666-6666-6666-666666666666', '18181818-1818-1818-1818-181818181818', 'parent', bird_family_id, current_user_id),
    ('55555555-5555-5555-5555-555555555555', '19191919-1919-1919-1919-191919191919', 'parent', bird_family_id, current_user_id),
    ('66666666-6666-6666-6666-666666666666', '19191919-1919-1919-1919-191919191919', 'parent', bird_family_id, current_user_id),
    
    ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'parent', bird_family_id, current_user_id),
    ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'parent', bird_family_id, current_user_id),
    ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'parent', bird_family_id, current_user_id),
    ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'parent', bird_family_id, current_user_id),
    
    ('77777777-7777-7777-7777-777777777777', '55555555-5555-5555-5555-555555555555', 'parent', bird_family_id, current_user_id),
    ('88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', 'parent', bird_family_id, current_user_id),
    ('99999999-9999-9999-9999-999999999999', '66666666-6666-6666-6666-666666666666', 'parent', bird_family_id, current_user_id),
    ('10101010-1010-1010-1010-101010101010', '66666666-6666-6666-6666-666666666666', 'parent', bird_family_id, current_user_id),
    ('99999999-9999-9999-9999-999999999999', '20202020-2020-2020-2020-202020202020', 'parent', bird_family_id, current_user_id),
    ('10101010-1010-1010-1010-101010101010', '20202020-2020-2020-2020-202020202020', 'parent', bird_family_id, current_user_id),
    
    ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999', 'parent', bird_family_id, current_user_id),
    ('12121212-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '99999999-9999-9999-9999-999999999999', 'parent', bird_family_id, current_user_id),
    ('13131313-cccc-cccc-cccc-cccccccccccc', '88888888-8888-8888-8888-888888888888', 'parent', bird_family_id, current_user_id),
    ('14141414-dddd-dddd-dddd-dddddddddddd', '88888888-8888-8888-8888-888888888888', 'parent', bird_family_id, current_user_id),
    ('15151515-eeee-eeee-eeee-eeeeeeeeeeee', '10101010-1010-1010-1010-101010101010', 'parent', bird_family_id, current_user_id),
    ('16161616-ffff-ffff-ffff-ffffffffffff', '10101010-1010-1010-1010-101010101010', 'parent', bird_family_id, current_user_id);
    
END $$;