-- Drop existing table if it exists to start fresh
DROP TABLE IF EXISTS public.guestbook_entries CASCADE;

-- Create guestbook_entries table for both life and tribute pages
CREATE TABLE public.guestbook_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  page_type text NOT NULL CHECK (page_type IN ('life', 'tribute')),
  author_user uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,
  author_email text,
  message text NOT NULL,
  media_url text,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('only_me', 'inner_circle', 'family', 'public')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')),
  is_pinned boolean DEFAULT false,
  moderated_by uuid REFERENCES auth.users(id),
  moderated_at timestamptz,
  moderation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes for common queries
CREATE INDEX idx_guestbook_person_status ON public.guestbook_entries(person_id, status);
CREATE INDEX idx_guestbook_person_pagetype ON public.guestbook_entries(person_id, page_type);
CREATE INDEX idx_guestbook_author ON public.guestbook_entries(author_user) WHERE author_user IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.guestbook_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view approved entries or their own entries
CREATE POLICY "Users can view approved entries or own entries"
ON public.guestbook_entries
FOR SELECT
USING (
  status = 'approved' 
  OR auth.uid() = author_user
);

-- Policy: Anyone can create entries (including anonymous guests)
CREATE POLICY "Anyone can create guestbook entries"
ON public.guestbook_entries
FOR INSERT
WITH CHECK (true);

-- Policy: Page owners/stewards can moderate (update status, pin entries)
CREATE POLICY "Page owners can moderate guestbook entries"
ON public.guestbook_entries
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM public.person_roles pr
    WHERE pr.person_id = guestbook_entries.person_id
      AND pr.profile_id = auth.uid()
      AND pr.role IN ('owner', 'steward', 'co_curator')
      AND pr.revoked_at IS NULL
  )
);

-- Policy: Authors can delete their own entries
CREATE POLICY "Authors can delete own entries"
ON public.guestbook_entries
FOR DELETE
USING (auth.uid() = author_user);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_guestbook_entry_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger to update updated_at on changes
CREATE TRIGGER update_guestbook_entry_timestamp
BEFORE UPDATE ON public.guestbook_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_guestbook_entry_updated_at();