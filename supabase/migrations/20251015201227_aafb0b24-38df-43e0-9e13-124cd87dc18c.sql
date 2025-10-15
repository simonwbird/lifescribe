-- Add missing foreign keys for pet_reminders table
ALTER TABLE public.pet_reminders
  ADD CONSTRAINT pet_reminders_pet_id_fkey 
  FOREIGN KEY (pet_id) 
  REFERENCES public.pets(id) 
  ON DELETE CASCADE;

ALTER TABLE public.pet_reminders
  ADD CONSTRAINT pet_reminders_family_id_fkey 
  FOREIGN KEY (family_id) 
  REFERENCES public.families(id) 
  ON DELETE CASCADE;

-- Add missing indexes for pet_reminders
CREATE INDEX IF NOT EXISTS idx_pet_reminders_due_date 
  ON public.pet_reminders(due_date) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_pet_reminders_pet_family 
  ON public.pet_reminders(pet_id, family_id);

CREATE INDEX IF NOT EXISTS idx_pet_reminders_family_id
  ON public.pet_reminders(family_id);

CREATE INDEX IF NOT EXISTS idx_pet_reminders_pet_id
  ON public.pet_reminders(pet_id);