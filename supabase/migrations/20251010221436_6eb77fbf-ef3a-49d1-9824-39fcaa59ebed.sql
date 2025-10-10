-- Create objects table (keepsakes, heirlooms, artifacts)
CREATE TABLE IF NOT EXISTS public.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  object_type text NOT NULL DEFAULT 'keepsake',
  acquired_date date,
  current_location text,
  estimated_value numeric,
  condition text,
  provenance text,
  cultural_significance text,
  media_ids uuid[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  visibility text NOT NULL DEFAULT 'family',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create places table (homes, schools, workplaces, landmarks)
CREATE TABLE IF NOT EXISTS public.places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name text NOT NULL,
  place_type text NOT NULL DEFAULT 'home',
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  latitude numeric,
  longitude numeric,
  geocode_hash text,
  description text,
  years_active text,
  significance text,
  media_ids uuid[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  visibility text NOT NULL DEFAULT 'family',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create projects table (life works, achievements, endeavors)
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name text NOT NULL,
  project_type text NOT NULL DEFAULT 'personal',
  description text,
  start_date date,
  end_date date,
  status text DEFAULT 'completed',
  achievements text,
  impact text,
  media_ids uuid[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  visibility text NOT NULL DEFAULT 'family',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create linking table for objects to people
CREATE TABLE IF NOT EXISTS public.object_person_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id uuid NOT NULL REFERENCES public.objects(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  relationship_type text NOT NULL DEFAULT 'owned',
  from_date date,
  to_date date,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(object_id, person_id)
);

-- Create linking table for places to people
CREATE TABLE IF NOT EXISTS public.place_person_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  relationship_type text NOT NULL DEFAULT 'lived',
  from_date date,
  to_date date,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(place_id, person_id, relationship_type)
);

-- Create linking table for projects to people
CREATE TABLE IF NOT EXISTS public.project_person_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'contributor',
  from_date date,
  to_date date,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(project_id, person_id, role)
);

-- Add constraints
ALTER TABLE public.objects
ADD CONSTRAINT objects_object_type_check 
CHECK (object_type IN ('keepsake', 'heirloom', 'artifact', 'document', 'artwork', 'tool', 'jewelry', 'furniture', 'clothing', 'other'));

ALTER TABLE public.places
ADD CONSTRAINT places_place_type_check 
CHECK (place_type IN ('home', 'school', 'workplace', 'landmark', 'hospital', 'church', 'cemetery', 'park', 'business', 'other'));

ALTER TABLE public.projects
ADD CONSTRAINT projects_project_type_check 
CHECK (project_type IN ('personal', 'professional', 'community', 'creative', 'academic', 'business', 'volunteer', 'other'));

ALTER TABLE public.projects
ADD CONSTRAINT projects_status_check 
CHECK (status IN ('planned', 'active', 'completed', 'abandoned', 'ongoing'));

-- Add visibility constraints
ALTER TABLE public.objects
ADD CONSTRAINT objects_visibility_check 
CHECK (visibility IN ('public', 'family', 'private'));

ALTER TABLE public.places
ADD CONSTRAINT places_visibility_check 
CHECK (visibility IN ('public', 'family', 'private'));

ALTER TABLE public.projects
ADD CONSTRAINT projects_visibility_check 
CHECK (visibility IN ('public', 'family', 'private'));

-- Create indexes
CREATE INDEX idx_objects_family_id ON public.objects(family_id);
CREATE INDEX idx_objects_object_type ON public.objects(object_type);
CREATE INDEX idx_places_family_id ON public.places(family_id);
CREATE INDEX idx_places_geocode_hash ON public.places(geocode_hash);
CREATE INDEX idx_places_place_type ON public.places(place_type);
CREATE INDEX idx_projects_family_id ON public.projects(family_id);
CREATE INDEX idx_object_person_links_object_id ON public.object_person_links(object_id);
CREATE INDEX idx_object_person_links_person_id ON public.object_person_links(person_id);
CREATE INDEX idx_place_person_links_place_id ON public.place_person_links(place_id);
CREATE INDEX idx_place_person_links_person_id ON public.place_person_links(person_id);
CREATE INDEX idx_project_person_links_project_id ON public.project_person_links(project_id);
CREATE INDEX idx_project_person_links_person_id ON public.project_person_links(person_id);

-- Enable RLS
ALTER TABLE public.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.object_person_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_person_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_person_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for objects
CREATE POLICY "Family members can view family objects"
ON public.objects FOR SELECT
USING (
  visibility = 'public' OR
  (family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid()))
);

CREATE POLICY "Family members can create objects"
ON public.objects FOR INSERT
WITH CHECK (
  family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid())
  AND created_by = auth.uid()
);

CREATE POLICY "Object creators can update their objects"
ON public.objects FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Object creators can delete their objects"
ON public.objects FOR DELETE
USING (created_by = auth.uid());

-- RLS Policies for places
CREATE POLICY "Family members can view family places"
ON public.places FOR SELECT
USING (
  visibility = 'public' OR
  (family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid()))
);

CREATE POLICY "Family members can create places"
ON public.places FOR INSERT
WITH CHECK (
  family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid())
  AND created_by = auth.uid()
);

