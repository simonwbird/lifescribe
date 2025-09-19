-- Create media pipeline enums
CREATE TYPE media_pipeline_stage AS ENUM ('upload', 'virus_scan', 'ocr', 'asr', 'index');
CREATE TYPE media_job_status AS ENUM ('pending', 'in_progress', 'completed', 'failed', 'retrying');
CREATE TYPE media_vendor_type AS ENUM ('transcription', 'ocr', 'virus_scan', 'storage');

-- Media pipeline jobs table
CREATE TABLE public.media_pipeline_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  family_id UUID NOT NULL,
  stage media_pipeline_stage NOT NULL,
  status media_job_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  error_details JSONB DEFAULT '{}',
  retry_count INTEGER DEFAULT 0,
  vendor_used TEXT,
  cost_usd DECIMAL(10,4) DEFAULT 0,
  processing_time_ms INTEGER,
  raw_output JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Media pipeline metrics table for aggregated stats
CREATE TABLE public.media_pipeline_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  stage media_pipeline_stage NOT NULL,
  vendor TEXT,
  total_jobs INTEGER DEFAULT 0,
  successful_jobs INTEGER DEFAULT 0,
  failed_jobs INTEGER DEFAULT 0,
  total_cost_usd DECIMAL(10,4) DEFAULT 0,
  avg_processing_time_ms INTEGER DEFAULT 0,
  p95_processing_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, stage, vendor)
);

-- Media vendor status table
CREATE TABLE public.media_vendor_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_type media_vendor_type NOT NULL,
  vendor_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_health_check TIMESTAMP WITH TIME ZONE DEFAULT now(),
  health_status TEXT DEFAULT 'healthy', -- healthy, degraded, outage
  error_rate_24h DECIMAL(5,2) DEFAULT 0,
  avg_response_time_ms INTEGER DEFAULT 0,
  cost_per_unit DECIMAL(10,6) DEFAULT 0,
  unit_type TEXT DEFAULT 'minute', -- minute, GB, request
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_type, vendor_name)
);

-- Enable RLS on all media pipeline tables
ALTER TABLE public.media_pipeline_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_pipeline_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_vendor_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media pipeline tables (super admin only)
CREATE POLICY "Super admins can manage media pipeline jobs"
ON public.media_pipeline_jobs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.settings->>'role' = 'super_admin'
  )
);

CREATE POLICY "Super admins can view media pipeline metrics"
ON public.media_pipeline_metrics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.settings->>'role' = 'super_admin'
  )
);

CREATE POLICY "Super admins can manage media vendor status"
ON public.media_vendor_status
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.settings->>'role' = 'super_admin'
  )
);

-- Create updated_at trigger for pipeline jobs
CREATE TRIGGER update_media_pipeline_jobs_updated_at
  BEFORE UPDATE ON public.media_pipeline_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for vendor status
CREATE TRIGGER update_media_vendor_status_updated_at
  BEFORE UPDATE ON public.media_vendor_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_media_pipeline_jobs_media_id ON public.media_pipeline_jobs(media_id);
CREATE INDEX idx_media_pipeline_jobs_stage_status ON public.media_pipeline_jobs(stage, status);
CREATE INDEX idx_media_pipeline_jobs_created_at ON public.media_pipeline_jobs(created_at DESC);
CREATE INDEX idx_media_pipeline_jobs_family_id ON public.media_pipeline_jobs(family_id);
CREATE INDEX idx_media_pipeline_metrics_date_stage ON public.media_pipeline_metrics(date DESC, stage);
CREATE INDEX idx_media_vendor_status_type ON public.media_vendor_status(vendor_type);

-- Insert sample vendor status data
INSERT INTO public.media_vendor_status (vendor_type, vendor_name, health_status, cost_per_unit, unit_type) VALUES
('transcription', 'OpenAI Whisper', 'healthy', 0.006, 'minute'),
('transcription', 'AssemblyAI', 'healthy', 0.0037, 'minute'),
('ocr', 'Google Vision', 'healthy', 0.0015, 'request'),
('ocr', 'AWS Textract', 'healthy', 0.0010, 'request'),
('virus_scan', 'ClamAV', 'healthy', 0.0001, 'request'),
('storage', 'Supabase Storage', 'healthy', 0.021, 'GB');