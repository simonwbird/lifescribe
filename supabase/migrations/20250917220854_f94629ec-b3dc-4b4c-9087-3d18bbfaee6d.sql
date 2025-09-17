-- Create notifications table for @mentions and other alerts
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('mention', 'story_added', 'photo_tagged', 'comment')),
  title text NOT NULL,
  message text NOT NULL,
  story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE,
  media_id uuid REFERENCES public.media(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (recipient_id = auth.uid());

CREATE POLICY "Users can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (sender_id = auth.uid() AND family_id IN (
  SELECT members.family_id FROM members WHERE members.profile_id = auth.uid()
));

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (recipient_id = auth.uid());

-- Index for better performance
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(recipient_id, is_read) WHERE NOT is_read;