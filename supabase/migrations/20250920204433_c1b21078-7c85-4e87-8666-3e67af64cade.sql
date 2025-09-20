-- Create bug reporting system tables (fixed rollout_type)

-- Bug reports table
CREATE TABLE public.bug_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  expected_behavior text,
  actual_behavior text,
  notes text,
  severity text NOT NULL CHECK (severity IN ('Low', 'Medium', 'High')) DEFAULT 'Medium',
  status text NOT NULL CHECK (status IN ('New', 'In Progress', 'Fixed', 'Closed', 'Duplicate')) DEFAULT 'New',
  
  -- Auto-captured metadata
  url text NOT NULL,
  route text,
  user_id uuid NOT NULL,
  family_id uuid,
  app_version text DEFAULT '1.0.0',
  timezone text,
  locale text,
  viewport_width integer,
  viewport_height integer,
  user_agent text,
  
  -- Device info (if user consented)
  device_info jsonb DEFAULT '{}',
  consent_device_info boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone
);

-- Bug report screenshots/attachments
CREATE TABLE public.bug_report_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bug_report_id uuid NOT NULL REFERENCES public.bug_reports(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  attachment_type text NOT NULL CHECK (attachment_type IN ('screenshot', 'upload')) DEFAULT 'upload',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_report_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bug_reports
CREATE POLICY "Users can create bug reports" 
ON public.bug_reports 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own bug reports" 
ON public.bug_reports 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all bug reports" 
ON public.bug_reports 
FOR SELECT 
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update all bug reports" 
ON public.bug_reports 
FOR UPDATE 
USING (is_super_admin(auth.uid()));

-- RLS Policies for bug_report_attachments  
CREATE POLICY "Users can create attachments for their bug reports" 
ON public.bug_report_attachments 
FOR INSERT 
WITH CHECK (
  bug_report_id IN (
    SELECT id FROM public.bug_reports WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view attachments for their bug reports" 
ON public.bug_report_attachments 
FOR SELECT 
USING (
  bug_report_id IN (
    SELECT id FROM public.bug_reports WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can view all bug report attachments" 
ON public.bug_report_attachments 
FOR SELECT 
USING (is_super_admin(auth.uid()));

-- Add update trigger for bug_reports
CREATE TRIGGER update_bug_reports_updated_at
BEFORE UPDATE ON public.bug_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create feature flag for bug reporting (using global rollout)
INSERT INTO public.feature_flags (
  key,
  name,
  description,
  status,
  rollout_type,
  rollout_percentage,
  created_by
) VALUES (
  'bug_reporting_v1',
  'Bug Reporting System V1',
  'Enable bug reporting widget for family testers',
  'active',
  'global',
  0,
  '00000000-0000-0000-0000-000000000000'
) ON CONFLICT (key) DO NOTHING;

-- Create targeting rule for FAMILY_TESTER role
INSERT INTO public.feature_flag_targeting (
  flag_id,
  targeting_type,
  targeting_value,
  rollout_percentage,
  is_enabled
) 
SELECT 
  ff.id,
  'role',
  '["FAMILY_TESTER"]',
  100,
  true
FROM public.feature_flags ff 
WHERE ff.key = 'bug_reporting_v1'
ON CONFLICT DO NOTHING;