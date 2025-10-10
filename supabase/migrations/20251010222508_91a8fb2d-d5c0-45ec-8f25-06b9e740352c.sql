-- Add layout and accessibility fields to person_page_themes
ALTER TABLE public.person_page_themes
ADD COLUMN IF NOT EXISTS layout text NOT NULL DEFAULT 'magazine' CHECK (layout IN ('magazine', 'linear', 'card_stack')),
ADD COLUMN IF NOT EXISTS high_contrast_mode boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_css jsonb DEFAULT '{}'::jsonb;

-- Create index for faster theme lookups
CREATE INDEX IF NOT EXISTS idx_person_page_themes_person_id ON public.person_page_themes(id);

-- Create predefined theme presets table
CREATE TABLE IF NOT EXISTS public.theme_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  palette jsonb NOT NULL,
  font_scale numeric DEFAULT 1.0,
  shape text DEFAULT 'rounded',
  layout text DEFAULT 'magazine',
  high_contrast_mode boolean DEFAULT false,
  is_system boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on theme_presets
ALTER TABLE public.theme_presets ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view presets
CREATE POLICY "Anyone can view theme presets"
ON public.theme_presets
FOR SELECT
TO authenticated
USING (true);

-- Only super admins can manage presets
CREATE POLICY "Super admins can manage theme presets"
ON public.theme_presets
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Insert default theme presets
INSERT INTO public.theme_presets (name, description, palette, font_scale, shape, layout) VALUES
('Classic', 'Timeless elegance with serif fonts and warm tones', 
 '{"primary": "222 47 11", "secondary": "217 91 4", "accent": "26 47 88", "background": "0 0 100", "foreground": "222 47 11"}'::jsonb,
 1.0, 'rounded', 'magazine'),
 
('Modern', 'Clean lines and bold colors', 
 '{"primary": "262 83 58", "secondary": "221 83 53", "accent": "142 71 45", "background": "0 0 100", "foreground": "222 47 11"}'::jsonb,
 1.0, 'sharp', 'linear'),
 
('Warm Heritage', 'Rich earth tones and traditional styling', 
 '{"primary": "25 95 53", "secondary": "36 100 41", "accent": "48 96 89", "background": "43 96 93", "foreground": "20 14 4"}'::jsonb,
 1.1, 'soft', 'magazine'),
 
('Cool Memorial', 'Serene blues and grays for tribute pages', 
 '{"primary": "215 28 17", "secondary": "217 19 27", "accent": "210 40 96", "background": "210 40 98", "foreground": "215 16 47"}'::jsonb,
 1.0, 'rounded', 'card_stack'),
 
('High Contrast', 'Maximum readability with stark contrasts', 
 '{"primary": "0 0 0", "secondary": "0 0 20", "accent": "210 100 50", "background": "0 0 100", "foreground": "0 0 0"}'::jsonb,
 1.2, 'sharp', 'linear')
ON CONFLICT DO NOTHING;