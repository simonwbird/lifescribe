-- Create function to automatically link story to property
CREATE OR REPLACE FUNCTION public.auto_link_story_to_property()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If a property ID is set, create a link in story_property_links
  IF NEW.happened_at_property_id IS NOT NULL THEN
    INSERT INTO public.story_property_links (
      story_id,
      property_id,
      family_id
    ) VALUES (
      NEW.id,
      NEW.happened_at_property_id,
      NEW.family_id
    )
    ON CONFLICT (story_id, property_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on stories table
DROP TRIGGER IF EXISTS trigger_auto_link_story_to_property ON public.stories;

CREATE TRIGGER trigger_auto_link_story_to_property
  AFTER INSERT OR UPDATE OF happened_at_property_id ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_story_to_property();