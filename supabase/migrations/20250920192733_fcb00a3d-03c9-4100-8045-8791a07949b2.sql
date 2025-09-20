-- Create collision detection and merge tables
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

-- Create policies for collision signals
CREATE POLICY "Family admins can view collision signals" 
ON public.family_collision_signals 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.members 
  WHERE profile_id = auth.uid() 
    AND members.family_id = family_collision_signals.family_id 
    AND role = 'admin'
));

CREATE POLICY "System can manage collision signals" 
ON public.family_collision_signals 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create merge proposals table
CREATE TABLE IF NOT EXISTS public.merge_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  target_family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  proposed_by UUID NOT NULL REFERENCES public.profiles(id),
  proposal_type TEXT NOT NULL DEFAULT 'merge' CHECK (proposal_type IN ('merge', 'absorb')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'completed')),
  message TEXT,
  collision_score INTEGER NOT NULL DEFAULT 0,
  pre_merge_analysis JSONB NOT NULL DEFAULT '{}',
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent duplicate proposals
  UNIQUE(source_family_id, target_family_id)
);

-- Enable RLS
ALTER TABLE public.merge_proposals ENABLE ROW LEVEL SECURITY;

-- Create policies for merge proposals
CREATE POLICY "Family admins can view merge proposals" 
ON public.merge_proposals 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.members 
  WHERE profile_id = auth.uid() 
    AND (members.family_id = merge_proposals.source_family_id OR members.family_id = merge_proposals.target_family_id)
    AND role = 'admin'
));

CREATE POLICY "Family admins can create merge proposals" 
ON public.merge_proposals 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.members 
  WHERE profile_id = auth.uid() 
    AND members.family_id = merge_proposals.source_family_id 
    AND role = 'admin'
) AND proposed_by = auth.uid());

CREATE POLICY "Family admins can update merge proposals" 
ON public.merge_proposals 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.members 
  WHERE profile_id = auth.uid() 
    AND (members.family_id = merge_proposals.source_family_id OR members.family_id = merge_proposals.target_family_id)
    AND role = 'admin'
));

-- Create family aliases for redirects after merges
CREATE TABLE IF NOT EXISTS public.family_aliases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  old_family_id UUID NOT NULL, -- Don't use FK since family may be deleted
  new_family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  old_name_slug TEXT NOT NULL,
  merge_id UUID, -- Reference to merge that created this alias
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(old_family_id),
  UNIQUE(old_name_slug)
);

-- Enable RLS
ALTER TABLE public.family_aliases ENABLE ROW LEVEL SECURITY;

-- Create policy for family aliases (readable by anyone for redirects)
CREATE POLICY "Family aliases are publicly readable for redirects" 
ON public.family_aliases 
FOR SELECT 
USING (true);

-- Create function to compute collision signals
CREATE OR REPLACE FUNCTION public.compute_family_collision_signals()
RETURNS INTEGER AS $$
DECLARE
  family_record RECORD;
  processed_count INTEGER := 0;
  collision_candidates UUID[];
  risk_score INTEGER;
  hash_data JSONB;
BEGIN
  -- Process all provisional families
  FOR family_record IN 
    SELECT f.id, f.name, f.created_at, f.status
    FROM public.families f
    WHERE f.status = 'provisional' 
      AND f.created_at > (now() - interval '30 days') -- Only recent families
  LOOP
    -- Generate hash signals (same logic as preflight)
    hash_data := jsonb_build_object(
      'name_hash', encode(digest(lower(trim(regexp_replace(family_record.name, '[^a-zA-Z0-9]+', '-', 'g'))), 'sha256'), 'hex'),
      'created_week', to_char(family_record.created_at, 'YYYY-WW')
    );
    
    -- Find collision candidates with similar hashes
    SELECT array_agg(DISTINCT fcs.family_id) INTO collision_candidates
    FROM public.family_collision_signals fcs
    WHERE fcs.family_id != family_record.id
      AND (
        fcs.hashed_signals->>'name_hash' = hash_data->>'name_hash'
        OR fcs.hashed_signals->>'created_week' = hash_data->>'created_week'
      );
    
    -- Calculate risk score
    risk_score := COALESCE(array_length(collision_candidates, 1), 0) * 10;
    
    -- Insert or update collision signals
    INSERT INTO public.family_collision_signals (
      family_id,
      name_slug,
      hashed_signals,
      risk_score,
      collision_candidates,
      last_computed_at
    ) VALUES (
      family_record.id,
      lower(trim(regexp_replace(family_record.name, '[^a-zA-Z0-9]+', '-', 'g'))),
      hash_data,
      risk_score,
      COALESCE(collision_candidates, '{}'),
      now()
    )
    ON CONFLICT (family_id) DO UPDATE SET
      hashed_signals = EXCLUDED.hashed_signals,
      risk_score = EXCLUDED.risk_score,
      collision_candidates = EXCLUDED.collision_candidates,
      last_computed_at = EXCLUDED.last_computed_at,
      updated_at = now();
    
    processed_count := processed_count + 1;
  END LOOP;
  
  RETURN processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to get merge analysis without exposing member data
