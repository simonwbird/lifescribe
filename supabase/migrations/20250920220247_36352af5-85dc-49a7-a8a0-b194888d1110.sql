-- Add foreign key for bug_reports.family_id -> families.id to enable PostgREST relationships
ALTER TABLE public.bug_reports
ADD CONSTRAINT bug_reports_family_id_fkey
FOREIGN KEY (family_id)
REFERENCES public.families(id)
ON DELETE SET NULL;