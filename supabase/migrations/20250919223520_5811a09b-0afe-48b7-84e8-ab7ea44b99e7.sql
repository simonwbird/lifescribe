-- Create the weekly_digest_settings table
CREATE TABLE IF NOT EXISTS public.weekly_digest_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  is_paused BOOLEAN NOT NULL DEFAULT false,
  delivery_day INTEGER NOT NULL DEFAULT 0, -- 0 = Sunday, 1 = Monday, etc.
  delivery_hour INTEGER NOT NULL DEFAULT 9, -- Hour in 24h format
  last_sent_at TIMESTAMP WITH TIME ZONE,
  last_forced_send_at TIMESTAMP WITH TIME ZONE,
  forced_send_by UUID REFERENCES auth.users(id),
  unlock_threshold INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint to ensure one settings record per family
  UNIQUE(family_id)
);

-- Enable RLS
ALTER TABLE public.weekly_digest_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for weekly_digest_settings
CREATE POLICY "Family members can view digest settings" 
ON public.weekly_digest_settings 
FOR SELECT 
USING (family_id IN (
  SELECT family_id FROM public.members WHERE profile_id = auth.uid()
));

CREATE POLICY "Family admins can manage digest settings" 
ON public.weekly_digest_settings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.members 
  WHERE profile_id = auth.uid() 
    AND family_id = weekly_digest_settings.family_id 
    AND role = 'admin'
));

CREATE POLICY "Super admins can manage all digest settings" 
ON public.weekly_digest_settings 
FOR ALL 
USING (is_super_admin(auth.uid()));

-- Create updated_at trigger
CREATE TRIGGER update_weekly_digest_settings_updated_at
  BEFORE UPDATE ON public.weekly_digest_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_weekly_digest_settings_updated_at();

-- Create sample data for existing families
INSERT INTO public.weekly_digest_settings (family_id, enabled, delivery_day, delivery_hour)
SELECT 
  id as family_id,
  true as enabled,
  0 as delivery_day, -- Sunday
  9 as delivery_hour -- 9 AM
FROM public.families 
ON CONFLICT (family_id) DO NOTHING;