-- Add status column to invites table
ALTER TABLE public.invites 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired'));