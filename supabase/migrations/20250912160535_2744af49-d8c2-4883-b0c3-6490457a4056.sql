-- Create pets table with comprehensive schema
CREATE TABLE public.pets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL,
  created_by UUID NOT NULL,
  
  -- Identity
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  sex TEXT CHECK (sex IN ('male', 'female', 'unknown')),
  neutered BOOLEAN,
  color TEXT,
  markings TEXT,
  dob_approx TEXT, -- supports approximate dates like "Spring 2020"
  gotcha_date DATE,
  passed_at DATE, -- for memorial pets
  
  -- IDs & Registration
  microchip_number TEXT,
  microchip_provider TEXT,
  microchip_date DATE,
  license_number TEXT,
  license_expires DATE,
  license_authority TEXT,
  registry_org TEXT,
  registry_id TEXT,
  dna_test_provider TEXT,
  dna_test_url TEXT,
  
  -- Health & Care
  vet_name TEXT,
  vet_phone TEXT,
  vet_email TEXT,
  insurance_provider TEXT,
  insurance_policy TEXT,
  insurance_renews DATE,
  weight_kg DECIMAL,
  diet TEXT,
  allergies TEXT,
  medications TEXT,
  conditions TEXT[],
  
  -- Life & Training
  roles TEXT[], -- service, therapy, show, etc.
  awards TEXT[],
  temperament TEXT,
  favorites TEXT[],
  feeding_routine TEXT,
  walks_routine TEXT,
  bedtime_routine TEXT,
  care_instructions TEXT,
  
  -- Location & People
  property_id UUID,
  room TEXT,
  breeder_rescue TEXT,
  
  -- Media
  cover_url TEXT,
  
  -- Status & Metadata
  status TEXT NOT NULL DEFAULT 'current' CHECK (status IN ('current', 'past')),
  tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Family members can view pets" 
ON public.pets 
FOR SELECT 
USING (family_id IN ( SELECT members.family_id FROM members WHERE members.profile_id = auth.uid()));

CREATE POLICY "Family members can create pets" 
ON public.pets 
FOR INSERT 
WITH CHECK ((family_id IN ( SELECT members.family_id FROM members WHERE members.profile_id = auth.uid())) AND (created_by = auth.uid()));

CREATE POLICY "Family members can update pets" 
ON public.pets 
FOR UPDATE 
USING (family_id IN ( SELECT members.family_id FROM members WHERE members.profile_id = auth.uid()));

CREATE POLICY "Pet creators can delete pets" 
ON public.pets 
FOR DELETE 
USING (created_by = auth.uid());

-- Create pet-person relationship table
CREATE TABLE public.pet_person_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL,
  person_id UUID NOT NULL,
  family_id UUID NOT NULL,
  relationship TEXT DEFAULT 'guardian', -- guardian, owner, caretaker
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pet_person_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can manage pet person links" 
ON public.pet_person_links 
FOR ALL 
USING (family_id IN ( SELECT members.family_id FROM members WHERE members.profile_id = auth.uid()))
WITH CHECK (family_id IN ( SELECT members.family_id FROM members WHERE members.profile_id = auth.uid()));

-- Create vaccines table
CREATE TABLE public.pet_vaccines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL,
  family_id UUID NOT NULL,
  name TEXT NOT NULL,
  date_given DATE,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pet_vaccines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can manage pet vaccines" 
ON public.pet_vaccines 
FOR ALL 
USING (family_id IN ( SELECT members.family_id FROM members WHERE members.profile_id = auth.uid()))
WITH CHECK (family_id IN ( SELECT members.family_id FROM members WHERE members.profile_id = auth.uid()));

-- Create vet visits table
CREATE TABLE public.pet_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL,
  family_id UUID NOT NULL,
  visit_date DATE NOT NULL,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pet_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can manage pet visits" 
ON public.pet_visits 
FOR ALL 
USING (family_id IN ( SELECT members.family_id FROM members WHERE members.profile_id = auth.uid()))
WITH CHECK (family_id IN ( SELECT members.family_id FROM members WHERE members.profile_id = auth.uid()));

-- Create reminders table
CREATE TABLE public.pet_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL,
  family_id UUID NOT NULL,
  type TEXT NOT NULL, -- vaccine, checkup, grooming, medication, etc.
  title TEXT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'overdue', 'done')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pet_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can manage pet reminders" 
ON public.pet_reminders 
FOR ALL 
USING (family_id IN ( SELECT members.family_id FROM members WHERE members.profile_id = auth.uid()))
WITH CHECK (family_id IN ( SELECT members.family_id FROM members WHERE members.profile_id = auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_pets_updated_at
BEFORE UPDATE ON public.pets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();