-- Add visibility and short_bio fields to people table if they don't exist

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'people' 
                 AND column_name = 'short_bio') THEN
    ALTER TABLE public.people 
    ADD COLUMN short_bio TEXT;
    
    COMMENT ON COLUMN public.people.short_bio IS 'Short biography (40-160 chars) for SEO and social media';
  END IF;
END $$;

-- Add index on indexability for sitemap queries
CREATE INDEX IF NOT EXISTS idx_people_indexability 
ON public.people(indexability) 
WHERE indexability = 'public_indexable';

-- Add index on updated_at for cache invalidation
CREATE INDEX IF NOT EXISTS idx_people_updated_at 
ON public.people(updated_at DESC);