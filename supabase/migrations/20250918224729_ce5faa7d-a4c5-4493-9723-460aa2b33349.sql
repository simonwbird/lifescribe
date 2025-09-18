-- Create enums for nudge system
CREATE TYPE nudge_trigger_type AS ENUM (
  'no_memory_24h',
  'no_memory_7d',
  'no_invite_sent',
  'no_digest_enabled',
  'inactive_7d',
  'inactive_30d',
  'first_login',
  'memory_milestone'
);

CREATE TYPE nudge_channel_type AS ENUM ('email', 'sms', 'in_app', 'push');

CREATE TYPE nudge_status AS ENUM ('draft', 'active', 'paused', 'completed');

-- Nudge templates table
CREATE TABLE public.nudge_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  channel nudge_channel_type NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Nudges configuration table
CREATE TABLE public.nudges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type nudge_trigger_type NOT NULL,
  trigger_config JSONB DEFAULT '{}'::jsonb,
  channel nudge_channel_type NOT NULL,
  template_id UUID REFERENCES public.nudge_templates(id),
  audience_rules JSONB DEFAULT '{}'::jsonb,
  throttle_config JSONB DEFAULT '{"max_per_day": 1, "min_interval_hours": 24}'::jsonb,
  status nudge_status NOT NULL DEFAULT 'draft',
  
  -- A/B testing configuration
  is_ab_test BOOLEAN DEFAULT false,
  holdout_percentage INTEGER DEFAULT 0 CHECK (holdout_percentage >= 0 AND holdout_percentage <= 50),
  variant_a_percentage INTEGER DEFAULT 50 CHECK (variant_a_percentage >= 0 AND variant_a_percentage <= 100),
  variant_b_template_id UUID REFERENCES public.nudge_templates(id),
  
  -- Conversion tracking
  conversion_window_hours INTEGER DEFAULT 72,
  conversion_events TEXT[] DEFAULT '{"MEMORY_RECORDED", "INVITE_SENT", "DIGEST_ENABLED"}'::text[],
  
  created_by UUID NOT NULL,
  family_id UUID, -- If null, applies to all families
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Nudge sends tracking
CREATE TABLE public.nudge_sends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nudge_id UUID NOT NULL REFERENCES public.nudges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  family_id UUID,
  variant TEXT, -- 'control', 'a', 'b'
  template_id UUID REFERENCES public.nudge_templates(id),
  channel nudge_channel_type NOT NULL,
  
  -- Send details
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  trigger_data JSONB DEFAULT '{}'::jsonb,
  send_metadata JSONB DEFAULT '{}'::jsonb
);

-- Nudge conversions tracking
CREATE TABLE public.nudge_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nudge_send_id UUID NOT NULL REFERENCES public.nudge_sends(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  family_id UUID,
  
  -- Conversion details
  conversion_event TEXT NOT NULL,
  converted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  hours_to_convert INTEGER,
  conversion_data JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.nudge_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudge_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudge_conversions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nudge_templates (admin only)
CREATE POLICY "Super admins can manage nudge templates"
ON public.nudge_templates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND settings->>'role' = 'super_admin'
  )
);

-- RLS Policies for nudges (admin only)
CREATE POLICY "Super admins can manage nudges"
ON public.nudges
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND settings->>'role' = 'super_admin'
  )
);

-- RLS Policies for nudge_sends (admin read, system write)
CREATE POLICY "Super admins can view nudge sends"
ON public.nudge_sends
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND settings->>'role' = 'super_admin'
  )
);

CREATE POLICY "System can create nudge sends"
ON public.nudge_sends
FOR INSERT
WITH CHECK (true); -- Edge functions will handle this

-- RLS Policies for nudge_conversions (admin read, system write)
CREATE POLICY "Super admins can view nudge conversions"
ON public.nudge_conversions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND settings->>'role' = 'super_admin'
  )
);

CREATE POLICY "System can create nudge conversions"
ON public.nudge_conversions
FOR INSERT
WITH CHECK (true); -- Edge functions will handle this

-- Triggers for updated_at
CREATE TRIGGER update_nudge_templates_updated_at
  BEFORE UPDATE ON public.nudge_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nudges_updated_at
  BEFORE UPDATE ON public.nudges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert preloaded templates
INSERT INTO public.nudge_templates (name, channel, subject, content, category, variables) VALUES
('Record First Memory - Email', 'email', 'Ready to capture your first family memory?', 
 'Hi {{user_name}},

Welcome to your family space! We''re excited to help you preserve precious moments.

**Why not start with your first memory?**
- Share a favorite family photo
- Record a voice note about a special day
- Write about a family tradition

[Record Your First Memory]({{cta_url}})

Every family story starts with a single memory. What will yours be?

Best,
The Family Stories Team', 'onboarding', '["user_name", "cta_url"]'),

('Invite Listener - Email', 'email', 'Share the magic - invite your family!', 
 'Hi {{user_name}},

You''ve started capturing beautiful memories! Now it''s time to invite your family to join the conversation.

**Why invite others?**
- Get different perspectives on shared memories
- Let family members add their own stories
- Create a richer family narrative together

[Invite Family Members]({{cta_url}})

Family stories are better when the whole family contributes.

Warm regards,
Your Family Stories Team', 'growth', '["user_name", "cta_url"]'),

('Pin Highlight - Email', 'email', 'Your family''s favorite moments deserve the spotlight!', 
 'Hi {{user_name}},

We noticed you''ve been sharing wonderful memories! Have you discovered our highlight pinning feature?

**Pin your favorites to:**
- Keep special moments easily accessible
- Create a curated collection of your best stories
- Help family members find the most meaningful content

[Pin Your Highlights]({{cta_url}})

Turn your favorite memories into family treasures.

Best,
The Family Stories Team', 'engagement', '["user_name", "cta_url"]'),

('Enable Weekly Digest - Email', 'email', 'Never miss a family moment again!', 
 'Hi {{user_name}},

Your family is creating beautiful memories! Make sure you never miss a moment with our Weekly Digest.

**Get a beautiful email summary of:**
- New photos and stories shared this week
- Family milestones and birthdays coming up
- Highlights from your family''s activity

[Turn On Weekly Digest]({{cta_url}})

Stay connected with your family''s story, one week at a time.

With love,
Your Family Stories Team', 'retention', '["user_name", "cta_url"]');

-- Insert in-app versions
INSERT INTO public.nudge_templates (name, channel, content, category, variables) VALUES
('Record First Memory - In App', 'in_app', 
 '🎯 **Ready to capture your first family memory?**

Start your family story by sharing a favorite photo, recording a voice note, or writing about a special tradition.

Every family story starts with a single memory!', 'onboarding', '[]'),

('Invite Listener - In App', 'in_app', 
 '👥 **Share the magic with your family!**

You''ve started capturing memories - now invite family members to join the conversation and add their own perspectives.', 'growth', '[]'),

('Pin Highlight - In App', 'in_app', 
 '📌 **Turn favorites into highlights!**

Pin your most meaningful memories to create a curated collection that''s easy to find and share.', 'engagement', '[]'),

('Enable Weekly Digest - In App', 'in_app', 
 '📬 **Never miss a family moment!**

Get a beautiful weekly email summary of new photos, stories, and upcoming family milestones.', 'retention', '[]');