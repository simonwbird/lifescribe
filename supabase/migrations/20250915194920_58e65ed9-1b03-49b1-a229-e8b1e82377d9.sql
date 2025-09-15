-- Add people fields for birthdays and life status
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS death_date date;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS is_living boolean DEFAULT true;

-- Create life_events table for memorable dates
CREATE TABLE public.life_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  person_id uuid REFERENCES public.people(id) ON DELETE CASCADE,
  with_person_id uuid REFERENCES public.people(id) ON DELETE SET NULL,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('anniversary', 'memorial', 'custom')),
  event_date date,
  event_date_text text, -- for partial dates like "December" or "1995"
  date_precision text DEFAULT 'ymd' CHECK (date_precision IN ('ymd', 'md', 'y')),
  recurrence text DEFAULT 'yearly' CHECK (recurrence IN ('yearly', 'none')),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on life_events
ALTER TABLE public.life_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for life_events
CREATE POLICY "Family members can view life events" 
ON public.life_events 
FOR SELECT 
USING (family_id IN ( 
  SELECT members.family_id
  FROM members
  WHERE (members.profile_id = auth.uid())
));

CREATE POLICY "Family members can create life events" 
ON public.life_events 
FOR INSERT 
WITH CHECK (
  family_id IN ( 
    SELECT members.family_id
    FROM members
    WHERE (members.profile_id = auth.uid())
  ) AND created_by = auth.uid()
);

CREATE POLICY "Family members can update life events" 
ON public.life_events 
FOR UPDATE 
USING (family_id IN ( 
  SELECT members.family_id
  FROM members
  WHERE (members.profile_id = auth.uid())
));

CREATE POLICY "Family members can delete life events" 
ON public.life_events 
FOR DELETE 
USING (family_id IN ( 
  SELECT members.family_id
  FROM members
  WHERE (members.profile_id = auth.uid())
));

-- Add updated_at trigger to life_events
CREATE TRIGGER update_life_events_updated_at
  BEFORE UPDATE ON public.life_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_life_events_family_id ON public.life_events(family_id);
CREATE INDEX idx_life_events_person_id ON public.life_events(person_id);
CREATE INDEX idx_life_events_event_date ON public.life_events(event_date);
CREATE INDEX idx_people_birth_date ON public.people(birth_date) WHERE birth_date IS NOT NULL;
CREATE INDEX idx_people_death_date ON public.people(death_date) WHERE death_date IS NOT NULL;