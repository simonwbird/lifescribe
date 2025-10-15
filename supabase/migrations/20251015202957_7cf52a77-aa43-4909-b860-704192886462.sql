-- Create storage bucket for property documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-documents', 'property-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for property documents storage
CREATE POLICY "Family members can view property documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'property-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT family_id::text
    FROM members
    WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Family members can upload property documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT family_id::text
    FROM members
    WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Family members can delete property documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT family_id::text
    FROM members
    WHERE profile_id = auth.uid()
  )
);

-- Create property_documents table (if not exists)
CREATE TABLE IF NOT EXISTS public.property_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  family_id UUID NOT NULL,
  title TEXT NOT NULL,
  file_id TEXT,
  file_path TEXT,
  doc_type TEXT,
  issued_at DATE,
  expires_at DATE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on property_documents
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for property_documents
CREATE POLICY "Family members can view property documents"
ON public.property_documents FOR SELECT
USING (
  family_id IN (
    SELECT family_id FROM members WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Family members can create property documents"
ON public.property_documents FOR INSERT
WITH CHECK (
  family_id IN (
    SELECT family_id FROM members WHERE profile_id = auth.uid()
  ) AND created_by = auth.uid()
);

CREATE POLICY "Family members can update property documents"
ON public.property_documents FOR UPDATE
USING (
  family_id IN (
    SELECT family_id FROM members WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Family members can delete property documents"
ON public.property_documents FOR DELETE
USING (
  family_id IN (
    SELECT family_id FROM members WHERE profile_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_property_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_property_documents_updated_at
BEFORE UPDATE ON public.property_documents
FOR EACH ROW
EXECUTE FUNCTION update_property_documents_updated_at();