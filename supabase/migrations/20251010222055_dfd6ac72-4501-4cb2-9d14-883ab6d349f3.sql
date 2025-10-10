-- Add indexability and OG metadata to people table directly
ALTER TABLE public.people
ADD COLUMN IF NOT EXISTS indexability text NOT NULL DEFAULT 'private' CHECK (indexability IN ('private', 'unlisted', 'public_indexable')),
ADD COLUMN IF NOT EXISTS og_title text,
ADD COLUMN IF NOT EXISTS og_description text,
ADD COLUMN IF NOT EXISTS og_image_url text;

-- Create index on indexability for sitemap generation
CREATE INDEX IF NOT EXISTS idx_people_indexability ON public.people(indexability) WHERE indexability = 'public_indexable';

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_people_slug ON public.people(slug) WHERE slug IS NOT NULL;

-- Function to generate unique slug from person name
CREATE OR REPLACE FUNCTION public.generate_person_slug(p_given_name text, p_surname text, p_person_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Create base slug from name
  base_slug := lower(trim(regexp_replace(
    COALESCE(p_given_name, '') || '-' || COALESCE(p_surname, ''),
    '[^a-zA-Z0-9]+', '-', 'g'
  )));
  
  -- Remove leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  
  -- If empty, use person_id
  IF base_slug = '' THEN
    base_slug := 'person-' || substring(p_person_id::text from 1 for 8);
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (
    SELECT 1 FROM public.people WHERE slug = final_slug AND id != p_person_id
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Trigger to auto-generate slug for people
CREATE OR REPLACE FUNCTION public.auto_generate_person_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := generate_person_slug(NEW.given_name, NEW.surname, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_generate_person_slug ON public.people;
CREATE TRIGGER trigger_auto_generate_person_slug
BEFORE INSERT OR UPDATE ON public.people
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_person_slug();

-- Backfill slugs for existing people
UPDATE public.people
SET slug = generate_person_slug(given_name, surname, id)
WHERE slug IS NULL;

-- Create view for public indexable pages (for sitemap generation)
CREATE OR REPLACE VIEW public.public_person_pages AS
SELECT 
  p.id,
  p.slug,
  p.given_name,
  p.surname,
  p.full_name,
  p.birth_date,
  p.death_date,
  p.avatar_url,
  p.is_living,
  p.bio,
  p.family_id,
  p.indexability,
  p.og_title,
  p.og_description,
  p.og_image_url,
  p.updated_at
FROM public.people p
WHERE p.indexability = 'public_indexable' AND p.slug IS NOT NULL;

-- Grant access to view for sitemap generation
GRANT SELECT ON public.public_person_pages TO authenticated;
GRANT SELECT ON public.public_person_pages TO anon;