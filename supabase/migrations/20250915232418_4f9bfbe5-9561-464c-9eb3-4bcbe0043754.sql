-- Extend people table with Life/Tribute Page fields
ALTER TABLE people 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS favorites jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS pinned_story_ids text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS claimed_by_profile_id uuid;

-- Create guestbook table for messages/tributes (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'guestbook') THEN
        CREATE TABLE guestbook (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            family_id uuid NOT NULL,
            person_id uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
            author_profile_id uuid NOT NULL,
            body text NOT NULL CHECK (length(body) <= 500),
            visibility text DEFAULT 'family' CHECK (visibility IN ('family', 'private')),
            is_hidden boolean DEFAULT false,
            created_at timestamp with time zone DEFAULT now()
        );
        
        ALTER TABLE guestbook ENABLE ROW LEVEL SECURITY;
        
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

        CREATE INDEX idx_guestbook_person_id ON guestbook(person_id);
        CREATE INDEX idx_guestbook_family_id ON guestbook(family_id);
    END IF;
END $$;

-- Create suggestions table for non-admin edits (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'suggestions') THEN
        CREATE TABLE suggestions (
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
        
        ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Family members can view suggestions" ON suggestions
        FOR SELECT USING (family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()));

        CREATE POLICY "Family members can create suggestions" ON suggestions
        FOR INSERT WITH CHECK (
            family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()) AND
            suggested_by = auth.uid()
        );

        CREATE POLICY "Family members can update suggestions" ON suggestions
        FOR UPDATE USING (family_id IN (SELECT family_id FROM members WHERE profile_id = auth.uid()));

        CREATE INDEX idx_suggestions_person_id ON suggestions(person_id);
        CREATE INDEX idx_suggestions_family_id ON suggestions(family_id);
    END IF;
END $$;