-- Add missing columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='notifications' AND column_name='link_label') THEN
    ALTER TABLE public.notifications ADD COLUMN link_label TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='notifications' AND column_name='metadata') THEN
    ALTER TABLE public.notifications ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Function to mark all notifications as read (if doesn't exist)
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET read_at = now()
  WHERE user_id = p_user_id
    AND read_at IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN COALESCE(updated_count, 0);
END;
$$;