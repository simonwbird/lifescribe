-- Add foreign key constraints to link tables to properties
ALTER TABLE public.property_documents
ADD CONSTRAINT property_documents_property_id_fkey 
FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE public.property_reminders
ADD CONSTRAINT property_reminders_property_id_fkey 
FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE public.story_property_links
ADD CONSTRAINT story_property_links_property_id_fkey 
FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE public.media_property_links
ADD CONSTRAINT media_property_links_property_id_fkey 
FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;