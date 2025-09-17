-- Add is_anonymous column to guestbook table
ALTER TABLE public.guestbook 
ADD COLUMN is_anonymous boolean DEFAULT false;