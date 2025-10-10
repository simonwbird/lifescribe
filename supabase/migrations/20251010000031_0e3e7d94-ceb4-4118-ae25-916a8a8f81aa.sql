-- Function to add family creator as admin
CREATE OR REPLACE FUNCTION public.fn_add_creator_as_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if member already exists
  IF EXISTS (
    SELECT 1 FROM public.members 
    WHERE family_id = NEW.id AND profile_id = NEW.created_by
  ) THEN
    -- Update existing member to admin
    UPDATE public.members
    SET role = 'admin', status = 'active', updated_at = NOW()
    WHERE family_id = NEW.id AND profile_id = NEW.created_by;
  ELSE
    -- Insert new admin member
    INSERT INTO public.members (family_id, profile_id, role, joined_at, status)
    VALUES (NEW.id, NEW.created_by, 'admin', NOW(), 'active');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to automatically add family creator as admin
CREATE TRIGGER trg_family_admin
AFTER INSERT ON public.families
FOR EACH ROW
EXECUTE FUNCTION public.fn_add_creator_as_admin();