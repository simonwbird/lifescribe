-- Add foreign key relationship between bug_reports and profiles
ALTER TABLE public.bug_reports 
ADD CONSTRAINT bug_reports_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;