-- Add missing columns for featured/pinned functionality
ALTER TABLE public.guestbook_entries
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS featured_order integer;

-- Add aliases for backwards compatibility with existing components
ALTER TABLE public.guestbook_entries
ADD COLUMN IF NOT EXISTS content text GENERATED ALWAYS AS (message) STORED,
ADD COLUMN IF NOT EXISTS profile_id uuid GENERATED ALWAYS AS (author_user) STORED,
ADD COLUMN IF NOT EXISTS visitor_name text GENERATED ALWAYS AS (author_name) STORED;

-- Add indexes for featured queries
CREATE INDEX IF NOT EXISTS idx_guestbook_featured ON public.guestbook_entries(person_id, is_featured, featured_order) WHERE is_featured = true;