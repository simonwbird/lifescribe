-- Create digest follow preferences table
CREATE TABLE IF NOT EXISTS public.digest_follow_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  followed_member_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, family_id, followed_member_id)
);

-- Enable RLS
ALTER TABLE public.digest_follow_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for digest follow preferences
CREATE POLICY "Users can manage their own follow preferences"
ON public.digest_follow_preferences
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX idx_digest_follow_prefs_user_family 
ON public.digest_follow_preferences(user_id, family_id);

-- Function to get followed members for digest
CREATE OR REPLACE FUNCTION public.get_digest_followed_members(
  p_user_id uuid,
  p_family_id uuid
)
RETURNS TABLE(member_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has any follow preferences
  IF EXISTS (
    SELECT 1 FROM digest_follow_preferences
    WHERE user_id = p_user_id AND family_id = p_family_id
  ) THEN
    -- Return only followed members
    RETURN QUERY
    SELECT followed_member_id
    FROM digest_follow_preferences
    WHERE user_id = p_user_id AND family_id = p_family_id;
  ELSE
    -- Return all family members if no preferences set (default behavior)
    RETURN QUERY
    SELECT profile_id
    FROM members
    WHERE family_id = p_family_id;
  END IF;
END;
$$;

COMMENT ON TABLE public.digest_follow_preferences IS 'Stores user preferences for which family members to follow in weekly digests';
COMMENT ON FUNCTION public.get_digest_followed_members IS 'Returns list of members a user wants to follow in digests, or all members if no preferences set';