-- Fix search path for existing functions to address security warning
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
ALTER FUNCTION public.get_user_family_ids(uuid) SET search_path = 'public';
ALTER FUNCTION public.update_people_updated_at() SET search_path = 'public';