CREATE OR REPLACE FUNCTION public.get_merge_analysis(p_source_family_id UUID, p_target_family_id UUID)
RETURNS JSONB AS $$
DECLARE
  source_counts JSONB;
  target_counts JSONB;
  analysis JSONB;
BEGIN
  -- Get source family content counts
  SELECT jsonb_build_object(
    'members', (SELECT COUNT(*) FROM public.members WHERE family_id = p_source_family_id),
    'stories', (SELECT COUNT(*) FROM public.stories WHERE family_id = p_source_family_id),
    'media', (SELECT COUNT(*) FROM public.media WHERE family_id = p_source_family_id),
    'comments', (SELECT COUNT(*) FROM public.comments WHERE family_id = p_source_family_id),
    'people', (SELECT COUNT(*) FROM public.people WHERE family_id = p_source_family_id),
    'created_at', (SELECT created_at FROM public.families WHERE id = p_source_family_id),
    'name', (SELECT name FROM public.families WHERE id = p_source_family_id)
  ) INTO source_counts;
  
  -- Get target family content counts  
  SELECT jsonb_build_object(
    'members', (SELECT COUNT(*) FROM public.members WHERE family_id = p_target_family_id),
    'stories', (SELECT COUNT(*) FROM public.stories WHERE family_id = p_target_family_id),
    'media', (SELECT COUNT(*) FROM public.media WHERE family_id = p_target_family_id),
    'comments', (SELECT COUNT(*) FROM public.comments WHERE family_id = p_target_family_id),
    'people', (SELECT COUNT(*) FROM public.people WHERE family_id = p_target_family_id),
    'created_at', (SELECT created_at FROM public.families WHERE id = p_target_family_id),
    'name', (SELECT name FROM public.families WHERE id = p_target_family_id)
  ) INTO target_counts;
  
  -- Build analysis object
  analysis := jsonb_build_object(
    'source_family', source_counts,
    'target_family', target_counts,
    'combined_totals', jsonb_build_object(
      'members', (source_counts->>'members')::int + (target_counts->>'members')::int,
      'stories', (source_counts->>'stories')::int + (target_counts->>'stories')::int,
      'media', (source_counts->>'media')::int + (target_counts->>'media')::int,
      'comments', (source_counts->>'comments')::int + (target_counts->>'comments')::int,
      'people', (source_counts->>'people')::int + (target_counts->>'people')::int
    ),
    'analysis_date', now()
  );
  
  RETURN analysis;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update collision signals when families are created
CREATE TRIGGER update_collision_signals_on_family_create
  AFTER INSERT ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_family_collision_signals();

-- Create index for collision signal lookups
CREATE INDEX IF NOT EXISTS idx_family_collision_signals_family_id ON public.family_collision_signals(family_id);
CREATE INDEX IF NOT EXISTS idx_family_collision_signals_risk_score ON public.family_collision_signals(risk_score) WHERE risk_score > 0;
CREATE INDEX IF NOT EXISTS idx_merge_proposals_families ON public.merge_proposals(source_family_id, target_family_id);
CREATE INDEX IF NOT EXISTS idx_merge_proposals_status ON public.merge_proposals(status);
CREATE INDEX IF NOT EXISTS idx_family_aliases_old_family_id ON public.family_aliases(old_family_id);
CREATE INDEX IF NOT EXISTS idx_family_aliases_old_name_slug ON public.family_aliases(old_name_slug);