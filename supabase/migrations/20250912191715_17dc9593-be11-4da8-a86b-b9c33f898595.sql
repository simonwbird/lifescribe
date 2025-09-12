-- Create enum for property types
CREATE TYPE public.property_type AS ENUM (
  'house', 'apartment', 'townhouse', 'cottage', 'villa', 'holiday_home', 
  'farm', 'ranch', 'student_housing', 'military_housing', 'multi_unit', 
  'caravan', 'motorhome', 'houseboat', 'boat', 'bungalow', 'duplex', 
  'terrace', 'loft', 'studio', 'retirement_home', 'boarding_house', 
  'ancestral_home', 'business_premises', 'land', 'other'
);

-- Create enum for address visibility
CREATE TYPE public.address_visibility AS ENUM ('exact', 'street_hidden', 'city_only');

-- Create enum for property status
CREATE TYPE public.property_status AS ENUM ('current', 'sold', 'rented', 'demolished', 'unknown');

-- Create enum for occupancy roles
CREATE TYPE public.occupancy_role AS ENUM ('owner', 'tenant', 'child', 'guest', 'host', 'relative', 'roommate');

-- Create enum for visit occasions
CREATE TYPE public.visit_occasion AS ENUM ('holiday', 'celebration', 'reunion', 'other');

-- Create enum for property event types
CREATE TYPE public.property_event_type AS ENUM (
  'moved_in', 'moved_out', 'purchase', 'sale', 'renovation', 'extension', 
  'garden_change', 'birth', 'party', 'storm', 'flood', 'fire', 'holiday', 
  'photo_taken', 'other'
);

-- Create enum for media roles specific to properties
CREATE TYPE public.property_media_role AS ENUM (
  'cover', 'then', 'now', 'floorplan', 'deed', 'mortgage', 'survey', 
  'letter', 'bill', 'receipt', 'newspaper_clipping', 'general'
);

-- Create properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_title TEXT NOT NULL,
  property_types property_type[] NOT NULL DEFAULT '{}',
  address JSONB, -- {line1, line2, city, region, postcode, country}
  geocode JSONB, -- {lat, lng}
  address_visibility address_visibility DEFAULT 'exact',
  map_visibility BOOLEAN DEFAULT true,
  built_year INTEGER,
  built_year_circa BOOLEAN DEFAULT false,
  first_known_date DATE,
  first_known_circa BOOLEAN DEFAULT false,
  last_known_date DATE,
  last_known_circa BOOLEAN DEFAULT false,
  status property_status DEFAULT 'current',
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  cover_media_id UUID,
  family_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Create occupancy table (Person ↔ Property)
CREATE TABLE public.property_occupancy (
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

-- Enable RLS on property_occupancy
ALTER TABLE public.property_occupancy ENABLE ROW LEVEL SECURITY;

-- Create visits table for holiday/short stays
CREATE TABLE public.property_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  people_ids UUID[] DEFAULT '{}',
  start_date DATE,
  end_date DATE,
  recurring_pattern TEXT, -- e.g., "every August 1992-2001"
  occasion visit_occasion DEFAULT 'holiday',
  notes TEXT,
  family_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on property_visits
ALTER TABLE public.property_visits ENABLE ROW LEVEL SECURITY;

-- Create property timeline entries/events
CREATE TABLE public.property_events (
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

-- Enable RLS on property_events
ALTER TABLE public.property_events ENABLE ROW LEVEL SECURITY;

-- Create rooms table (optional, lightweight)
CREATE TABLE public.property_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  family_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on property_rooms
ALTER TABLE public.property_rooms ENABLE ROW LEVEL SECURITY;

-- Add property links to existing tables
ALTER TABLE public.things ADD COLUMN lives_at_property_id UUID REFERENCES public.properties(id);
ALTER TABLE public.things ADD COLUMN room_id UUID REFERENCES public.property_rooms(id);

ALTER TABLE public.stories ADD COLUMN happened_at_property_id UUID REFERENCES public.properties(id);

ALTER TABLE public.pets ADD COLUMN home_property_id UUID REFERENCES public.properties(id);

-- Add property media role to media table
ALTER TABLE public.media ADD COLUMN property_media_role property_media_role DEFAULT 'general';

-- Create RLS policies for properties
CREATE POLICY "Family members can view properties"
ON public.properties
FOR SELECT
USING (family_id IN (
  SELECT members.family_id
  FROM members
  WHERE members.profile_id = auth.uid()
));

CREATE POLICY "Family members can create properties"
ON public.properties
FOR INSERT
WITH CHECK (
  family_id IN (
    SELECT members.family_id
    FROM members
    WHERE members.profile_id = auth.uid()
  ) AND created_by = auth.uid()
);

CREATE POLICY "Property authors can update properties"
ON public.properties
FOR UPDATE
USING (
  family_id IN (
    SELECT members.family_id
    FROM members
    WHERE members.profile_id = auth.uid()
  )
);

CREATE POLICY "Property authors can delete properties"
ON public.properties
FOR DELETE
USING (created_by = auth.uid());

-- Create RLS policies for property_occupancy
CREATE POLICY "Family members can view property occupancy"
ON public.property_occupancy
FOR SELECT
USING (family_id IN (
  SELECT members.family_id
  FROM members
  WHERE members.profile_id = auth.uid()
));

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
CREATE POLICY "Family members can view property visits"
ON public.property_visits
FOR SELECT
USING (family_id IN (
  SELECT members.family_id
  FROM members
  WHERE members.profile_id = auth.uid()
));

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
CREATE POLICY "Family members can view property events"
ON public.property_events
FOR SELECT
USING (family_id IN (
  SELECT members.family_id
  FROM members
  WHERE members.profile_id = auth.uid()
));

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
CREATE POLICY "Family members can view property rooms"
ON public.property_rooms
FOR SELECT
USING (family_id IN (
  SELECT members.family_id
  FROM members
  WHERE members.profile_id = auth.uid()
));

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

-- Create triggers for updated_at
CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_properties_family_id ON public.properties(family_id);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_types ON public.properties USING GIN(property_types);
CREATE INDEX idx_property_occupancy_property_id ON public.property_occupancy(property_id);
CREATE INDEX idx_property_occupancy_person_id ON public.property_occupancy(person_id);
CREATE INDEX idx_property_visits_property_id ON public.property_visits(property_id);
CREATE INDEX idx_property_events_property_id ON public.property_events(property_id);
CREATE INDEX idx_property_rooms_property_id ON public.property_rooms(property_id);