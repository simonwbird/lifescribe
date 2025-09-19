-- Create moderation enums
CREATE TYPE moderation_source AS ENUM ('user_flag', 'automated_nsfw', 'automated_toxicity', 'automated_pii', 'dmca');
CREATE TYPE moderation_action_type AS ENUM ('hide', 'blur', 'age_gate', 'notify_owner', 'escalate', 'resolve');
CREATE TYPE moderation_item_type AS ENUM ('story', 'media', 'answer', 'comment');
CREATE TYPE moderation_status AS ENUM ('pending', 'in_review', 'resolved', 'escalated');

-- Create moderation_flags table
CREATE TABLE public.moderation_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL,
  item_type moderation_item_type NOT NULL,
  item_id UUID NOT NULL,
  source moderation_source NOT NULL,
  reason TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  flagged_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  severity INTEGER DEFAULT 1 CHECK (severity >= 1 AND severity <= 5)
);

-- Create moderation_actions table
CREATE TABLE public.moderation_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_id UUID NOT NULL REFERENCES public.moderation_flags(id) ON DELETE CASCADE,
  action_type moderation_action_type NOT NULL,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  rationale TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create moderation_queue_items view for consolidated queue
CREATE TABLE public.moderation_queue_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_id UUID NOT NULL REFERENCES public.moderation_flags(id) ON DELETE CASCADE,
  family_id UUID NOT NULL,
  item_type moderation_item_type NOT NULL,
  item_id UUID NOT NULL,
  status moderation_status NOT NULL DEFAULT 'pending',
  assigned_to UUID REFERENCES auth.users(id),
  sla_due_at TIMESTAMP WITH TIME ZONE,
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all moderation tables
ALTER TABLE public.moderation_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_queue_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for moderation tables (super admin only)
CREATE POLICY "Super admins can manage moderation flags"
ON public.moderation_flags
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.settings->>'role' = 'super_admin'
  )
);

CREATE POLICY "Super admins can manage moderation actions"
ON public.moderation_actions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.settings->>'role' = 'super_admin'
  )
);

CREATE POLICY "Super admins can manage moderation queue"
ON public.moderation_queue_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.settings->>'role' = 'super_admin'
  )
);

-- Create updated_at trigger for queue items
CREATE TRIGGER update_moderation_queue_items_updated_at
  BEFORE UPDATE ON public.moderation_queue_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create queue items from flags
CREATE OR REPLACE FUNCTION public.create_queue_item_from_flag()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.moderation_queue_items (
    flag_id,
    family_id,
    item_type,
    item_id,
    priority,
    sla_due_at
  ) VALUES (
    NEW.id,
    NEW.family_id,
    NEW.item_type,
    NEW.item_id,
    NEW.severity,
    now() + interval '24 hours' -- Default 24h SLA
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create queue items
CREATE TRIGGER create_queue_item_trigger
  AFTER INSERT ON public.moderation_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.create_queue_item_from_flag();

-- Create indexes for performance
CREATE INDEX idx_moderation_flags_family_id ON public.moderation_flags(family_id);
CREATE INDEX idx_moderation_flags_item ON public.moderation_flags(item_type, item_id);
CREATE INDEX idx_moderation_queue_status ON public.moderation_queue_items(status);
CREATE INDEX idx_moderation_queue_priority ON public.moderation_queue_items(priority DESC);
CREATE INDEX idx_moderation_queue_sla ON public.moderation_queue_items(sla_due_at);
CREATE INDEX idx_moderation_actions_flag_id ON public.moderation_actions(flag_id);