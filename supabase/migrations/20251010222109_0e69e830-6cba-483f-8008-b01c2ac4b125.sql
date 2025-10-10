-- Fix security issues from previous migration
-- Set search_path for functions to prevent SQL injection
ALTER FUNCTION public.generate_person_slug(text, text, uuid) SET search_path = public;
ALTER FUNCTION public.auto_generate_person_slug() SET search_path = public;