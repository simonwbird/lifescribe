-- Add favorites and quirks fields to people table
ALTER TABLE public.people 
ADD COLUMN IF NOT EXISTS favorite_song TEXT,
ADD COLUMN IF NOT EXISTS favorite_food TEXT,
ADD COLUMN IF NOT EXISTS signature_saying TEXT,
ADD COLUMN IF NOT EXISTS hobbies TEXT[] DEFAULT '{}';

-- Add index for hobby searches
CREATE INDEX IF NOT EXISTS idx_people_hobbies ON public.people USING GIN(hobbies);

COMMENT ON COLUMN public.people.favorite_song IS 'Person''s favorite song or music';
COMMENT ON COLUMN public.people.favorite_food IS 'Person''s favorite food or dish';
COMMENT ON COLUMN public.people.signature_saying IS 'Memorable phrase or saying associated with the person';
COMMENT ON COLUMN public.people.hobbies IS 'List of hobbies and interests (max 4 recommended)';
