-- Add person_type to distinguish family members from referenced people
ALTER TABLE public.people 
ADD COLUMN person_type text NOT NULL DEFAULT 'family';

-- Add constraint to ensure valid person types
ALTER TABLE public.people 
ADD CONSTRAINT people_person_type_check 
CHECK (person_type IN ('family', 'reference'));

-- Add comment to explain the field
COMMENT ON COLUMN public.people.person_type IS 'Distinguishes between family members (appear in tree) and referenced people (friends, etc.)';