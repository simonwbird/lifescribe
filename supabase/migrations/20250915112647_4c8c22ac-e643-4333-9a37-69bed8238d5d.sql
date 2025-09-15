-- Create weekly digest settings table
CREATE TABLE public.weekly_digest_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  delivery_day INTEGER NOT NULL DEFAULT 0 CHECK (delivery_day >= 0 AND delivery_day <= 6), -- 0 = Sunday, 1 = Monday, etc.
  delivery_hour INTEGER NOT NULL DEFAULT 9 CHECK (delivery_hour >= 0 AND delivery_hour <= 23), -- Hour in 24-hour format
  delivery_timezone TEXT NOT NULL DEFAULT 'UTC',
  recipients JSONB NOT NULL DEFAULT '{"all": true, "exclude": []}'::jsonb, -- {all: true, exclude: [user_ids]} or {all: false, include: [user_ids]}
  last_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  UNIQUE(family_id)
);

-- Enable RLS
ALTER TABLE public.weekly_digest_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for weekly digest settings
CREATE POLICY "Family admins can manage digest settings"
ON public.weekly_digest_settings
FOR ALL
USING (
  family_id IN (
    SELECT members.family_id
    FROM members
    WHERE members.profile_id = auth.uid()
    AND members.role = 'admin'::role_type
  )
)
WITH CHECK (
  family_id IN (
    SELECT members.family_id
    FROM members
    WHERE members.profile_id = auth.uid()
    AND members.role = 'admin'::role_type
  )
  AND created_by = auth.uid()
);

-- Family members can view digest settings
CREATE POLICY "Family members can view digest settings"
ON public.weekly_digest_settings
FOR SELECT
USING (
  family_id IN (
    SELECT members.family_id
    FROM members
    WHERE members.profile_id = auth.uid()
  )
);

-- Create digest logs table to track sent digests
CREATE TABLE public.weekly_digest_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL,
  digest_settings_id UUID NOT NULL REFERENCES weekly_digest_settings(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_to_emails JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of email addresses
  story_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for digest logs
ALTER TABLE public.weekly_digest_logs ENABLE ROW LEVEL SECURITY;

-- Family members can view digest logs
CREATE POLICY "Family members can view digest logs"
ON public.weekly_digest_logs
FOR SELECT
USING (
  family_id IN (
    SELECT members.family_id
    FROM members
    WHERE members.profile_id = auth.uid()
  )
);

-- Family admins can manage digest logs
CREATE POLICY "Family admins can manage digest logs"
ON public.weekly_digest_logs
FOR ALL
USING (
  family_id IN (
    SELECT members.family_id
    FROM members
    WHERE members.profile_id = auth.uid()
    AND members.role = 'admin'::role_type
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_weekly_digest_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_weekly_digest_settings_updated_at
BEFORE UPDATE ON public.weekly_digest_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_weekly_digest_settings_updated_at();