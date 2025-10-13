-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  event_place TEXT,
  place_id UUID REFERENCES public.places(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled'))
);

-- Create event_rsvps table
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  guest_name TEXT,
  guest_email TEXT,
  response TEXT NOT NULL CHECK (response IN ('yes', 'no', 'maybe')),
  guest_count INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id),
  CONSTRAINT rsvp_identity_check CHECK (
    (user_id IS NOT NULL AND guest_name IS NULL AND guest_email IS NULL) OR
    (user_id IS NULL AND guest_name IS NOT NULL)
  )
);

-- Create event_roles table
CREATE TABLE IF NOT EXISTS public.event_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('host', 'helper', 'contributor')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id, role)
);

-- Create event_uploads table (for no-login uploads)
CREATE TABLE IF NOT EXISTS public.event_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  upload_token_id UUID REFERENCES public.event_upload_tokens(id),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  contributor_name TEXT,
  contributor_email TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Family members can view events"
  ON public.events FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create events"
  ON public.events FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Event creators can update events"
  ON public.events FOR UPDATE
  USING (created_by = auth.uid());

-- RLS Policies for event_rsvps
CREATE POLICY "Anyone can view RSVPs for family events"
  ON public.event_rsvps FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE family_id IN (
        SELECT family_id FROM public.members WHERE profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create their own RSVP"
  ON public.event_rsvps FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own RSVP"
  ON public.event_rsvps FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own RSVP"
  ON public.event_rsvps FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for event_roles
CREATE POLICY "Family members can view event roles"
  ON public.event_roles FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE family_id IN (
        SELECT family_id FROM public.members WHERE profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "Event hosts can manage roles"
  ON public.event_roles FOR ALL
  USING (
    event_id IN (
      SELECT event_id FROM public.event_roles
      WHERE user_id = auth.uid() AND role = 'host'
    )
  );

-- RLS Policies for event_uploads
CREATE POLICY "Family members can view event uploads"
  ON public.event_uploads FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Anyone with token can upload"
  ON public.event_uploads FOR INSERT
  WITH CHECK (upload_token_id IS NOT NULL);

-- Indexes
CREATE INDEX idx_events_family_id ON public.events(family_id);
CREATE INDEX idx_events_date ON public.events(event_date);
CREATE INDEX idx_event_rsvps_event_id ON public.event_rsvps(event_id);
CREATE INDEX idx_event_roles_event_id ON public.event_roles(event_id);
CREATE INDEX idx_event_uploads_event_id ON public.event_uploads(event_id);

-- Realtime for live RSVP updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_rsvps;
ALTER TABLE public.event_rsvps REPLICA IDENTITY FULL;