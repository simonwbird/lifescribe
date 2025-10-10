-- Add missing transcript column to media table to match app insert payload
ALTER TABLE public.media
ADD COLUMN IF NOT EXISTS transcript TEXT;