CREATE POLICY "Place creators can update their places"
ON public.places FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Place creators can delete their places"
ON public.places FOR DELETE
USING (created_by = auth.uid());

-- RLS Policies for projects
CREATE POLICY "Family members can view family projects"
ON public.projects FOR SELECT
USING (
  visibility = 'public' OR
  (family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid()))
);

CREATE POLICY "Family members can create projects"
ON public.projects FOR INSERT
WITH CHECK (
  family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid())
  AND created_by = auth.uid()
);

CREATE POLICY "Project creators can update their projects"
ON public.projects FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Project creators can delete their projects"
ON public.projects FOR DELETE
USING (created_by = auth.uid());

-- RLS Policies for link tables
CREATE POLICY "Family members can view object links"
ON public.object_person_links FOR SELECT
USING (
  object_id IN (
    SELECT id FROM public.objects 
    WHERE family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid())
  )
);

CREATE POLICY "Family members can create object links"
ON public.object_person_links FOR INSERT
WITH CHECK (
  object_id IN (
    SELECT id FROM public.objects 
    WHERE family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid())
  )
);

CREATE POLICY "Family members can update object links"
ON public.object_person_links FOR UPDATE
USING (
  object_id IN (
    SELECT id FROM public.objects 
    WHERE family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid())
  )
);

CREATE POLICY "Family members can delete object links"
ON public.object_person_links FOR DELETE
USING (
  object_id IN (
    SELECT id FROM public.objects 
    WHERE family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid())
  )
);

-- Repeat for place links
CREATE POLICY "Family members can view place links"
ON public.place_person_links FOR SELECT
USING (
  place_id IN (
    SELECT id FROM public.places 
    WHERE family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid())
  )
);

CREATE POLICY "Family members can create place links"
ON public.place_person_links FOR INSERT
WITH CHECK (
  place_id IN (
    SELECT id FROM public.places 
    WHERE family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid())
  )
);

CREATE POLICY "Family members can update place links"
ON public.place_person_links FOR UPDATE
USING (
  place_id IN (
    SELECT id FROM public.places 
    WHERE family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid())
  )
);

CREATE POLICY "Family members can delete place links"
ON public.place_person_links FOR DELETE
USING (
  place_id IN (
    SELECT id FROM public.places 
    WHERE family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid())
  )
);

-- Repeat for project links
CREATE POLICY "Family members can view project links"
ON public.project_person_links FOR SELECT
USING (
  project_id IN (
    SELECT id FROM public.projects 
    WHERE family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid())
  )
);

CREATE POLICY "Family members can create project links"
ON public.project_person_links FOR INSERT
WITH CHECK (
  project_id IN (
    SELECT id FROM public.projects 
    WHERE family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid())
  )
);

CREATE POLICY "Family members can update project links"
ON public.project_person_links FOR UPDATE
USING (
  project_id IN (
    SELECT id FROM public.projects 
    WHERE family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid())
  )
);

CREATE POLICY "Family members can delete project links"
ON public.project_person_links FOR DELETE
USING (
  project_id IN (
    SELECT id FROM public.projects 
    WHERE family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid())
  )
);

-- Function to generate geocode hash for place de-duplication
CREATE OR REPLACE FUNCTION public.generate_geocode_hash(
  p_latitude numeric,
  p_longitude numeric,
  p_name text
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Round to 4 decimal places (about 11m accuracy) and combine with normalized name
  RETURN md5(
    ROUND(p_latitude, 4)::text || ',' || 
    ROUND(p_longitude, 4)::text || ',' ||
    lower(trim(regexp_replace(p_name, '\s+', ' ', 'g')))
  );
END;
$$;

-- Function to find duplicate places
CREATE OR REPLACE FUNCTION public.find_duplicate_places(
  p_family_id uuid,
  p_latitude numeric,
  p_longitude numeric,
  p_name text
)
RETURNS TABLE(
  id uuid,
  name text,
  place_type text,
  address text,
  similarity_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  search_geocode text;
BEGIN
  search_geocode := generate_geocode_hash(p_latitude, p_longitude, p_name);
  
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.place_type,
    p.address,
    CASE 
      WHEN p.geocode_hash = search_geocode THEN 1.0
      ELSE 0.7
    END as similarity_score
  FROM public.places p
  WHERE p.family_id = p_family_id
    AND (
      p.geocode_hash = search_geocode
      OR (
        p.latitude IS NOT NULL 
        AND p.longitude IS NOT NULL
        AND ABS(p.latitude - p_latitude) < 0.001
        AND ABS(p.longitude - p_longitude) < 0.001
      )
    )
  ORDER BY similarity_score DESC
  LIMIT 5;
END;
$$;

-- Trigger to auto-generate geocode hash on place insert/update
CREATE OR REPLACE FUNCTION public.update_place_geocode_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geocode_hash := generate_geocode_hash(NEW.latitude, NEW.longitude, NEW.name);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_place_geocode_hash
BEFORE INSERT OR UPDATE ON public.places
FOR EACH ROW
EXECUTE FUNCTION public.update_place_geocode_hash();