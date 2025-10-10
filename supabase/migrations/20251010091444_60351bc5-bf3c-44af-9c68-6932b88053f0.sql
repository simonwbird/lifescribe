-- Create safebox waitlist table
CREATE TABLE IF NOT EXISTS public.safebox_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  family_id UUID REFERENCES public.families(id),
  email TEXT NOT NULL,
  role_intent TEXT NOT NULL CHECK (role_intent IN ('owner', 'executor', 'guardian', 'beneficiary')),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'contacted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  contacted_at TIMESTAMP WITH TIME ZONE,
  contacted_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.safebox_waitlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for safebox_waitlist
CREATE POLICY "Users can submit their own waitlist entry"
  ON public.safebox_waitlist FOR INSERT
  WITH CHECK (
    (user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can view their own waitlist entry"
  ON public.safebox_waitlist FOR SELECT
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.settings->>'role' = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage waitlist"
  ON public.safebox_waitlist FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.settings->>'role' = 'super_admin'
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_safebox_waitlist_email ON public.safebox_waitlist(email);
CREATE INDEX idx_safebox_waitlist_status ON public.safebox_waitlist(status);
CREATE INDEX idx_safebox_waitlist_created ON public.safebox_waitlist(created_at DESC);