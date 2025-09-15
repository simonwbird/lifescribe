-- Extend people table with Life/Tribute Page fields
ALTER TABLE people 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS favorites jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS pinned_story_ids text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS claimed_by_profile_id uuid REFERENCES auth.users(id);

-- Create life_events table for memorable dates
CREATE TABLE IF NOT EXISTS life_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  person_id uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL,
  event_date date,
  date_precision text DEFAULT 'ymd' CHECK (date_precision IN ('ymd', 'md', 'y')),
  recurrence text DEFAULT 'yearly' CHECK (recurrence IN ('yearly', 'none')),
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid NOT NULL
);

-- Create guestbook table for messages/tributes
CREATE TABLE IF NOT EXISTS guestbook (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  person_id uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  author_profile_id uuid NOT NULL,
  body text NOT NULL CHECK (length(body) <= 500),
  visibility text DEFAULT 'family' CHECK (visibility IN ('family', 'private')),
  is_hidden boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Create suggestions table for non-admin edits
CREATE TABLE IF NOT EXISTS suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  person_id uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  suggested_by uuid NOT NULL,
  suggestion_type text NOT NULL,
  payload jsonb NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone,
  resolved_by uuid
);

-- Enable RLS on new tables
ALTER TABLE life_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- RLS policies for life_events
CREATE POLICY "Family members can view life events" ON life_events
FOR SELECT USING (family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()));

CREATE POLICY "Family members can create life events" ON life_events
FOR INSERT WITH CHECK (
  family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()) AND
  created_by = auth.uid()
);

CREATE POLICY "Family members can update life events" ON life_events
FOR UPDATE USING (family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()));

CREATE POLICY "Family members can delete life events" ON life_events
FOR DELETE USING (family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()));

-- RLS policies for guestbook
CREATE POLICY "Family members can view guestbook entries" ON guestbook
FOR SELECT USING (family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()));

CREATE POLICY "Family members can create guestbook entries" ON guestbook
FOR INSERT WITH CHECK (
  family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()) AND
  author_profile_id = auth.uid()
);

CREATE POLICY "Authors can update their guestbook entries" ON guestbook
FOR UPDATE USING (author_profile_id = auth.uid());

CREATE POLICY "Authors can delete their guestbook entries" ON guestbook
FOR DELETE USING (author_profile_id = auth.uid());

-- RLS policies for suggestions
CREATE POLICY "Family members can view suggestions" ON suggestions
FOR SELECT USING (family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()));

CREATE POLICY "Family members can create suggestions" ON suggestions
FOR INSERT WITH CHECK (
  family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()) AND
  suggested_by = auth.uid()
);

CREATE POLICY "Family members can update suggestions" ON suggestions
FOR UPDATE USING (family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_life_events_person_id ON life_events(person_id);
CREATE INDEX IF NOT EXISTS idx_life_events_family_id ON life_events(family_id);
CREATE INDEX IF NOT EXISTS idx_guestbook_person_id ON guestbook(person_id);
CREATE INDEX IF NOT EXISTS idx_guestbook_family_id ON guestbook(family_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_person_id ON suggestions(person_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_family_id ON suggestions(family_id);