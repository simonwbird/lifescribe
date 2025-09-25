-- CRITICAL SECURITY FIX: Remove unsafe family_member_profiles view
-- Problem: The family_member_profiles view exposes sensitive user data without proper access control
-- Solution: Drop the unsafe view - applications should use the secure get_family_member_safe_profiles() function instead

-- Drop the unsafe view that exposes user profile data
DROP VIEW IF EXISTS public.family_member_profiles;

-- Note: Applications should use the existing secure function instead:
-- SELECT * FROM public.get_family_member_safe_profiles()
-- 
-- This function already provides safe access to family member profiles
-- without exposing sensitive fields like email addresses or settings