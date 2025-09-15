-- Create analytics events table
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own events"
ON public.analytics_events
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view events from their families"
ON public.analytics_events
FOR SELECT
USING (
  user_id = auth.uid() OR 
  (family_id IS NOT NULL AND family_id IN (
    SELECT family_id FROM members WHERE profile_id = auth.uid()
  ))
);

-- Create indexes for performance
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_family_id ON public.analytics_events(family_id);
CREATE INDEX idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at);

-- Create function to update timestamps
CREATE TRIGGER update_analytics_events_updated_at
BEFORE UPDATE ON public.analytics_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();