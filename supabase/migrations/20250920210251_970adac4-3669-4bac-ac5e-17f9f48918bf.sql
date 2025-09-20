-- Create ai_tasks table for tracking Loveable fix requests
CREATE TABLE public.ai_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bug_report_id uuid NOT NULL REFERENCES public.bug_reports(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  task_brief jsonb NOT NULL DEFAULT '{}',
  loveable_task_id text,
  loveable_response jsonb,
  result_type text, -- 'pr' or 'patch'
  github_pr_url text,
  inline_patch text,
  completed_at timestamp with time zone,
  error_message text
);

-- Add RLS policies
ALTER TABLE public.ai_tasks ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all AI tasks
CREATE POLICY "Super admins can manage ai tasks" 
ON public.ai_tasks 
FOR ALL 
USING (is_super_admin(auth.uid()));

-- Family admins can view AI tasks for their family's bugs
CREATE POLICY "Family admins can view family ai tasks" 
ON public.ai_tasks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bug_reports br
    JOIN public.members m ON br.family_id = m.family_id
    WHERE br.id = ai_tasks.bug_report_id
    AND m.profile_id = auth.uid()
    AND m.role = 'admin'
  )
);

-- Create index for efficient querying
CREATE INDEX idx_ai_tasks_bug_report_id ON public.ai_tasks(bug_report_id);
CREATE INDEX idx_ai_tasks_status ON public.ai_tasks(status);
CREATE INDEX idx_ai_tasks_created_at ON public.ai_tasks(created_at);

-- Add trigger for updated_at
CREATE TRIGGER update_ai_tasks_updated_at
BEFORE UPDATE ON public.ai_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();