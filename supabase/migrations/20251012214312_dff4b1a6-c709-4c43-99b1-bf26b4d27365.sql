-- Add position data to entity_links for visual photo tagging
ALTER TABLE public.entity_links 
ADD COLUMN position_x NUMERIC,
ADD COLUMN position_y NUMERIC,
ADD COLUMN position_width NUMERIC,
ADD COLUMN position_height NUMERIC;

-- Add comment explaining the position fields
COMMENT ON COLUMN public.entity_links.position_x IS 'X coordinate as percentage (0-100) of image width for visual tag positioning';
COMMENT ON COLUMN public.entity_links.position_y IS 'Y coordinate as percentage (0-100) of image height for visual tag positioning';
COMMENT ON COLUMN public.entity_links.position_width IS 'Width as percentage (0-100) of image width for tag box';
COMMENT ON COLUMN public.entity_links.position_height IS 'Height as percentage (0-100) of image height for tag box';