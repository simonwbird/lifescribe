-- Add default_space_id to profiles table for single space behavior
ALTER TABLE public.profiles ADD COLUMN default_space_id uuid REFERENCES public.families(id);

-- Add feature_flags jsonb column to profiles for Labs functionality  
ALTER TABLE public.profiles ADD COLUMN feature_flags jsonb DEFAULT '{"enableMultiSpaces": false}'::jsonb;

-- Create index for better performance on default_space_id lookups
CREATE INDEX idx_profiles_default_space_id ON public.profiles(default_space_id);

-- Function to auto-create default family space for new users
CREATE OR REPLACE FUNCTION public.create_default_family_space()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  family_name text;
  new_family_id uuid;
BEGIN
  -- Determine family name from profile data
  family_name := COALESCE(
    split_part(NEW.full_name, ' ', -1) || ' Family',
    'My Family'
  );
  
  -- Create the family
  INSERT INTO public.families (name, description, created_by)
  VALUES (family_name, 'Default family space', NEW.id)
  RETURNING id INTO new_family_id;
  
  -- Update the profile with default_space_id
  UPDATE public.profiles 
  SET default_space_id = new_family_id 
  WHERE id = NEW.id;
  
  -- Add user as admin member of the family
  INSERT INTO public.members (profile_id, family_id, role)
  VALUES (NEW.id, new_family_id, 'admin');
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create family space for new profiles
CREATE TRIGGER create_default_family_space_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.default_space_id IS NULL)
  EXECUTE FUNCTION public.create_default_family_space();

-- For existing users without default_space_id, set it to their most recent family
UPDATE public.profiles 
SET default_space_id = (
  SELECT m.family_id 
  FROM public.members m 
  WHERE m.profile_id = profiles.id 
  ORDER BY m.joined_at DESC 
  LIMIT 1
)
WHERE default_space_id IS NULL;