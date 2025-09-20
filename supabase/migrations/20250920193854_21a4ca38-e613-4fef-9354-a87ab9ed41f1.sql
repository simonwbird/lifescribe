-- Create admin claims table for orphaned family recovery
CREATE TABLE public.admin_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL,
  claimant_id UUID NOT NULL,
  claim_type TEXT NOT NULL CHECK (claim_type IN ('endorsement', 'email_challenge')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
  email_challenge_token TEXT,
  email_challenge_sent_at TIMESTAMP WITH TIME ZONE,
  email_challenge_expires_at TIMESTAMP WITH TIME ZONE,
  endorsements_required INTEGER DEFAULT 2,
  endorsements_received INTEGER DEFAULT 0,
  cooling_off_until TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '14 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create endorsements table
CREATE TABLE public.admin_claim_endorsements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_id UUID NOT NULL REFERENCES public.admin_claims(id) ON DELETE CASCADE,
  endorser_id UUID NOT NULL,
  endorsement_type TEXT NOT NULL DEFAULT 'support' CHECK (endorsement_type IN ('support', 'oppose')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(claim_id, endorser_id)
);

-- Create notifications table for claim processes
CREATE TABLE public.admin_claim_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_id UUID NOT NULL REFERENCES public.admin_claims(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_admin_claims_family_id ON public.admin_claims(family_id);
CREATE INDEX idx_admin_claims_claimant_id ON public.admin_claims(claimant_id);
CREATE INDEX idx_admin_claims_status ON public.admin_claims(status);
CREATE INDEX idx_admin_claim_endorsements_claim_id ON public.admin_claim_endorsements(claim_id);
CREATE INDEX idx_admin_claim_endorsements_endorser_id ON public.admin_claim_endorsements(endorser_id);
CREATE INDEX idx_admin_claim_notifications_recipient_id ON public.admin_claim_notifications(recipient_id);

-- Enable RLS
ALTER TABLE public.admin_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_claim_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_claim_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_claims
CREATE POLICY "Family members can view claims for their family"
ON public.admin_claims
FOR SELECT
USING (
  family_id IN (
    SELECT family_id FROM public.members WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Family members can create claims"
ON public.admin_claims
FOR INSERT
WITH CHECK (
  claimant_id = auth.uid() AND
  family_id IN (
    SELECT family_id FROM public.members WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Claimants can update their own claims"
ON public.admin_claims
FOR UPDATE
USING (claimant_id = auth.uid());

-- RLS Policies for endorsements
CREATE POLICY "Family members can view endorsements for their family claims"
ON public.admin_claim_endorsements
FOR SELECT
USING (
  claim_id IN (
    SELECT id FROM public.admin_claims 
    WHERE family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    )
  )
);

CREATE POLICY "Family members can create endorsements"
ON public.admin_claim_endorsements
FOR INSERT
WITH CHECK (
  endorser_id = auth.uid() AND
  claim_id IN (
    SELECT id FROM public.admin_claims 
    WHERE family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    )
  )
);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.admin_claim_notifications
FOR SELECT
USING (recipient_id = auth.uid());

CREATE POLICY "System can create notifications"
ON public.admin_claim_notifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON public.admin_claim_notifications
FOR UPDATE
USING (recipient_id = auth.uid());

-- Create function to check if family is orphaned (no active admins)
CREATE OR REPLACE FUNCTION public.is_family_orphaned(p_family_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.members 
    WHERE family_id = p_family_id 
    AND role = 'admin'
  );
END;
$$;

-- Create function to process admin claim
CREATE OR REPLACE FUNCTION public.process_admin_claim(p_claim_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claim_record public.admin_claims%ROWTYPE;
  endorsement_count INTEGER;
  result JSONB;
BEGIN
  -- Get claim details
  SELECT * INTO claim_record FROM public.admin_claims WHERE id = p_claim_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Claim not found');
  END IF;
  
  -- Check if claim is still valid
  IF claim_record.status != 'pending' OR claim_record.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Claim is no longer valid');
  END IF;
  
  -- Count supporting endorsements
  SELECT COUNT(*) INTO endorsement_count
  FROM public.admin_claim_endorsements
  WHERE claim_id = p_claim_id AND endorsement_type = 'support';
  
  -- Check if requirements are met
  IF claim_record.claim_type = 'endorsement' AND endorsement_count >= claim_record.endorsements_required THEN
    -- Set cooling-off period (7 days)
    UPDATE public.admin_claims
    SET 
      status = 'approved',
      cooling_off_until = now() + interval '7 days',
      endorsements_received = endorsement_count,
      updated_at = now()
    WHERE id = p_claim_id;
    
    result := jsonb_build_object(
      'success', true,
      'status', 'approved',
      'cooling_off_until', (now() + interval '7 days'),
      'message', 'Claim approved. Admin rights will be granted after 7-day cooling-off period.'
    );
    
  ELSIF claim_record.claim_type = 'email_challenge' AND claim_record.email_challenge_token IS NOT NULL THEN
    -- Email challenge completed, approve immediately with cooling-off
    UPDATE public.admin_claims
    SET 
      status = 'approved',
      cooling_off_until = now() + interval '7 days',
      updated_at = now()
    WHERE id = p_claim_id;
    
    result := jsonb_build_object(
      'success', true,
      'status', 'approved',
      'cooling_off_until', (now() + interval '7 days'),
      'message', 'Email challenge completed. Admin rights will be granted after 7-day cooling-off period.'
    );
    
  ELSE
    result := jsonb_build_object(
      'success', true,
      'status', 'pending',
      'endorsements_received', endorsement_count,
      'endorsements_required', claim_record.endorsements_required,
      'message', 'Claim is still pending additional requirements.'
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Create function to grant admin rights after cooling-off period
CREATE OR REPLACE FUNCTION public.grant_admin_after_cooling_off(p_claim_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claim_record public.admin_claims%ROWTYPE;
  result JSONB;
BEGIN
  -- Get claim details
  SELECT * INTO claim_record FROM public.admin_claims WHERE id = p_claim_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Claim not found');
  END IF;
  
  -- Check if cooling-off period has passed
  IF claim_record.status != 'approved' OR claim_record.cooling_off_until > now() THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Cooling-off period has not yet passed',
      'cooling_off_until', claim_record.cooling_off_until
    );
  END IF;
  
  -- Grant admin rights
  UPDATE public.members
  SET role = 'admin', updated_at = now()
  WHERE profile_id = claim_record.claimant_id AND family_id = claim_record.family_id;
  
  -- Mark claim as completed
  UPDATE public.admin_claims
  SET 
    status = 'completed',
    claimed_at = now(),
    updated_at = now()
  WHERE id = p_claim_id;
  
  -- Log audit event
  PERFORM log_audit_event(
    p_actor_id := claim_record.claimant_id,
    p_action := 'ADMIN_CLAIMED',
    p_entity_type := 'admin_claim',
    p_entity_id := p_claim_id,
    p_family_id := claim_record.family_id,
    p_details := jsonb_build_object(
      'claim_id', p_claim_id,
      'claim_type', claim_record.claim_type,
      'endorsements_received', claim_record.endorsements_received
    ),
    p_risk_score := 15
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Admin rights granted successfully',
    'claimed_at', now()
  );
END;
$$;