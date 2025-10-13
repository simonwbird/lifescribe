-- Add elder mode settings to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS elder_mode boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS elder_phone_code text UNIQUE;

-- Create table for inbound voice messages
CREATE TABLE IF NOT EXISTS public.inbound_voice_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id uuid REFERENCES public.families(id) ON DELETE CASCADE,
  phone_number text,
  audio_url text,
  transcript text,
  duration_seconds integer,
  source text NOT NULL DEFAULT 'phone', -- 'phone' or 'whatsapp'
  status text NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  draft_id uuid REFERENCES public.stories(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.inbound_voice_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own inbound messages
CREATE POLICY "Users can view their own inbound messages"
ON public.inbound_voice_messages
FOR SELECT
USING (user_id = auth.uid());

-- System can insert inbound messages
CREATE POLICY "System can insert inbound messages"
ON public.inbound_voice_messages
FOR INSERT
WITH CHECK (true);

-- System can update inbound messages
CREATE POLICY "System can update inbound messages"
ON public.inbound_voice_messages
FOR UPDATE
USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_inbound_voice_user_id ON public.inbound_voice_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_inbound_voice_status ON public.inbound_voice_messages(status);

-- Function to generate unique phone code
CREATE OR REPLACE FUNCTION generate_elder_phone_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate 6-digit code
    new_code := LPAD(FLOOR(random() * 1000000)::text, 6, '0');
    
    -- Check if code exists
    SELECT EXISTS(
      SELECT 1 FROM profiles WHERE elder_phone_code = new_code
    ) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Function to enable elder mode and assign phone code
CREATE OR REPLACE FUNCTION enable_elder_mode(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  phone_code text;
  result jsonb;
BEGIN
  -- Check if user already has a code
  SELECT elder_phone_code INTO phone_code
  FROM profiles
  WHERE id = p_user_id;
  
  -- Generate new code if needed
  IF phone_code IS NULL THEN
    phone_code := generate_elder_phone_code();
  END IF;
  
  -- Update profile
  UPDATE profiles
  SET 
    elder_mode = true,
    elder_phone_code = phone_code,
    updated_at = now()
  WHERE id = p_user_id;
  
  result := jsonb_build_object(
    'success', true,
    'elder_mode', true,
    'phone_code', phone_code
  );
  
  RETURN result;
END;
$$;