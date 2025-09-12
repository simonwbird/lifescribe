-- Create enums for properties system (if they don't exist)
DO $$ BEGIN
    CREATE TYPE public.property_type AS ENUM (
        'house', 'apartment', 'townhouse', 'cottage', 'villa', 'holiday_home', 
        'farm', 'ranch', 'student_housing', 'military_housing', 'multi_unit', 
        'caravan', 'motorhome', 'houseboat', 'boat', 'bungalow', 'duplex', 
        'terrace', 'loft', 'studio', 'retirement_home', 'boarding_house', 
        'ancestral_home', 'business_premises', 'land', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.address_visibility AS ENUM ('exact', 'street_hidden', 'city_only');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.property_status AS ENUM ('current', 'sold', 'rented', 'demolished', 'unknown');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.occupancy_role AS ENUM ('owner', 'tenant', 'child', 'guest', 'host', 'relative', 'roommate');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.visit_occasion AS ENUM ('holiday', 'celebration', 'reunion', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.property_event_type AS ENUM (
        'moved_in', 'moved_out', 'purchase', 'sale', 'renovation', 'extension', 
        'garden_change', 'birth', 'party', 'storm', 'flood', 'fire', 'holiday', 
        'photo_taken', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.property_media_role AS ENUM (
        'cover', 'then', 'now', 'floorplan', 'deed', 'mortgage', 'survey', 
        'letter', 'bill', 'receipt', 'newspaper_clipping', 'general'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update existing properties table with new schema
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS display_title TEXT,
  ADD COLUMN IF NOT EXISTS property_types property_type[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS address_json JSONB,
  ADD COLUMN IF NOT EXISTS geocode JSONB,
  ADD COLUMN IF NOT EXISTS address_visibility address_visibility DEFAULT 'exact',
  ADD COLUMN IF NOT EXISTS map_visibility BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS built_year INTEGER,
  ADD COLUMN IF NOT EXISTS built_year_circa BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_known_date DATE,
  ADD COLUMN IF NOT EXISTS first_known_circa BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_known_date DATE,
  ADD COLUMN IF NOT EXISTS last_known_circa BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS status property_status DEFAULT 'current',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cover_media_id UUID;

-- Migrate existing data
UPDATE public.properties SET 
  display_title = COALESCE(name, 'Property'),
  address_json = CASE 
    WHEN address IS NOT NULL THEN jsonb_build_object('line1', address)
    ELSE NULL 
  END,
  geocode = CASE 
    WHEN latitude IS NOT NULL AND longitude IS NOT NULL 
    THEN jsonb_build_object('lat', latitude, 'lng', longitude)
    ELSE NULL 
  END
WHERE display_title IS NULL;

-- Create occupancy table (Person ↔ Property)
CREATE TABLE IF NOT EXISTS public.property_occupancy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  role occupancy_role NOT NULL DEFAULT 'tenant',
  start_date DATE,
  start_date_circa BOOLEAN DEFAULT false,
  end_date DATE,
  end_date_circa BOOLEAN DEFAULT false,
  primary_home BOOLEAN DEFAULT false,
  notes TEXT,
  family_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create visits table for holiday/short stays
CREATE TABLE IF NOT EXISTS public.property_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  people_ids UUID[] DEFAULT '{}',
  start_date DATE,
  end_date DATE,
  recurring_pattern TEXT,
  occasion visit_occasion DEFAULT 'holiday',
  notes TEXT,
  family_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create property timeline entries/events
CREATE TABLE IF NOT EXISTS public.property_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  event_type property_event_type NOT NULL,
  event_date DATE,
  event_date_circa BOOLEAN DEFAULT false,
  title TEXT NOT NULL,
  notes TEXT,
  media_ids UUID[] DEFAULT '{}',
  story_id UUID,
  people_ids UUID[] DEFAULT '{}',
  family_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rooms table (optional, lightweight)
CREATE TABLE IF NOT EXISTS public.property_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  family_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add property links to existing tables (only if columns don't exist)
DO $$ BEGIN
    ALTER TABLE public.things ADD COLUMN lives_at_property_id UUID REFERENCES public.properties(id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.things ADD COLUMN room_id UUID REFERENCES public.property_rooms(id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.stories ADD COLUMN happened_at_property_id UUID REFERENCES public.properties(id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.pets ADD COLUMN home_property_id UUID REFERENCES public.properties(id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.media ADD COLUMN property_media_role property_media_role DEFAULT 'general';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Enable RLS on new tables
ALTER TABLE public.property_occupancy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_rooms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for property_occupancy
DROP POLICY IF EXISTS "Family members can view property occupancy" ON public.property_occupancy;
CREATE POLICY "Family members can view property occupancy"
ON public.property_occupancy
FOR SELECT
USING (family_id IN (
  SELECT members.family_id
  FROM members
  WHERE members.profile_id = auth.uid()
));

DROP POLICY IF EXISTS "Family members can manage property occupancy" ON public.property_occupancy;
CREATE POLICY "Family members can manage property occupancy"
ON public.property_occupancy
FOR ALL
USING (family_id IN (
  SELECT members.family_id
  FROM members
  WHERE members.profile_id = auth.uid()
))
WITH CHECK (family_id IN (
  SELECT members.family_id
  FROM members
  WHERE members.profile_id = auth.uid()
));

-- Create RLS policies for property_visits
DROP POLICY IF EXISTS "Family members can view property visits" ON public.property_visits;
CREATE POLICY "Family members can view property visits"
ON public.property_visits
FOR SELECT
USING (family_id IN (
  SELECT members.family_id
  FROM members
  WHERE members.profile_id = auth.uid()
));

DROP POLICY IF EXISTS "Family members can manage property visits" ON public.property_visits;
CREATE POLICY "Family members can manage property visits"
ON public.property_visits
FOR ALL
USING (family_id IN (
  SELECT members.family_id
  FROM members
  WHERE members.profile_id = auth.uid()
))
WITH CHECK (family_id IN (
  SELECT members.family_id
  FROM members
  WHERE members.profile_id = auth.uid()
) AND created_by = auth.uid());

-- Create RLS policies for property_events
DROP POLICY IF EXISTS "Family members can view property events" ON public.property_events;
CREATE POLICY "Family members can view property events"
ON public.property_events
FOR SELECT
USING (family_id IN (
  SELECT members.family_id
  FROM members
  WHERE members.profile_id = auth.uid()
));

DROP POLICY IF EXISTS "Family members can manage property events" ON public.property_events;
CREATE POLICY "Family members can manage property events"
ON public.property_events
FOR ALL
USING (family_id IN (
  SELECT members.family_id
  FROM members
  WHERE members.profile_id = auth.uid()
))
WITH CHECK (family_id IN (
  SELECT members.family_id
  FROM members
  WHERE members.profile_id = auth.uid()
) AND created_by = auth.uid());

-- Create RLS policies for property_rooms
DROP POLICY IF EXISTS "Family members can view property rooms" ON public.property_rooms;
CREATE POLICY "Family members can view property rooms"
ON public.property_rooms
FOR SELECT
USING (family_id IN (
  SELECT members.family_id
  FROM members
  WHERE members.profile_id = auth.uid()
));

DROP POLICY IF EXISTS "Family members can manage property rooms" ON public.property_rooms;
CREATE POLICY "Family members can manage property rooms"
ON public.property_rooms
FOR ALL
USING (family_id IN (
  SELECT members.family_id
  FROM members
  WHERE members.profile_id = auth.uid()
))
WITH CHECK (family_id IN (
  SELECT members.family_id
  FROM members
  WHERE members.profile_id = auth.uid()
) AND created_by = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_types ON public.properties USING GIN(property_types);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_property_occupancy_property_id ON public.property_occupancy(property_id);
CREATE INDEX IF NOT EXISTS idx_property_occupancy_person_id ON public.property_occupancy(person_id);
CREATE INDEX IF NOT EXISTS idx_property_visits_property_id ON public.property_visits(property_id);
CREATE INDEX IF NOT EXISTS idx_property_events_property_id ON public.property_events(property_id);
CREATE INDEX IF NOT EXISTS idx_property_rooms_property_id ON public.property_rooms(property_id);