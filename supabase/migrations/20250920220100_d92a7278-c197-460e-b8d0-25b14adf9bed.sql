-- Drop the incorrect foreign key
ALTER TABLE public.bug_reports 
DROP CONSTRAINT bug_reports_user_id_fkey;

-- Add correct foreign key relationship between bug_reports and profiles
ALTER TABLE public.bug_reports 
ADD CONSTRAINT bug_reports_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;