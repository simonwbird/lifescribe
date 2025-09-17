-- Create face_tags table to store tagged faces in photos
CREATE TABLE public.face_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id UUID NOT NULL,
  person_id UUID NOT NULL,
  family_id UUID NOT NULL,
  -- Store coordinates as percentages (0-100) for responsiveness
  x_percent NUMERIC(5,2) NOT NULL,
  y_percent NUMERIC(5,2) NOT NULL,
  width_percent NUMERIC(5,2) NOT NULL,
  height_percent NUMERIC(5,2) NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.face_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for face tags
CREATE POLICY "Family members can view face tags" 
ON public.face_tags 
FOR SELECT 
USING (family_id IN ( SELECT members.family_id
   FROM members
  WHERE members.profile_id = auth.uid()));

CREATE POLICY "Family members can create face tags" 
ON public.face_tags 
FOR INSERT 
WITH CHECK (family_id IN ( SELECT members.family_id
   FROM members
  WHERE members.profile_id = auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Tag creators can update their face tags" 
ON public.face_tags 
FOR UPDATE 
USING (created_by = auth.uid());

CREATE POLICY "Tag creators can delete their face tags" 
ON public.face_tags 
FOR DELETE 
USING (created_by = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_face_tags_updated_at
BEFORE UPDATE ON public.face_tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_face_tags_media_id ON public.face_tags(media_id);
CREATE INDEX idx_face_tags_person_id ON public.face_tags(person_id);
CREATE INDEX idx_face_tags_family_id ON public.face_tags(family_id);