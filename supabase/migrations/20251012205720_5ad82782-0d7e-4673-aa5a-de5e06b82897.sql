-- Clean up and recreate notifications tables
DROP TABLE IF EXISTS public.comment_mentions CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;

-- Create notifications table  
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  related_entity_type TEXT,
  related_entity_id UUID,
  mentioned_person_id UUID REFERENCES public.people(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "System creates notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Create comment_mentions table
CREATE TABLE public.comment_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, person_id)
);

ALTER TABLE public.comment_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members view mentions"
ON public.comment_mentions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.comments c
  JOIN public.members m ON c.family_id = m.family_id
  WHERE c.id = comment_mentions.comment_id
  AND m.profile_id = auth.uid()
));

CREATE POLICY "System creates mentions"
ON public.comment_mentions FOR INSERT
WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_comment_mentions_comment_id ON public.comment_mentions(comment_id);
CREATE INDEX idx_comment_mentions_person_id ON public.comment_mentions(person_id);