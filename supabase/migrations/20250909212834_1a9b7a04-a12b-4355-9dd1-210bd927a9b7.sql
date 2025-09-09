-- Create Archive tables for Recipes, Things, and Properties

-- 1) Recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  created_by uuid NOT NULL,
  title text NOT NULL,
  source text,               -- e.g., "Grandma Helen" or cookbook
  serves text,               -- freeform "4–6"
  time_prep_minutes int,     -- nullable
  time_cook_minutes int,     -- nullable
  dietary_tags text[] DEFAULT '{}',  -- ["vegetarian","gluten-free"]
  ingredients jsonb DEFAULT '[]',    -- [{qty:"1 cup", item:"flour", note:"sifted"}]
  steps jsonb DEFAULT '[]',          -- [{step:1, text:"Do X"}]
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2) Things table
CREATE TABLE IF NOT EXISTS public.things (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  created_by uuid NOT NULL,
  title text NOT NULL,
  object_type text,         -- "artwork","jewelry","instrument","document","keepsake"
  year_estimated int,
  maker text,
  description text,
  provenance text,          -- ownership/story history
  condition text,
  value_estimate text,
  current_property_id uuid,
  room_hint text,           -- "Living room - above fireplace"
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3) Properties table  
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  created_by uuid NOT NULL,
  name text NOT NULL,
  address text,
  latitude double precision,
  longitude double precision,
  acquired_year int,
  sold_year int,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key for things -> properties after properties table exists
ALTER TABLE public.things 
ADD CONSTRAINT things_current_property_fkey 
FOREIGN KEY (current_property_id) REFERENCES public.properties(id) ON DELETE SET NULL;

-- 4) Link tables to associate narratives/people with entities
CREATE TABLE IF NOT EXISTS public.recipe_person_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL,
  person_id uuid NOT NULL,
  family_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(recipe_id, person_id)
);

CREATE TABLE IF NOT EXISTS public.thing_person_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thing_id uuid NOT NULL,
  person_id uuid NOT NULL,
  family_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(thing_id, person_id)
);

CREATE TABLE IF NOT EXISTS public.recipe_story_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL,
  story_id uuid NOT NULL,
  family_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(recipe_id, story_id)
);

CREATE TABLE IF NOT EXISTS public.thing_story_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thing_id uuid NOT NULL,
  story_id uuid NOT NULL,
  family_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(thing_id, story_id)
);

CREATE TABLE IF NOT EXISTS public.property_story_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  story_id uuid NOT NULL,
  family_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(property_id, story_id)
);

-- 5) Extend media table to support new entities
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS recipe_id uuid,
  ADD COLUMN IF NOT EXISTS thing_id uuid,
  ADD COLUMN IF NOT EXISTS property_id uuid;

-- Add foreign keys for media
ALTER TABLE public.media
  ADD CONSTRAINT media_recipe_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE,
  ADD CONSTRAINT media_thing_fkey FOREIGN KEY (thing_id) REFERENCES public.things(id) ON DELETE CASCADE,
  ADD CONSTRAINT media_property_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

-- Ensure only one parent per media item
ALTER TABLE public.media
  ADD CONSTRAINT media_single_parent CHECK (
    (CASE WHEN story_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN answer_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN recipe_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN thing_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN property_id IS NOT NULL THEN 1 ELSE 0 END) = 1
  );

-- 6) Indexes
CREATE INDEX IF NOT EXISTS idx_recipes_family ON public.recipes(family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_things_family ON public.things(family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_family ON public.properties(family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_recipe ON public.media(recipe_id);
CREATE INDEX IF NOT EXISTS idx_media_thing ON public.media(thing_id);
CREATE INDEX IF NOT EXISTS idx_media_property ON public.media(property_id);

-- 7) Add update triggers
CREATE TRIGGER update_recipes_updated_at
    BEFORE UPDATE ON public.recipes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_things_updated_at
    BEFORE UPDATE ON public.things
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 8) Enable RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.things ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_person_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thing_person_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_story_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thing_story_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_story_links ENABLE ROW LEVEL SECURITY;

-- 9) RLS Policies for main tables
-- Recipes policies
CREATE POLICY "Family members can view recipes" ON public.recipes
  FOR SELECT USING (family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()));

CREATE POLICY "Family members can create recipes" ON public.recipes
  FOR INSERT WITH CHECK (
    family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Family members can update recipes" ON public.recipes
  FOR UPDATE USING (family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()));

