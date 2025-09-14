-- Create table for storing family tree person positions
CREATE TABLE public.family_tree_positions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL,
  user_id uuid NOT NULL,
  person_id uuid NOT NULL,
  x_position numeric NOT NULL,
  y_position numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Ensure one position per person per user per family
  UNIQUE(family_id, user_id, person_id)
);

-- Enable Row Level Security
ALTER TABLE public.family_tree_positions ENABLE ROW LEVEL SECURITY;

-- RLS policies for family tree positions
CREATE POLICY "Users can manage their own tree positions" 
ON public.family_tree_positions 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_family_tree_positions_updated_at
BEFORE UPDATE ON public.family_tree_positions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();