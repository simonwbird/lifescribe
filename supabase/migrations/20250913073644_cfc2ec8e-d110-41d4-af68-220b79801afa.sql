-- New Family Tree Schema: Union/Family Node Pattern

-- First, let's create the new tables with the union/family model
CREATE TABLE IF NOT EXISTS public.tree_people (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL,
  given_name text,
  surname text,
  sex text CHECK (sex IN ('M', 'F', 'X')),
  birth_date text,
  death_date text,
  is_living boolean DEFAULT true,
  birth_place text,
  death_place text,
  profile_photo_url text,
  notes text,
  source_xref text, -- for GED imports like @I1@
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Indexes for performance
  CONSTRAINT tree_people_family_id_fkey FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

-- Families table represents unions between partners
CREATE TABLE IF NOT EXISTS public.tree_families (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL,
  partner1_id uuid,
  partner2_id uuid,
  relationship_type text DEFAULT 'married' CHECK (relationship_type IN ('married', 'partner', 'divorced', 'widowed', 'unknown')),
  start_date text,
  end_date text,
  source_xref text, -- for GED imports like @F1@
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT tree_families_family_id_fkey FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  CONSTRAINT tree_families_partner1_fkey FOREIGN KEY (partner1_id) REFERENCES tree_people(id) ON DELETE CASCADE,
  CONSTRAINT tree_families_partner2_fkey FOREIGN KEY (partner2_id) REFERENCES tree_people(id) ON DELETE CASCADE
);

-- Junction table linking children to family unions
CREATE TABLE IF NOT EXISTS public.tree_family_children (
  family_id uuid NOT NULL,
  child_id uuid NOT NULL,
  relationship_note text, -- for adoption, step-children, etc.
  created_at timestamp with time zone DEFAULT now(),
  
  PRIMARY KEY (family_id, child_id),
  CONSTRAINT tree_family_children_family_fkey FOREIGN KEY (family_id) REFERENCES tree_families(id) ON DELETE CASCADE,
  CONSTRAINT tree_family_children_child_fkey FOREIGN KEY (child_id) REFERENCES tree_people(id) ON DELETE CASCADE
);

-- Aliases for handling GED merges and name variations
CREATE TABLE IF NOT EXISTS public.tree_person_aliases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id uuid NOT NULL,
  alias text NOT NULL,
  alias_type text DEFAULT 'nickname',
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT tree_person_aliases_person_fkey FOREIGN KEY (person_id) REFERENCES tree_people(id) ON DELETE CASCADE
);

-- Tree preferences for home person selection
CREATE TABLE IF NOT EXISTS public.tree_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL,
  user_id uuid NOT NULL,
  home_person_id uuid,
  layout_settings jsonb DEFAULT '{}',
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT tree_preferences_family_fkey FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  CONSTRAINT tree_preferences_home_person_fkey FOREIGN KEY (home_person_id) REFERENCES tree_people(id) ON DELETE SET NULL,
  UNIQUE(family_id, user_id)
);

-- Import tracking for GED/CSV imports
CREATE TABLE IF NOT EXISTS public.tree_imports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL,
  imported_by uuid NOT NULL,
  import_type text NOT NULL CHECK (import_type IN ('gedcom', 'csv')),
  file_name text,
  file_path text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  people_count integer DEFAULT 0,
  families_count integer DEFAULT 0,
  errors_log jsonb DEFAULT '[]',
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  
  CONSTRAINT tree_imports_family_fkey FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tree_people_family_id ON tree_people(family_id);
CREATE INDEX IF NOT EXISTS idx_tree_people_surname ON tree_people(family_id, surname);
CREATE INDEX IF NOT EXISTS idx_tree_people_birth_date ON tree_people(family_id, birth_date);
CREATE INDEX IF NOT EXISTS idx_tree_people_source_xref ON tree_people(source_xref) WHERE source_xref IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tree_families_family_id ON tree_families(family_id);
CREATE INDEX IF NOT EXISTS idx_tree_families_partners ON tree_families(partner1_id, partner2_id);
CREATE INDEX IF NOT EXISTS idx_tree_families_source_xref ON tree_families(source_xref) WHERE source_xref IS NOT NULL;

-- Enable RLS on all tables
ALTER TABLE public.tree_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tree_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tree_family_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tree_person_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tree_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tree_imports ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Family members can manage their family's tree data
CREATE POLICY "Family members can view tree people" ON public.tree_people
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create tree people" ON public.tree_people
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT family_id FROM members WHERE profile_id = auth.uid()
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Family members can update tree people" ON public.tree_people
  FOR UPDATE USING (
    family_id IN (
      SELECT family_id FROM members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Family members can delete tree people" ON public.tree_people
  FOR DELETE USING (
    family_id IN (
      SELECT family_id FROM members WHERE profile_id = auth.uid()
    )
  );

-- Similar policies for tree_families
CREATE POLICY "Family members can view tree families" ON public.tree_families
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create tree families" ON public.tree_families
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT family_id FROM members WHERE profile_id = auth.uid()
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Family members can update tree families" ON public.tree_families
  FOR UPDATE USING (
    family_id IN (
      SELECT family_id FROM members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Family members can delete tree families" ON public.tree_families
  FOR DELETE USING (
    family_id IN (
      SELECT family_id FROM members WHERE profile_id = auth.uid()
    )
  );

-- Policies for tree_family_children
CREATE POLICY "Family members can manage tree family children" ON public.tree_family_children
  FOR ALL USING (
    family_id IN (
      SELECT tf.id FROM tree_families tf 
      WHERE tf.family_id IN (
        SELECT family_id FROM members WHERE profile_id = auth.uid()
      )
    )
  );

-- Policies for tree_person_aliases
CREATE POLICY "Family members can manage tree person aliases" ON public.tree_person_aliases
  FOR ALL USING (
    person_id IN (
      SELECT tp.id FROM tree_people tp 
      WHERE tp.family_id IN (
        SELECT family_id FROM members WHERE profile_id = auth.uid()
      )
    )
  );

-- Policies for tree_preferences
CREATE POLICY "Users can manage their own tree preferences" ON public.tree_preferences
  FOR ALL USING (user_id = auth.uid());

-- Policies for tree_imports
CREATE POLICY "Family members can view tree imports" ON public.tree_imports
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create tree imports" ON public.tree_imports
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT family_id FROM members WHERE profile_id = auth.uid()
    ) AND imported_by = auth.uid()
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_tree_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tree_people_updated_at 
  BEFORE UPDATE ON tree_people 
  FOR EACH ROW EXECUTE FUNCTION update_tree_updated_at_column();

CREATE TRIGGER update_tree_preferences_updated_at 
  BEFORE UPDATE ON tree_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_tree_updated_at_column();