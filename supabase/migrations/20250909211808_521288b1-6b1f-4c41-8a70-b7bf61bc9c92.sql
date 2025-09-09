-- Create comprehensive family tree schema

-- First create the relationship type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.relationship_type AS ENUM ('parent', 'spouse');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create people table
CREATE TABLE IF NOT EXISTS public.people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  given_name TEXT,
  middle_name TEXT,
  surname TEXT,
  birth_date DATE,
  death_date DATE,
  birth_year INTEGER,
  death_year INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'unknown')),
  avatar_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create relationships table
CREATE TABLE IF NOT EXISTS public.relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  from_person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  to_person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  relationship_type public.relationship_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(family_id, from_person_id, to_person_id, relationship_type),
  CHECK (from_person_id != to_person_id) -- No self-relationships
);

-- Create person_user_links table (links people to app users)
CREATE TABLE IF NOT EXISTS public.person_user_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(person_id, user_id),
  UNIQUE(user_id, family_id) -- One person per user per family
);

-- Create person_story_links table
CREATE TABLE IF NOT EXISTS public.person_story_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(person_id, story_id)
);

-- Create person_answer_links table
CREATE TABLE IF NOT EXISTS public.person_answer_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  answer_id UUID NOT NULL REFERENCES public.answers(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(person_id, answer_id)
);

-- Create tree_preferences table for root selection
CREATE TABLE IF NOT EXISTS public.tree_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  root_person_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, family_id)
);

-- Create GEDCOM import tables
CREATE TABLE IF NOT EXISTS public.gedcom_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'parsed', 'merged', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gedcom_people_stage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES public.gedcom_uploads(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  tag TEXT DEFAULT 'INDI',
  full_name TEXT,
  given_name TEXT,
  surname TEXT,
  birth_date DATE,
  death_date DATE,
  gender TEXT,
  notes TEXT,
  matched_person_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gedcom_relationships_stage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES public.gedcom_uploads(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  from_stage_id UUID NOT NULL REFERENCES public.gedcom_people_stage(id) ON DELETE CASCADE,
  to_stage_id UUID NOT NULL REFERENCES public.gedcom_people_stage(id) ON DELETE CASCADE,
  rel_type public.relationship_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create storage bucket for GEDCOM imports
INSERT INTO storage.buckets (id, name, public) 
VALUES ('imports', 'imports', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_user_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_story_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_answer_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tree_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gedcom_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gedcom_people_stage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gedcom_relationships_stage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for people
CREATE POLICY "Family members can view people" ON public.people
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid())
  );

CREATE POLICY "Family members can insert people" ON public.people
  FOR INSERT WITH CHECK (
    family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "Family members can update people" ON public.people
  FOR UPDATE USING (
    family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid())
  );

CREATE POLICY "Family members can delete people" ON public.people
  FOR DELETE USING (
    family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid())
  );

-- Create RLS policies for relationships
CREATE POLICY "Family members can view relationships" ON public.relationships
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid())
  );

CREATE POLICY "Family members can insert relationships" ON public.relationships
  FOR INSERT WITH CHECK (
    family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "Family members can update relationships" ON public.relationships
  FOR UPDATE USING (
    family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid())
  );

CREATE POLICY "Family members can delete relationships" ON public.relationships
  FOR DELETE USING (
    family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid())
  );

-- Create RLS policies for tree preferences
CREATE POLICY "Users can manage their tree preferences" ON public.tree_preferences
  FOR ALL USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for GEDCOM tables
CREATE POLICY "Family members can manage GEDCOM uploads" ON public.gedcom_uploads
  FOR ALL USING (
    EXISTS(SELECT 1 FROM members m WHERE m.family_id = gedcom_uploads.family_id AND m.profile_id = auth.uid())
  ) WITH CHECK (
    EXISTS(SELECT 1 FROM members m WHERE m.family_id = family_id AND m.profile_id = auth.uid())
  );

CREATE POLICY "Family members can manage GEDCOM staging people" ON public.gedcom_people_stage
  FOR ALL USING (
    EXISTS(SELECT 1 FROM members m WHERE m.family_id = gedcom_people_stage.family_id AND m.profile_id = auth.uid())
  ) WITH CHECK (
    EXISTS(SELECT 1 FROM members m WHERE m.family_id = family_id AND m.profile_id = auth.uid())
  );

CREATE POLICY "Family members can manage GEDCOM staging relationships" ON public.gedcom_relationships_stage
  FOR ALL USING (
    EXISTS(SELECT 1 FROM members m WHERE m.family_id = gedcom_relationships_stage.family_id AND m.profile_id = auth.uid())
  ) WITH CHECK (
    EXISTS(SELECT 1 FROM members m WHERE m.family_id = family_id AND m.profile_id = auth.uid())
  );

-- Create RLS policies for linking tables
CREATE POLICY "Family members can view person links" ON public.person_user_links
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid())
  );

CREATE POLICY "Family members can manage person links" ON public.person_user_links
  FOR ALL USING (
    family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid())
  ) WITH CHECK (
    family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid())
  );

CREATE POLICY "Family members can view person story links" ON public.person_story_links
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid())
  );

CREATE POLICY "Family members can manage person story links" ON public.person_story_links
  FOR ALL USING (
    family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid())
  ) WITH CHECK (
    family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid())
  );

CREATE POLICY "Family members can view person answer links" ON public.person_answer_links
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid())
  );

CREATE POLICY "Family members can manage person answer links" ON public.person_answer_links
  FOR ALL USING (
    family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid())
  ) WITH CHECK (
    family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid())
  );

-- Create storage policies for imports bucket
CREATE POLICY "Family members can upload GEDCOM files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'imports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Family members can view their GEDCOM files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'imports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create update trigger for people
CREATE OR REPLACE FUNCTION update_people_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER people_updated_at_trigger
  BEFORE UPDATE ON public.people
  FOR EACH ROW
  EXECUTE FUNCTION update_people_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_people_family_id ON public.people(family_id);
CREATE INDEX IF NOT EXISTS idx_relationships_family_id ON public.relationships(family_id);
CREATE INDEX IF NOT EXISTS idx_relationships_from_person ON public.relationships(from_person_id);
CREATE INDEX IF NOT EXISTS idx_relationships_to_person ON public.relationships(to_person_id);
CREATE INDEX IF NOT EXISTS idx_person_user_links_family_user ON public.person_user_links(family_id, user_id);
CREATE INDEX IF NOT EXISTS idx_tree_preferences_user_family ON public.tree_preferences(user_id, family_id);