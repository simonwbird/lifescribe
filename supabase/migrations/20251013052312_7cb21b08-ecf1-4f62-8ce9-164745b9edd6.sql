-- Create tribute_sparks table for person-centric memory prompts
CREATE TABLE IF NOT EXISTS public.tribute_sparks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  category TEXT NOT NULL,
  relationship_targets TEXT[] DEFAULT '{}',
  seasonal_tags TEXT[] DEFAULT '{}',
  weight INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tribute_sparks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Everyone can read sparks (they're content templates)
CREATE POLICY "Anyone can view tribute sparks"
  ON public.tribute_sparks
  FOR SELECT
  USING (true);

-- System can manage sparks
CREATE POLICY "System can manage tribute sparks"
  ON public.tribute_sparks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for efficient category queries
CREATE INDEX idx_tribute_sparks_category ON public.tribute_sparks(category);
CREATE INDEX idx_tribute_sparks_relationship_targets ON public.tribute_sparks USING gin(relationship_targets);
CREATE INDEX idx_tribute_sparks_seasonal_tags ON public.tribute_sparks USING gin(seasonal_tags);

-- Seed the table with 60+ sparks across categories
INSERT INTO public.tribute_sparks (text, category, relationship_targets, seasonal_tags, weight) VALUES
  -- Universal (15)
  ('What made {{first_name}} laugh in a way you can still hear?', 'universal', '{}', '{}', 1),
  ('Finish the sentence: "{{first_name}} always…"', 'universal', '{}', '{}', 1),
  ('Tell us a moment that still makes you smile.', 'universal', '{}', '{}', 1),
  ('What did {{first_name}} care about most?', 'universal', '{}', '{}', 1),
  ('A phrase {{first_name}} used to say all the time?', 'universal', '{}', '{}', 1),
  ('What would surprise people who didn''t know {{first_name}} well?', 'universal', '{}', '{}', 1),
  ('The best advice {{first_name}} ever gave you?', 'universal', '{}', '{}', 1),
  ('A time {{first_name}} was stubborn in the best way.', 'universal', '{}', '{}', 1),
  ('What did {{first_name}} do when they were happy?', 'universal', '{}', '{}', 1),
  ('A quirk or habit that was so {{first_name}}.', 'universal', '{}', '{}', 1),
  ('How did {{first_name}} make you feel special?', 'universal', '{}', '{}', 1),
  ('What song, smell, or taste reminds you of {{first_name}}?', 'universal', '{}', '{}', 1),
  ('A time {{first_name}} surprised you.', 'universal', '{}', '{}', 1),
  ('What would {{first_name}} say about the world today?', 'universal', '{}', '{}', 1),
  ('One thing you wish everyone knew about {{first_name}}.', 'universal', '{}', '{}', 1),
  
  -- Photo-anchored (10)
  ('If this photo had audio, what would we hear?', 'photo', '{}', '{}', 1),
  ('What happened right before this photo was taken?', 'photo', '{}', '{}', 1),
  ('Tell us the story behind this image.', 'photo', '{}', '{}', 1),
  ('What was {{first_name}} thinking in this moment?', 'photo', '{}', '{}', 1),
  ('Where was this taken and why were you there?', 'photo', '{}', '{}', 1),
  ('Who took this photo and what were they feeling?', 'photo', '{}', '{}', 1),
  ('What happened right after this photo?', 'photo', '{}', '{}', 1),
  ('What season was this? What do you remember about that time?', 'photo', '{}', '{}', 1),
  ('Look at {{first_name}}''s expression—what''s behind it?', 'photo', '{}', '{}', 1),
  ('If you could step into this photo, what would you say?', 'photo', '{}', '{}', 1),
  
  -- Place-anchored (10)
  ('Your favorite walk with {{first_name}} in {{place}}—where to where?', 'place', '{}', '{}', 1),
  ('What did {{first_name}} love about {{place}}?', 'place', '{}', '{}', 1),
  ('Tell us about a meal you shared in {{place}}.', 'place', '{}', '{}', 1),
  ('What happened the first time {{first_name}} visited {{place}}?', 'place', '{}', '{}', 1),
  ('A quiet moment with {{first_name}} at {{place}}.', 'place', '{}', '{}', 1),
  ('What did {{place}} mean to {{first_name}}?', 'place', '{}', '{}', 1),
  ('A tradition {{first_name}} had at {{place}}.', 'place', '{}', '{}', 1),
  ('How did {{first_name}} describe {{place}} to others?', 'place', '{}', '{}', 1),
  ('Your last visit to {{place}} with {{first_name}}.', 'place', '{}', '{}', 1),
  ('What would {{first_name}} do on a perfect day at {{place}}?', 'place', '{}', '{}', 1),
  
  -- Relationship-specific: Grandchild (8)
  ('A rule {{first_name}} quietly let you break.', 'grandchild', '{grandchild}', '{}', 1),
  ('What did {{first_name}}''s house smell like?', 'grandchild', '{grandchild}', '{}', 1),
  ('A snack or treat that was special at {{first_name}}''s place.', 'grandchild', '{grandchild}', '{}', 1),
  ('What did you do together that was just for you two?', 'grandchild', '{grandchild}', '{}', 1),
  ('A story {{first_name}} told you over and over.', 'grandchild', '{grandchild}', '{}', 1),
  ('What did {{first_name}} teach you without words?', 'grandchild', '{grandchild}', '{}', 1),
  ('How did {{first_name}} spoil you?', 'grandchild', '{grandchild}', '{}', 1),
  ('What made {{first_name}}''s hugs different?', 'grandchild', '{grandchild}', '{}', 1),
  
  -- Relationship-specific: Child (8)
  ('A time {{first_name}} was proud of you.', 'child', '{child}', '{}', 1),
  ('What did {{first_name}} sacrifice for you that you only understand now?', 'child', '{child}', '{}', 1),
  ('A family rule {{first_name}} insisted on.', 'child', '{child}', '{}', 1),
  ('How did {{first_name}} show love without saying it?', 'child', '{child}', '{}', 1),
  ('What did {{first_name}} worry about most?', 'child', '{child}', '{}', 1),
  ('A tradition {{first_name}} started for your family.', 'child', '{child}', '{}', 1),
  ('What part of {{first_name}} do you see in yourself?', 'child', '{child}', '{}', 1),
  ('A conversation with {{first_name}} you wish you could have again.', 'child', '{child}', '{}', 1),
  
  -- Dates/Seasons (8)
  ('One habit of {{first_name}} you keep alive today.', 'anniversary', '{}', '{anniv}', 1),
  ('What was {{first_name}} like during the holidays?', 'seasonal', '{}', '{holiday, winter}', 1),
  ('A birthday memory with {{first_name}}.', 'seasonal', '{}', '{birthday}', 1),
  ('What did {{first_name}} do on their birthday?', 'seasonal', '{}', '{birthday}', 1),
  ('A summer tradition with {{first_name}}.', 'seasonal', '{}', '{summer}', 1),
  ('How {{first_name}} celebrated special occasions.', 'seasonal', '{}', '{holiday}', 1),
  ('What was {{first_name}}''s favorite season and why?', 'seasonal', '{}', '{}', 1),
  ('A holiday that wasn''t the same without {{first_name}}.', 'seasonal', '{}', '{holiday}', 1),
  
  -- Values (6)
  ('A small kindness {{first_name}} did that stuck with you?', 'values', '{}', '{}', 1),
  ('What principle did {{first_name}} live by?', 'values', '{}', '{}', 1),
  ('How did {{first_name}} treat people who couldn''t help them?', 'values', '{}', '{}', 1),
  ('What injustice moved {{first_name}} most?', 'values', '{}', '{}', 1),
  ('A choice {{first_name}} made that showed their character.', 'values', '{}', '{}', 1),
  ('What did {{first_name}} believe about family?', 'values', '{}', '{}', 1)
ON CONFLICT DO NOTHING;