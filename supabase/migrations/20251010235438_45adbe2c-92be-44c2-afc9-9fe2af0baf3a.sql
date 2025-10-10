-- Create guestbook_entries table
CREATE TABLE IF NOT EXISTS public.guestbook_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  visitor_name TEXT,
  visitor_email TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  page_type TEXT NOT NULL CHECK (page_type IN ('life', 'tribute')),
  moderation_reason TEXT,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMP WITH TIME ZONE,
  auto_approved BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT false,
  audio_recording_id UUID,
  is_featured BOOLEAN DEFAULT false,
  featured_at TIMESTAMP WITH TIME ZONE,
  featured_by UUID REFERENCES auth.users(id),
  featured_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_guestbook_person_page ON public.guestbook_entries(person_id, page_type, status);
CREATE INDEX idx_guestbook_family ON public.guestbook_entries(family_id, status);
CREATE INDEX idx_guestbook_featured ON public.guestbook_entries(person_id, page_type, is_featured, featured_order) WHERE is_featured = true;

-- Enable RLS
ALTER TABLE public.guestbook_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create entries (for public pages)
CREATE POLICY "Anyone can create guestbook entries"
ON public.guestbook_entries
FOR INSERT
WITH CHECK (true);

-- Policy: Family members can view all entries in their family
CREATE POLICY "Family members can view guestbook entries"
ON public.guestbook_entries
FOR SELECT
USING (
  status = 'approved' 
  OR family_id IN (
    SELECT family_id FROM public.members WHERE profile_id = auth.uid()
  )
);

-- Policy: Entry authors can view their own entries
CREATE POLICY "Entry authors can view own entries"
ON public.guestbook_entries
FOR SELECT
USING (
  profile_id = auth.uid() 
  OR (visitor_email IS NOT NULL AND visitor_email IN (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ))
);

-- Policy: Stewards can feature entries
CREATE POLICY "Stewards can feature guestbook entries"
ON public.guestbook_entries
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.person_roles pr
    WHERE pr.person_id = guestbook_entries.person_id
    AND pr.profile_id = auth.uid()
    AND pr.role IN ('owner', 'steward', 'co_curator')
    AND pr.revoked_at IS NULL
  )
);

-- Function to approve guestbook entry
CREATE OR REPLACE FUNCTION approve_guestbook_entry(
  p_entry_id UUID,
  p_moderator_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.guestbook_entries
  SET 
    status = 'approved',
    moderated_by = p_moderator_id,
    moderated_at = now()
  WHERE id = p_entry_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function to reject guestbook entry
CREATE OR REPLACE FUNCTION reject_guestbook_entry(
  p_entry_id UUID,
  p_moderator_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.guestbook_entries
  SET 
    status = 'rejected',
    moderated_by = p_moderator_id,
    moderated_at = now(),
    moderation_reason = p_reason
  WHERE id = p_entry_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function to pin a guestbook entry (max 3 featured)
CREATE OR REPLACE FUNCTION pin_guestbook_entry(
  p_entry_id UUID,
  p_person_id UUID,
  p_page_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  featured_count INTEGER;
  next_order INTEGER;
BEGIN
  -- Check if user has permission
  IF NOT has_person_role(auth.uid(), p_person_id, 'steward') 
     AND NOT has_person_role(auth.uid(), p_person_id, 'owner')
     AND NOT has_person_role(auth.uid(), p_person_id, 'co_curator') THEN
    RAISE EXCEPTION 'Insufficient permissions to feature entries';
  END IF;

  -- Count current featured entries
  SELECT COUNT(*) INTO featured_count
  FROM public.guestbook_entries
  WHERE person_id = p_person_id
  AND page_type = p_page_type
  AND is_featured = true;

  -- Check if limit reached
  IF featured_count >= 3 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Maximum of 3 featured tributes reached. Unpin one first.'
    );
  END IF;

  -- Get next order
  SELECT COALESCE(MAX(featured_order), 0) + 1 INTO next_order
  FROM public.guestbook_entries
  WHERE person_id = p_person_id
  AND page_type = p_page_type
  AND is_featured = true;

  -- Feature the entry
  UPDATE public.guestbook_entries
  SET 
    is_featured = true,
    featured_at = now(),
    featured_by = auth.uid(),
    featured_order = next_order
  WHERE id = p_entry_id;

  RETURN jsonb_build_object(
    'success', true,
    'featured_count', featured_count + 1
  );
END;
$$;

-- Function to unpin a guestbook entry
CREATE OR REPLACE FUNCTION unpin_guestbook_entry(
  p_entry_id UUID,
  p_person_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has permission
  IF NOT has_person_role(auth.uid(), p_person_id, 'steward') 
     AND NOT has_person_role(auth.uid(), p_person_id, 'owner')
     AND NOT has_person_role(auth.uid(), p_person_id, 'co_curator') THEN
    RAISE EXCEPTION 'Insufficient permissions to unfeature entries';
  END IF;

  -- Unfeature the entry
  UPDATE public.guestbook_entries
  SET 
    is_featured = false,
    featured_at = NULL,
    featured_by = NULL,
    featured_order = NULL
  WHERE id = p_entry_id;

  RETURN jsonb_build_object('success', true);
END;
$$;