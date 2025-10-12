-- Add unlock_at column to person_page_blocks
ALTER TABLE public.person_page_blocks 
ADD COLUMN IF NOT EXISTS unlock_at timestamptz;