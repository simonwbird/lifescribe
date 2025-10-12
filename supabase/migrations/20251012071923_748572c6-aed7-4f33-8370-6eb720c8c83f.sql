-- Add causes and donations fields to people table
ALTER TABLE public.people
ADD COLUMN IF NOT EXISTS cause_name TEXT,
ADD COLUMN IF NOT EXISTS cause_url TEXT,
ADD COLUMN IF NOT EXISTS cause_note TEXT;