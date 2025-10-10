-- Create event upload tokens table
CREATE TABLE IF NOT EXISTS public.event_upload_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.life_events(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  family_id UUID NOT NULL REFERENCES public.families(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_uploads INTEGER DEFAULT NULL,
  current_uploads INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES auth.users(id)
);

-- Create event uploads table
CREATE TABLE IF NOT EXISTS public.event_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.life_events(id) ON DELETE CASCADE,
  upload_token_id UUID REFERENCES public.event_upload_tokens(id),
  family_id UUID NOT NULL REFERENCES public.families(id),
  media_id UUID REFERENCES public.media(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_note TEXT,
  tagged_people UUID[] DEFAULT '{}',
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Create event recaps table
CREATE TABLE IF NOT EXISTS public.event_recaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.life_events(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  title TEXT,
  hero_collage_url TEXT,
  content JSONB DEFAULT '{}',
  photo_ids UUID[] DEFAULT '{}',
  attendee_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  auto_generated BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.event_upload_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_recaps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_upload_tokens
CREATE POLICY "Family members can view upload tokens"
  ON public.event_upload_tokens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.profile_id = auth.uid()
      AND members.family_id = event_upload_tokens.family_id
    )
  );

CREATE POLICY "Family admins can create upload tokens"
  ON public.event_upload_tokens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.profile_id = auth.uid()
      AND members.family_id = event_upload_tokens.family_id
      AND members.role = 'admin'
    )
  );

CREATE POLICY "Family admins can update upload tokens"
  ON public.event_upload_tokens FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.profile_id = auth.uid()
      AND members.family_id = event_upload_tokens.family_id
      AND members.role = 'admin'
    )
  );

-- RLS Policies for event_uploads
CREATE POLICY "Family members can view uploads"
  ON public.event_uploads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.profile_id = auth.uid()
      AND members.family_id = event_uploads.family_id
    )
  );

CREATE POLICY "Anyone can insert uploads with valid token"
  ON public.event_uploads FOR INSERT
  WITH CHECK (true);

-- RLS Policies for event_recaps
CREATE POLICY "Family members can view recaps"
  ON public.event_recaps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.profile_id = auth.uid()
      AND members.family_id = event_recaps.family_id
    )
  );

CREATE POLICY "Family admins can manage recaps"
  ON public.event_recaps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.profile_id = auth.uid()
      AND members.family_id = event_recaps.family_id
      AND members.role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX idx_event_upload_tokens_event ON public.event_upload_tokens(event_id);
CREATE INDEX idx_event_upload_tokens_token ON public.event_upload_tokens(token);
CREATE INDEX idx_event_uploads_event ON public.event_uploads(event_id);
CREATE INDEX idx_event_recaps_event ON public.event_recaps(event_id);

-- Function to generate unique upload token
CREATE OR REPLACE FUNCTION generate_event_upload_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_token TEXT;
  token_exists BOOLEAN;
BEGIN
  LOOP
    new_token := encode(gen_random_bytes(16), 'hex');
    
    SELECT EXISTS(
      SELECT 1 FROM event_upload_tokens WHERE token = new_token
    ) INTO token_exists;
    
    EXIT WHEN NOT token_exists;
  END LOOP;
  
  RETURN new_token;
END;
$$;