CREATE POLICY "Recipe authors can delete recipes" ON public.recipes
  FOR DELETE USING (created_by = auth.uid());

-- Things policies
CREATE POLICY "Family members can view things" ON public.things
  FOR SELECT USING (family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()));

CREATE POLICY "Family members can create things" ON public.things
  FOR INSERT WITH CHECK (
    family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Family members can update things" ON public.things
  FOR UPDATE USING (family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()));

CREATE POLICY "Thing authors can delete things" ON public.things
  FOR DELETE USING (created_by = auth.uid());

-- Properties policies
CREATE POLICY "Family members can view properties" ON public.properties
  FOR SELECT USING (family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()));

CREATE POLICY "Family members can create properties" ON public.properties
  FOR INSERT WITH CHECK (
    family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Family members can update properties" ON public.properties
  FOR UPDATE USING (family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()));

CREATE POLICY "Property authors can delete properties" ON public.properties
  FOR DELETE USING (created_by = auth.uid());

-- 10) RLS Policies for link tables
CREATE POLICY "Family members can manage recipe person links" ON public.recipe_person_links
  FOR ALL USING (family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()))
  WITH CHECK (family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()));

CREATE POLICY "Family members can manage thing person links" ON public.thing_person_links
  FOR ALL USING (family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()))
  WITH CHECK (family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()));

CREATE POLICY "Family members can manage recipe story links" ON public.recipe_story_links
  FOR ALL USING (family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()))
  WITH CHECK (family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()));

CREATE POLICY "Family members can manage thing story links" ON public.thing_story_links
  FOR ALL USING (family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()))
  WITH CHECK (family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()));

CREATE POLICY "Family members can manage property story links" ON public.property_story_links
  FOR ALL USING (family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()))
  WITH CHECK (family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()));

-- 11) Sample data for the Bird Family
INSERT INTO public.recipes (family_id, created_by, title, source, serves, time_prep_minutes, time_cook_minutes, ingredients, steps, notes)
VALUES (
  'a235280e-6110-4a83-a69b-a5ba34f676ba',
  'f328f60e-5379-465b-b1f9-2ed5226e1b49',
  'Grandma Mary''s Chocolate Chip Cookies',
  'Mary Bird (family recipe)',
  '24 cookies',
  15,
  12,
  '[
    {"qty": "2 1/4 cups", "item": "all-purpose flour", "note": ""},
    {"qty": "1 tsp", "item": "baking soda", "note": ""},
    {"qty": "1 cup", "item": "butter", "note": "softened"},
    {"qty": "3/4 cup", "item": "brown sugar", "note": "packed"},
    {"qty": "1/4 cup", "item": "white sugar", "note": ""},
    {"qty": "2", "item": "eggs", "note": "large"},
    {"qty": "2 cups", "item": "chocolate chips", "note": ""}
  ]',
  '[
    {"step": 1, "text": "Preheat oven to 375°F. Mix flour and baking soda in bowl."},
    {"step": 2, "text": "Cream butter and sugars until fluffy. Beat in eggs one at a time."},
    {"step": 3, "text": "Gradually add flour mixture. Stir in chocolate chips."},
    {"step": 4, "text": "Drop spoonfuls on ungreased cookie sheet. Bake 9-11 minutes until golden."}
  ]',
  'Mary''s secret was always using real butter and slightly underbaking them.'
);

INSERT INTO public.things (family_id, created_by, title, object_type, year_estimated, maker, description, provenance, condition)
VALUES (
  'a235280e-6110-4a83-a69b-a5ba34f676ba',
  'f328f60e-5379-465b-b1f9-2ed5226e1b49',
  'Antique Family Bible',
  'document',
  1890,
  'American Bible Society',
  'Large leather-bound family Bible with gilt pages and family tree inscriptions',
  'Brought from Ireland by great-grandfather Thomas Bird in 1895. Passed down through generations.',
  'Good - some wear on leather binding, pages intact'
);

INSERT INTO public.properties (family_id, created_by, name, address, acquired_year, description)
VALUES (
  'a235280e-6110-4a83-a69b-a5ba34f676ba',
  'f328f60e-5379-465b-b1f9-2ed5226e1b49',
  'The Bird Family Home',
  '123 Maple Street, Springfield, IL',
  1965,
  'Three-bedroom colonial where Robert and Mary raised their children. Features the famous workshop in the basement.'
);