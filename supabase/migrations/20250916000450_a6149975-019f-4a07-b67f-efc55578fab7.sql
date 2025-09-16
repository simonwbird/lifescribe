-- Add simple_mode field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN simple_mode boolean DEFAULT false;

-- Add prompt tracking fields to stories table  
ALTER TABLE public.stories
ADD COLUMN prompt_id text,
ADD COLUMN prompt_text text;