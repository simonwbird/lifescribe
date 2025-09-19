-- Add region inference tracking field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS region_inferred_source text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS region_confirmed_at timestamp with time zone DEFAULT NULL;