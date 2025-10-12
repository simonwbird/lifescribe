-- Add visibility and indexability columns to people table
ALTER TABLE public.people 
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'private' CHECK (visibility IN ('public', 'unlisted', 'private')),
ADD COLUMN IF NOT EXISTS indexability text DEFAULT 'noindex' CHECK (indexability IN ('indexable', 'noindex')),
ADD COLUMN IF NOT EXISTS last_indexed_at timestamp with time zone;

-- Add comment for documentation
COMMENT ON COLUMN public.people.visibility IS 'Page visibility: public (anyone), unlisted (link only), private (family only)';
COMMENT ON COLUMN public.people.indexability IS 'Search engine indexing: indexable or noindex';
COMMENT ON COLUMN public.people.last_indexed_at IS 'Last time the page was indexed by search engines';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_people_visibility_indexability ON public.people(visibility, indexability);
