-- Create tributes table
CREATE TABLE public.tributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  person_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT NOT NULL DEFAULT 'soft_blue',
  privacy TEXT NOT NULL DEFAULT 'invite_only',
  anniversary_date DATE,
  how_we_met TEXT,
  what_they_taught_us TEXT,
  favorite_memory TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tribute_reactions table for candle reactions
CREATE TABLE public.tribute_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tribute_id UUID NOT NULL REFERENCES public.tributes(id) ON DELETE CASCADE,
  user_id UUID,
  guest_session_id TEXT,
  reaction_type TEXT NOT NULL DEFAULT 'candle',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reaction_user_check CHECK (
    (user_id IS NOT NULL AND guest_session_id IS NULL) OR
    (user_id IS NULL AND guest_session_id IS NOT NULL)
  ),
  UNIQUE(tribute_id, user_id, guest_session_id)
);

-- Create tribute_anniversary_reminders table
CREATE TABLE public.tribute_anniversary_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tribute_id UUID NOT NULL REFERENCES public.tributes(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL,
  reminder_date DATE NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tribute_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tribute_anniversary_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tributes
CREATE POLICY "Family members can view tributes"
  ON public.tributes FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create tributes"
  ON public.tributes FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Tribute creators can update their tributes"
  ON public.tributes FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Tribute creators can delete their tributes"
  ON public.tributes FOR DELETE
  USING (created_by = auth.uid());

-- RLS Policies for tribute_reactions
CREATE POLICY "Anyone can view tribute reactions"
  ON public.tribute_reactions FOR SELECT
  USING (
    tribute_id IN (
      SELECT id FROM public.tributes WHERE family_id IN (
        SELECT family_id FROM public.members WHERE profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create reactions"
  ON public.tribute_reactions FOR INSERT
  WITH CHECK (
    (user_id = auth.uid() AND guest_session_id IS NULL) OR
    (user_id IS NULL AND guest_session_id IS NOT NULL)
  );

CREATE POLICY "Users can delete their own reactions"
  ON public.tribute_reactions FOR DELETE
  USING (user_id = auth.uid() OR guest_session_id IS NOT NULL);

-- RLS Policies for anniversary reminders
CREATE POLICY "Users can view their own reminders"
  ON public.tribute_anniversary_reminders FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY "System can manage reminders"
  ON public.tribute_anniversary_reminders FOR ALL
  USING (true);

-- Create updated_at trigger for tributes
CREATE TRIGGER update_tributes_updated_at
  BEFORE UPDATE ON public.tributes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tree_updated_at_column();

-- Add tribute support to comments table (extend existing)
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS tribute_id UUID REFERENCES public.tributes(id) ON DELETE CASCADE;

-- Update comments RLS to include tributes
DROP POLICY IF EXISTS "Family members can view comments" ON public.comments;
CREATE POLICY "Family members can view comments"
  ON public.comments FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    )
  );