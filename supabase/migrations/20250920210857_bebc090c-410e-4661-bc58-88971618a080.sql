-- Add bug_merges table for tracking merged bugs
CREATE TABLE public.bug_merges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_bug_id UUID NOT NULL,
  merged_bug_id UUID NOT NULL,
  merged_by UUID REFERENCES auth.users(id),
  merge_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_parent_bug FOREIGN KEY (parent_bug_id) REFERENCES public.bug_reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_merged_bug FOREIGN KEY (merged_bug_id) REFERENCES public.bug_reports(id) ON DELETE CASCADE
);

-- Add bug_notifications table for user notifications
CREATE TABLE public.bug_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bug_report_id UUID NOT NULL REFERENCES public.bug_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  notification_type TEXT NOT NULL, -- 'resolved', 'status_change', 'merged'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add bug_changelog table for transparency
CREATE TABLE public.bug_changelog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bug_report_id UUID NOT NULL REFERENCES public.bug_reports(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id),
  change_type TEXT NOT NULL, -- 'status_change', 'verified', 'wont_fix', 'merged'
  old_value JSONB,
  new_value JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bug_merges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_changelog ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bug_merges
CREATE POLICY "Super admins can manage bug merges" 
ON public.bug_merges 
FOR ALL 
USING (is_super_admin(auth.uid()));

-- RLS Policies for bug_notifications
CREATE POLICY "Users can view their own notifications" 
ON public.bug_notifications 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" 
ON public.bug_notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can mark their notifications as read" 
ON public.bug_notifications 
FOR UPDATE 
USING (user_id = auth.uid());

-- RLS Policies for bug_changelog
CREATE POLICY "Super admins can view bug changelog" 
ON public.bug_changelog 
FOR SELECT 
USING (is_super_admin(auth.uid()));

CREATE POLICY "System can create changelog entries" 
ON public.bug_changelog 
FOR INSERT 
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_bug_merges_parent_bug ON public.bug_merges(parent_bug_id);
CREATE INDEX idx_bug_merges_merged_bug ON public.bug_merges(merged_bug_id);
CREATE INDEX idx_bug_notifications_user ON public.bug_notifications(user_id);
CREATE INDEX idx_bug_notifications_bug ON public.bug_notifications(bug_report_id);
CREATE INDEX idx_bug_changelog_bug ON public.bug_changelog(bug_report_id);

-- Function to create bug notification
CREATE OR REPLACE FUNCTION create_bug_notification(
  p_bug_report_id UUID,
  p_user_id UUID,
  p_notification_type TEXT,
  p_title TEXT,
  p_message TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.bug_notifications (
    bug_report_id,
    user_id,
    notification_type,
    title,
    message
  ) VALUES (
    p_bug_report_id,
    p_user_id,
    p_notification_type,
    p_title,
    p_message
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to log bug changelog
CREATE OR REPLACE FUNCTION log_bug_change(
  p_bug_report_id UUID,
  p_changed_by UUID,
  p_change_type TEXT,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changelog_id UUID;
BEGIN
  INSERT INTO public.bug_changelog (
    bug_report_id,
    changed_by,
    change_type,
    old_value,
    new_value,
    notes
  ) VALUES (
    p_bug_report_id,
    p_changed_by,
    p_change_type,
    p_old_value,
    p_new_value,
    p_notes
  ) RETURNING id INTO changelog_id;
  
  RETURN changelog_id;
END;
$$;

-- Trigger to auto-notify when bug is resolved
CREATE OR REPLACE FUNCTION notify_on_bug_resolution()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if status changed to Fixed or Closed
  IF OLD.status != NEW.status AND (NEW.status = 'Fixed' OR NEW.status = 'Closed') THEN
    -- Create notification for the original reporter
    PERFORM create_bug_notification(
      NEW.id,
      NEW.user_id,
      'resolved',
      'Bug Report Resolved',
      'Your bug report "' || NEW.title || '" has been marked as ' || NEW.status || '.'
    );
    
    -- Log the change
    PERFORM log_bug_change(
      NEW.id,
      auth.uid(),
      'status_change',
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      'Bug marked as resolved'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER bug_resolution_notification
AFTER UPDATE ON public.bug_reports
FOR EACH ROW
EXECUTE FUNCTION notify_on_bug_resolution();