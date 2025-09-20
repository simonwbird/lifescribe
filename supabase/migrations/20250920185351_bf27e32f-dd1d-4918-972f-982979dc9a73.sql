-- Add status and privacy_settings_json to families table
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
ADD COLUMN IF NOT EXISTS privacy_settings_json jsonb DEFAULT '{}'::jsonb;

-- Create family_memberships table (enhanced version of members)
CREATE TABLE IF NOT EXISTS public.family_memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role role_type NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive', 'banned')),
  invited_by uuid REFERENCES auth.users(id),
  invited_via text DEFAULT 'direct' CHECK (invited_via IN ('direct', 'code', 'request', 'merge')),
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(profile_id, family_id)
);

-- Enable RLS on family_memberships
ALTER TABLE public.family_memberships ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for family_memberships
CREATE POLICY "Family members can view memberships" 
ON public.family_memberships 
FOR SELECT 
USING (family_id IN (SELECT family_id FROM public.members WHERE profile_id = auth.uid()));

CREATE POLICY "Family admins can manage memberships" 
ON public.family_memberships 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.members 
  WHERE profile_id = auth.uid() 
  AND family_id = family_memberships.family_id 
  AND role = 'admin'
));

-- Add missing columns to invites table
ALTER TABLE public.invites 
ADD COLUMN IF NOT EXISTS code text UNIQUE,
ADD COLUMN IF NOT EXISTS max_uses integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS used_count integer DEFAULT 0;

-- Create access_requests table
CREATE TABLE IF NOT EXISTS public.access_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_role role_type NOT NULL DEFAULT 'member',
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'withdrawn')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamp with time zone,
  review_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '30 days'),
  UNIQUE(family_id, requester_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Enable RLS on access_requests
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for access_requests
CREATE POLICY "Users can create access requests" 
ON public.access_requests 
FOR INSERT 
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can view their own requests" 
ON public.access_requests 
FOR SELECT 
USING (requester_id = auth.uid());

CREATE POLICY "Family admins can manage access requests" 
ON public.access_requests 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.members 
  WHERE profile_id = auth.uid() 
  AND family_id = access_requests.family_id 
  AND role = 'admin'
));

-- Create merge_proposals table
CREATE TABLE IF NOT EXISTS public.merge_proposals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  target_family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  proposed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proposal_type text NOT NULL DEFAULT 'merge' CHECK (proposal_type IN ('merge', 'absorb', 'split')),
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'withdrawn', 'expired')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamp with time zone,
  review_reason text,
  merge_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  CHECK (source_family_id != target_family_id)
);

-- Enable RLS on merge_proposals
ALTER TABLE public.merge_proposals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for merge_proposals
CREATE POLICY "Family admins can create merge proposals" 
ON public.merge_proposals 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.members 
  WHERE profile_id = auth.uid() 
  AND (family_id = source_family_id OR family_id = target_family_id)
  AND role = 'admin'
));

CREATE POLICY "Family admins can view merge proposals" 
ON public.merge_proposals 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.members 
  WHERE profile_id = auth.uid() 
  AND (family_id = source_family_id OR family_id = target_family_id)
  AND role = 'admin'
));

CREATE POLICY "Family admins can manage merge proposals" 
ON public.merge_proposals 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.members 
  WHERE profile_id = auth.uid() 
  AND (family_id = source_family_id OR family_id = target_family_id)
  AND role = 'admin'
));

-- Create onboarding feature flags
INSERT INTO public.feature_flags (name, key, description, status, rollout_percentage, created_by) VALUES
('Onboarding Join V1', 'onboarding.join_v1', 'Enable enhanced family joining flow', 'draft', 0, (SELECT id FROM auth.users LIMIT 1)),
('Onboarding Codes V1', 'onboarding.codes_v1', 'Enable family invitation codes', 'draft', 0, (SELECT id FROM auth.users LIMIT 1)),
('Onboarding Requests V1', 'onboarding.requests_v1', 'Enable family access requests', 'draft', 0, (SELECT id FROM auth.users LIMIT 1)),
('Onboarding Prefight V1', 'onboarding.prefight_v1', 'Enable pre-join validation checks', 'draft', 0, (SELECT id FROM auth.users LIMIT 1)),
('Onboarding Preflight V1', 'onboarding.preflight_v1', 'Enable preflight validation checks', 'draft', 0, (SELECT id FROM auth.users LIMIT 1)),
('Onboarding Provisional V1', 'onboarding.provisional_v1', 'Enable provisional memberships', 'draft', 0, (SELECT id FROM auth.users LIMIT 1)),
('Onboarding Merge V1', 'onboarding.merge_v1', 'Enable family merge proposals', 'draft', 0, (SELECT id FROM auth.users LIMIT 1)),
('Onboarding Claim Admin V1', 'onboarding.claim_admin_v1', 'Enable admin role claiming', 'draft', 0, (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (key) DO NOTHING;