-- Create error_logs table for lightweight error tracking
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route TEXT NOT NULL,
  error TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
  error_stack TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for quick lookups
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX idx_error_logs_route ON public.error_logs(route);
CREATE INDEX idx_error_logs_user_id ON public.error_logs(user_id);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins can view all error logs
CREATE POLICY "Super admins can view all error logs"
  ON public.error_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND settings->>'role' = 'super_admin'
    )
  );

-- Policy: Users can insert their own error logs
CREATE POLICY "Users can insert their own error logs"
  ON public.error_logs
  FOR INSERT
  WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );

-- Add comment
COMMENT ON TABLE public.error_logs IS 'Lightweight error tracking table for route load failures and other errors';
