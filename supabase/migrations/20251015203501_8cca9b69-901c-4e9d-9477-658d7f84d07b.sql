-- Create property_reminders table (if not exists)
CREATE TABLE IF NOT EXISTS public.property_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  family_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on property_reminders
ALTER TABLE public.property_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for property_reminders
CREATE POLICY "Family members can view property reminders"
ON public.property_reminders FOR SELECT
USING (
  family_id IN (
    SELECT family_id FROM members WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Family members can create property reminders"
ON public.property_reminders FOR INSERT
WITH CHECK (
  family_id IN (
    SELECT family_id FROM members WHERE profile_id = auth.uid()
  ) AND created_by = auth.uid()
);

CREATE POLICY "Family members can update property reminders"
ON public.property_reminders FOR UPDATE
USING (
  family_id IN (
    SELECT family_id FROM members WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Family members can delete property reminders"
ON public.property_reminders FOR DELETE
USING (
  family_id IN (
    SELECT family_id FROM members WHERE profile_id = auth.uid()
  )
);

-- Create trigger for updated_at on property_reminders
CREATE TRIGGER update_property_reminders_updated_at
BEFORE UPDATE ON public.property_reminders
FOR EACH ROW
EXECUTE FUNCTION update_property_documents_updated_at();

-- Create story_property_links table (if not exists)
CREATE TABLE IF NOT EXISTS public.story_property_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL,
  property_id UUID NOT NULL,
  family_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(story_id, property_id)
);

-- Enable RLS on story_property_links
ALTER TABLE public.story_property_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for story_property_links
CREATE POLICY "Family members can view story property links"
ON public.story_property_links FOR SELECT
USING (
  family_id IN (
    SELECT family_id FROM members WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Family members can create story property links"
ON public.story_property_links FOR INSERT
WITH CHECK (
  family_id IN (
    SELECT family_id FROM members WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Family members can delete story property links"
ON public.story_property_links FOR DELETE
USING (
  family_id IN (
    SELECT family_id FROM members WHERE profile_id = auth.uid()
  )
);

-- Create media_property_links table (if not exists)
CREATE TABLE IF NOT EXISTS public.media_property_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL,
  property_id UUID NOT NULL,
  family_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(media_id, property_id)
);

-- Enable RLS on media_property_links
ALTER TABLE public.media_property_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for media_property_links
CREATE POLICY "Family members can view media property links"
ON public.media_property_links FOR SELECT
USING (
  family_id IN (
    SELECT family_id FROM members WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Family members can create media property links"
ON public.media_property_links FOR INSERT
WITH CHECK (
  family_id IN (
    SELECT family_id FROM members WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Family members can delete media property links"
ON public.media_property_links FOR DELETE
USING (
  family_id IN (
    SELECT family_id FROM members WHERE profile_id = auth.uid()
  )
);