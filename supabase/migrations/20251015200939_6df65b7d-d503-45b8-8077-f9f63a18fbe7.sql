-- Add memory_message field for tributes
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS memory_message TEXT;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMP WITH TIME ZONE;

-- Create index for filtering by status
CREATE INDEX IF NOT EXISTS idx_pets_status ON public.pets(status);

-- Update trigger to track status changes
CREATE OR REPLACE FUNCTION update_pet_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_changed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS pet_status_change_trigger ON public.pets;

CREATE TRIGGER pet_status_change_trigger
  BEFORE UPDATE ON public.pets
  FOR EACH ROW
  EXECUTE FUNCTION update_pet_status_timestamp();