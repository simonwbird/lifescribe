-- Create collision detection table (if not exists)
CREATE TABLE IF NOT EXISTS public.family_collision_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name_slug TEXT NOT NULL,
  hashed_signals JSONB NOT NULL DEFAULT '{}',
  risk_score INTEGER NOT NULL DEFAULT 0,
  collision_candidates UUID[] DEFAULT '{}',
  last_computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.family_collision_signals ENABLE ROW LEVEL SECURITY;

-- Create unique constraint on family_id for collision signals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'family_collision_signals_family_id_key'
  ) THEN
    ALTER TABLE public.family_collision_signals ADD CONSTRAINT family_collision_signals_family_id_key UNIQUE (family_id);
  END IF;
END $$;

-- Create family aliases for redirects after merges
CREATE TABLE IF NOT EXISTS public.family_aliases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  old_family_id UUID NOT NULL, -- Don't use FK since family may be deleted
  new_family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  old_name_slug TEXT NOT NULL,
  merge_id UUID, -- Reference to merge that created this alias
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'family_aliases_old_family_id_key'
  ) THEN
    ALTER TABLE public.family_aliases ADD CONSTRAINT family_aliases_old_family_id_key UNIQUE (old_family_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'family_aliases_old_name_slug_key'
  ) THEN
    ALTER TABLE public.family_aliases ADD CONSTRAINT family_aliases_old_name_slug_key UNIQUE (old_name_slug);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.family_aliases ENABLE ROW LEVEL SECURITY;

-- Create policies for collision signals (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Family admins can view collision signals'
    AND tablename = 'family_collision_signals'
  ) THEN
    CREATE POLICY "Family admins can view collision signals" 
    ON public.family_collision_signals 
    FOR SELECT 
    USING (EXISTS (
      SELECT 1 FROM public.members 
      WHERE profile_id = auth.uid() 
        AND members.family_id = family_collision_signals.family_id 
        AND role = 'admin'
    ));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'System can manage collision signals'
    AND tablename = 'family_collision_signals'
  ) THEN
    CREATE POLICY "System can manage collision signals" 
    ON public.family_collision_signals 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);
  END IF;
END $$;

-- Create policies for family aliases (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Family aliases are publicly readable for redirects'
    AND tablename = 'family_aliases'
  ) THEN
    CREATE POLICY "Family aliases are publicly readable for redirects" 
    ON public.family_aliases 
    FOR SELECT 
    USING (true);
  END IF;
END $$;

-- Update merge_proposals table with new columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'merge_proposals' 
    AND column_name = 'collision_score'
  ) THEN
    ALTER TABLE public.merge_proposals ADD COLUMN collision_score INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'merge_proposals' 
    AND column_name = 'pre_merge_analysis'
  ) THEN
    ALTER TABLE public.merge_proposals ADD COLUMN pre_merge_analysis JSONB NOT NULL DEFAULT '{}';
  END IF;
END $$;