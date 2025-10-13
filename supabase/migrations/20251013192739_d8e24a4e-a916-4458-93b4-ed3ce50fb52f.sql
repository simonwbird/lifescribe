-- Create portfolio_subjects enum
CREATE TYPE portfolio_subject AS ENUM (
  'Math',
  'Science',
  'English',
  'History',
  'Geography',
  'Art',
  'Music',
  'Physical Education',
  'Technology',
  'Foreign Language',
  'Life Skills',
  'Other'
);

-- Create portfolios table
CREATE TABLE IF NOT EXISTS public.portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  subject portfolio_subject NOT NULL,
  completed_at date NOT NULL,
  skills text[] DEFAULT '{}',
  learning_objectives text,
  reflection text,
  is_highlight boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create portfolio_attachments table
CREATE TABLE IF NOT EXISTS public.portfolio_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

-- Create portfolio_reports table for saved reports
CREATE TABLE IF NOT EXISTS public.portfolio_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  subjects portfolio_subject[],
  total_items integer DEFAULT 0,
  skills_covered text[] DEFAULT '{}',
  report_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for portfolios
CREATE POLICY "Family members can view portfolios"
  ON public.portfolios FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create portfolios"
  ON public.portfolios FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Portfolio creators can update their portfolios"
  ON public.portfolios FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Portfolio creators can delete their portfolios"
  ON public.portfolios FOR DELETE
  USING (created_by = auth.uid());

-- RLS policies for portfolio_attachments
CREATE POLICY "Family members can view attachments"
  ON public.portfolio_attachments FOR SELECT
  USING (
    portfolio_id IN (
      SELECT id FROM public.portfolios
      WHERE family_id IN (
        SELECT family_id FROM public.members WHERE profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create attachments for their portfolios"
  ON public.portfolio_attachments FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND portfolio_id IN (
      SELECT id FROM public.portfolios WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own attachments"
  ON public.portfolio_attachments FOR DELETE
  USING (uploaded_by = auth.uid());

-- RLS policies for portfolio_reports
CREATE POLICY "Family members can view reports"
  ON public.portfolio_reports FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create reports"
  ON public.portfolio_reports FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Report creators can delete their reports"
  ON public.portfolio_reports FOR DELETE
  USING (created_by = auth.uid());

-- Function to generate portfolio report data
CREATE OR REPLACE FUNCTION public.generate_portfolio_report(
  p_family_id uuid,
  p_person_id uuid,
  p_start_date date,
  p_end_date date,
  p_subjects portfolio_subject[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  report_data jsonb;
  total_count integer;
  all_skills text[];
  highlights jsonb;
  subject_breakdown jsonb;
BEGIN
  -- Get total count
  SELECT COUNT(*) INTO total_count
  FROM public.portfolios
  WHERE family_id = p_family_id
    AND person_id = p_person_id
    AND completed_at BETWEEN p_start_date AND p_end_date
    AND (p_subjects IS NULL OR subject = ANY(p_subjects));
  
  -- Get all unique skills
  SELECT ARRAY_AGG(DISTINCT skill) INTO all_skills
  FROM public.portfolios,
       LATERAL unnest(skills) AS skill
  WHERE family_id = p_family_id
    AND person_id = p_person_id
    AND completed_at BETWEEN p_start_date AND p_end_date
    AND (p_subjects IS NULL OR subject = ANY(p_subjects));
  
  -- Get highlights
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'title', title,
      'subject', subject,
      'completed_at', completed_at,
      'description', description
    )
  ) INTO highlights
  FROM public.portfolios
  WHERE family_id = p_family_id
    AND person_id = p_person_id
    AND completed_at BETWEEN p_start_date AND p_end_date
    AND is_highlight = true
    AND (p_subjects IS NULL OR subject = ANY(p_subjects))
  ORDER BY completed_at DESC;
  
  -- Get subject breakdown
  SELECT jsonb_object_agg(
    subject,
    jsonb_build_object(
      'count', count,
      'skills', skills_array
    )
  ) INTO subject_breakdown
  FROM (
    SELECT 
      subject,
      COUNT(*) as count,
      ARRAY_AGG(DISTINCT skill) as skills_array
    FROM public.portfolios,
         LATERAL unnest(skills) AS skill
    WHERE family_id = p_family_id
      AND person_id = p_person_id
      AND completed_at BETWEEN p_start_date AND p_end_date
      AND (p_subjects IS NULL OR subject = ANY(p_subjects))
    GROUP BY subject
  ) AS subject_data;
  
  -- Build report data
  report_data := jsonb_build_object(
    'total_items', total_count,
    'skills_covered', COALESCE(all_skills, ARRAY[]::text[]),
    'skills_count', COALESCE(array_length(all_skills, 1), 0),
    'highlights', COALESCE(highlights, '[]'::jsonb),
    'subject_breakdown', COALESCE(subject_breakdown, '{}'::jsonb),
    'date_range', jsonb_build_object(
      'start', p_start_date,
      'end', p_end_date
    )
  );
  
  RETURN report_data;
END;
$$;

-- Create index for better performance
CREATE INDEX idx_portfolios_family_person ON public.portfolios(family_id, person_id);
CREATE INDEX idx_portfolios_completed_at ON public.portfolios(completed_at);
CREATE INDEX idx_portfolios_subject ON public.portfolios(subject);
CREATE INDEX idx_portfolios_skills ON public.portfolios USING gin(skills);