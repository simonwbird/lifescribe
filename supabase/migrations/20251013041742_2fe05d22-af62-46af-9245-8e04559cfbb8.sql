-- Add pinned column to person_page_blocks table
ALTER TABLE public.person_page_blocks 
ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false;

-- Create index for faster queries on pinned blocks
CREATE INDEX IF NOT EXISTS idx_person_page_blocks_pinned 
ON public.person_page_blocks(person_id, pinned) 
WHERE pinned = true;