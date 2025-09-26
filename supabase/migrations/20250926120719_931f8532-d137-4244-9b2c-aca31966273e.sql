-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('general','person_specific')),
  person_role TEXT, -- nullable for Phase 1
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create prompt_instances table
CREATE TABLE IF NOT EXISTS prompt_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  assignee_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'static',  -- Phase 1: 'static' only
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','completed')),
  person_ids UUID[] DEFAULT '{}',         -- unused in Phase 1
  due_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create prompt_responses table
CREATE TABLE IF NOT EXISTS prompt_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_instance_id UUID NOT NULL REFERENCES prompt_instances(id) ON DELETE CASCADE,
  author_user_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('text','audio','video','photo')),
  text_body TEXT,
  media_url TEXT,
  media_duration_seconds INT,
  caption TEXT,
  transcript TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompt_instances_family_status ON prompt_instances (family_id, status);
CREATE INDEX IF NOT EXISTS idx_prompt_instances_assignee ON prompt_instances (assignee_user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_responses_instance ON prompt_responses (prompt_instance_id);

-- Enable RLS
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompts (readable by all authenticated users)
CREATE POLICY "Prompts are readable by authenticated users" ON prompts
  FOR SELECT USING (auth.role() = 'authenticated' AND enabled = true);

-- RLS Policies for prompt_instances (family members only)
CREATE POLICY "Family members can view prompt instances" ON prompt_instances
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create prompt instances" ON prompt_instances
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT family_id FROM members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Family members can update prompt instances" ON prompt_instances
  FOR UPDATE USING (
    family_id IN (
      SELECT family_id FROM members WHERE profile_id = auth.uid()
    )
  );

-- RLS Policies for prompt_responses (family members only)
CREATE POLICY "Family members can view prompt responses" ON prompt_responses
  FOR SELECT USING (
    prompt_instance_id IN (
      SELECT pi.id FROM prompt_instances pi
      JOIN members m ON m.family_id = pi.family_id
      WHERE m.profile_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create prompt responses" ON prompt_responses
  FOR INSERT WITH CHECK (
    prompt_instance_id IN (
      SELECT pi.id FROM prompt_instances pi
      JOIN members m ON m.family_id = pi.family_id
      WHERE m.profile_id = auth.uid()
    ) AND author_user_id = auth.uid()
  );

CREATE POLICY "Response authors can update their responses" ON prompt_responses
  FOR UPDATE USING (author_user_id = auth.uid());

-- Trigger to update updated_at on prompt_instances
CREATE OR REPLACE FUNCTION update_prompt_instance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prompt_instances_updated_at
  BEFORE UPDATE ON prompt_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_instance_updated_at();

-- Function to create default prompt instances for a family
CREATE OR REPLACE FUNCTION create_default_prompt_instances(p_family_id UUID)
RETURNS INT AS $$
DECLARE
  instances_created INT := 0;
  prompt_record RECORD;
BEGIN
  -- Create instances for all general prompts
  FOR prompt_record IN 
    SELECT id FROM prompts WHERE scope = 'general' AND enabled = true
  LOOP
    INSERT INTO prompt_instances (prompt_id, family_id, source, status)
    VALUES (prompt_record.id, p_family_id, 'static', 'open');
    instances_created := instances_created + 1;
  END LOOP;
  
  RETURN instances_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;