-- Create content audit log table for immutable edit tracking
CREATE TABLE public.content_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL, -- 'story', 'media', 'answer'
  content_id UUID NOT NULL,
  family_id UUID NOT NULL,
  editor_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL, -- 'title_change', 'date_change', 'people_link', 'reassign', 'pin', 'unpin'
  old_values JSONB DEFAULT '{}',
  new_values JSONB DEFAULT '{}',
  change_reason TEXT,
  batch_id UUID, -- For grouping bulk operations
  ai_suggested BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content suggestions table for AI-generated metadata
CREATE TABLE public.content_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  family_id UUID NOT NULL,
  suggestion_type TEXT NOT NULL, -- 'title', 'date', 'people', 'tags'
  suggested_value JSONB NOT NULL,
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  source_data JSONB DEFAULT '{}', -- EXIF, transcript, etc.
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_by_ai TEXT, -- Which AI service created this
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content batch operations table
CREATE TABLE public.content_batch_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL,
  operation_type TEXT NOT NULL, -- 'bulk_title_update', 'bulk_date_update', 'bulk_reassign'
  initiated_by UUID NOT NULL REFERENCES auth.users(id),
  target_content_ids UUID[] NOT NULL,
  operation_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  completed_count INTEGER DEFAULT 0,
  total_count INTEGER NOT NULL,
  error_details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all content admin tables
ALTER TABLE public.content_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_batch_operations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content admin tables (super admin only)
CREATE POLICY "Super admins can view content audit log"
ON public.content_audit_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.settings->>'role' = 'super_admin'
  )
);

CREATE POLICY "System can create audit log entries"
ON public.content_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Super admins can manage content suggestions"
ON public.content_suggestions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.settings->>'role' = 'super_admin'
  )
);

CREATE POLICY "Super admins can manage batch operations"
ON public.content_batch_operations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.settings->>'role' = 'super_admin'
  )
);

-- Create updated_at triggers
CREATE TRIGGER update_content_suggestions_updated_at
  BEFORE UPDATE ON public.content_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_batch_operations_updated_at
  BEFORE UPDATE ON public.content_batch_operations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_content_audit_log_content ON public.content_audit_log(content_type, content_id);
CREATE INDEX idx_content_audit_log_family_id ON public.content_audit_log(family_id);
CREATE INDEX idx_content_audit_log_batch_id ON public.content_audit_log(batch_id);
CREATE INDEX idx_content_audit_log_created_at ON public.content_audit_log(created_at DESC);

CREATE INDEX idx_content_suggestions_content ON public.content_suggestions(content_type, content_id);
CREATE INDEX idx_content_suggestions_family_id ON public.content_suggestions(family_id);
CREATE INDEX idx_content_suggestions_status ON public.content_suggestions(status);
CREATE INDEX idx_content_suggestions_type ON public.content_suggestions(suggestion_type);

CREATE INDEX idx_batch_operations_family_id ON public.content_batch_operations(family_id);
CREATE INDEX idx_batch_operations_status ON public.content_batch_operations(status);
CREATE INDEX idx_batch_operations_created_at ON public.content_batch_operations(created_at DESC);

-- Create function to log content changes
CREATE OR REPLACE FUNCTION public.log_content_change(
  p_content_type TEXT,
  p_content_id UUID,
  p_family_id UUID,
  p_editor_id UUID,
  p_action_type TEXT,
  p_old_values JSONB DEFAULT '{}',
  p_new_values JSONB DEFAULT '{}',
  p_change_reason TEXT DEFAULT NULL,
  p_batch_id UUID DEFAULT NULL,
  p_ai_suggested BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.content_audit_log (
    content_type,
    content_id,
    family_id,
    editor_id,
    action_type,
    old_values,
    new_values,
    change_reason,
    batch_id,
    ai_suggested
  ) VALUES (
    p_content_type,
    p_content_id,
    p_family_id,
    p_editor_id,
    p_action_type,
    p_old_values,
    p_new_values,
    p_change_reason,
    p_batch_id,
    p_ai_suggested
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;