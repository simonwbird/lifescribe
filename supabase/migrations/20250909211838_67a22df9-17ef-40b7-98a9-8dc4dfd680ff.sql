-- Create missing tables and policies for family tree

-- Create missing staging tables for GEDCOM
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

-- Create missing linking tables
CREATE TABLE IF NOT EXISTS public.person_story_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(person_id, story_id)
);

CREATE TABLE IF NOT EXISTS public.person_answer_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  answer_id UUID NOT NULL REFERENCES public.answers(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(person_id, answer_id)
);

-- Create imports storage bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('imports', 'imports', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.gedcom_people_stage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gedcom_relationships_stage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_story_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_answer_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new staging tables (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gedcom_people_stage') THEN
    EXECUTE 'CREATE POLICY "Family members can manage GEDCOM staging people" ON public.gedcom_people_stage
      FOR ALL USING (
        EXISTS(SELECT 1 FROM members m WHERE m.family_id = gedcom_people_stage.family_id AND m.profile_id = auth.uid())
      ) WITH CHECK (
        EXISTS(SELECT 1 FROM members m WHERE m.family_id = family_id AND m.profile_id = auth.uid())
      )';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gedcom_relationships_stage') THEN
    EXECUTE 'CREATE POLICY "Family members can manage GEDCOM staging relationships" ON public.gedcom_relationships_stage
      FOR ALL USING (
        EXISTS(SELECT 1 FROM members m WHERE m.family_id = gedcom_relationships_stage.family_id AND m.profile_id = auth.uid())
      ) WITH CHECK (
        EXISTS(SELECT 1 FROM members m WHERE m.family_id = family_id AND m.profile_id = auth.uid())
      )';
  END IF;
END $$;

-- Create RLS policies for linking tables (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'person_story_links') THEN
    EXECUTE 'CREATE POLICY "Family members can manage person story links" ON public.person_story_links
      FOR ALL USING (
        family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid())
      ) WITH CHECK (
        family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid())
      )';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'person_answer_links') THEN
    EXECUTE 'CREATE POLICY "Family members can manage person answer links" ON public.person_answer_links
      FOR ALL USING (
        family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid())
      ) WITH CHECK (
        family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid())
      )';
  END IF;
END $$;

-- Create storage policies for imports bucket (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Family members can upload GEDCOM files') THEN
    EXECUTE 'CREATE POLICY "Family members can upload GEDCOM files" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = ''imports'' AND
        auth.uid()::text = (storage.foldername(name))[1]
      )';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Family members can view their GEDCOM files') THEN
    EXECUTE 'CREATE POLICY "Family members can view their GEDCOM files" ON storage.objects
      FOR SELECT USING (
        bucket_id = ''imports'' AND
        auth.uid()::text = (storage.foldername(name))[1]
      )';
  END IF;
END $$;