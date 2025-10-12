-- Add birth_place and death_place columns to people table
ALTER TABLE public.people 
ADD COLUMN IF NOT EXISTS birth_place text,
ADD COLUMN IF NOT EXISTS death_place text;

-- Add comments for documentation
COMMENT ON COLUMN public.people.birth_place IS 'Place where the person was born (city, state/country)';
COMMENT ON COLUMN public.people.death_place IS 'Place where the person died (city, state/country)';

-- Create index for better query performance on place searches
CREATE INDEX IF NOT EXISTS idx_people_birth_place ON public.people(birth_place) WHERE birth_place IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_people_death_place ON public.people(death_place) WHERE death_place IS NOT NULL;
