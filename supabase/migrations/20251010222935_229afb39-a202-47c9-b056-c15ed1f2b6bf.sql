-- Create export jobs tracking table
CREATE TABLE IF NOT EXISTS public.export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('json', 'pdf')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  include_private BOOLEAN DEFAULT false,
  file_url TEXT,
  file_size_bytes INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);

-- Create import jobs tracking table
CREATE TABLE IF NOT EXISTS public.import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partial')),
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  error_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS on export_jobs
ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own export jobs
CREATE POLICY "Users can view own export jobs"
ON public.export_jobs
FOR SELECT
USING (created_by = auth.uid());

-- Policy: Users can create export jobs if they have appropriate role
CREATE POLICY "Users can create export jobs"
ON public.export_jobs
FOR INSERT
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.person_roles
    WHERE person_id = export_jobs.person_id
      AND profile_id = auth.uid()
      AND role IN ('owner', 'steward', 'co_curator', 'contributor')
      AND revoked_at IS NULL
  )
);

-- Enable RLS on import_jobs
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own import jobs
CREATE POLICY "Users can view own import jobs"
ON public.import_jobs
FOR SELECT
USING (created_by = auth.uid());

-- Policy: Users can create import jobs if they have appropriate role
CREATE POLICY "Users can create import jobs"
ON public.import_jobs
FOR INSERT
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.person_roles
    WHERE person_id = import_jobs.person_id
      AND profile_id = auth.uid()
      AND role IN ('owner', 'steward', 'co_curator')
      AND revoked_at IS NULL
  )
);

-- Policy: System can update import jobs
CREATE POLICY "System can update import jobs"
ON public.import_jobs
FOR UPDATE
USING (true);

-- Policy: System can update export jobs
CREATE POLICY "System can update export jobs"
ON public.export_jobs
FOR UPDATE
USING (true);

-- Function to clean up expired exports
CREATE OR REPLACE FUNCTION public.cleanup_expired_exports()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.export_jobs
  WHERE expires_at < now() AND status = 'completed';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_export_jobs_person_id ON public.export_jobs(person_id);
CREATE INDEX IF NOT EXISTS idx_export_jobs_created_by ON public.export_jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON public.export_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_person_id ON public.import_jobs(person_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_by ON public.import_jobs(created_by);