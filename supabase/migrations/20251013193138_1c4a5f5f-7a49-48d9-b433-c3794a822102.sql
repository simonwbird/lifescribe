-- Create vault_sections table
CREATE TABLE IF NOT EXISTS public.vault_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_type text NOT NULL CHECK (section_type IN ('documents', 'accounts', 'contacts', 'other')),
  title text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create vault_items table (encrypted storage)
CREATE TABLE IF NOT EXISTS public.vault_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.vault_sections(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title text NOT NULL,
  encrypted_data jsonb NOT NULL, -- Encrypted content
  item_type text NOT NULL,
  file_path text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create vault_delegates table
CREATE TABLE IF NOT EXISTS public.vault_delegates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.vault_sections(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  delegate_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_level text NOT NULL DEFAULT 'view' CHECK (access_level IN ('view', 'edit', 'admin')),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Create vault_access_conditions table
CREATE TABLE IF NOT EXISTS public.vault_access_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.vault_sections(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  condition_type text NOT NULL CHECK (condition_type IN ('time_lock', 'admin_unlock', 'death_verification', 'manual')),
  unlock_date timestamp with time zone,
  is_unlocked boolean DEFAULT false,
  unlocked_at timestamp with time zone,
  unlocked_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create vault_checklists table
CREATE TABLE IF NOT EXISTS public.vault_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'When the time comes',
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create vault_checklist_items table
CREATE TABLE IF NOT EXISTS public.vault_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.vault_checklists(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category text,
  assigned_to uuid REFERENCES auth.users(id),
  is_completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  completed_by uuid REFERENCES auth.users(id),
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create vault_access_log table
CREATE TABLE IF NOT EXISTS public.vault_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES public.vault_sections(id) ON DELETE SET NULL,
  item_id uuid REFERENCES public.vault_items(id) ON DELETE SET NULL,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  accessed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_type text NOT NULL CHECK (access_type IN ('view', 'edit', 'delete', 'unlock', 'delegate')),
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vault_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_delegates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_access_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_access_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vault_sections
CREATE POLICY "Owners can manage their vault sections"
  ON public.vault_sections FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "Delegates can view assigned sections"
  ON public.vault_sections FOR SELECT
  USING (
    id IN (
      SELECT section_id FROM public.vault_delegates 
      WHERE delegate_id = auth.uid() AND is_active = true
    )
    AND EXISTS (
      SELECT 1 FROM public.vault_access_conditions
      WHERE section_id = vault_sections.id 
      AND (is_unlocked = true OR condition_type = 'manual')
    )
  );

-- RLS Policies for vault_items
CREATE POLICY "Section owners can manage vault items"
  ON public.vault_items FOR ALL
  USING (
    section_id IN (
      SELECT id FROM public.vault_sections WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Delegates can view vault items when unlocked"
  ON public.vault_items FOR SELECT
  USING (
    section_id IN (
      SELECT vd.section_id FROM public.vault_delegates vd
      JOIN public.vault_access_conditions vac ON vac.section_id = vd.section_id
      WHERE vd.delegate_id = auth.uid() 
      AND vd.is_active = true
      AND (vac.is_unlocked = true OR vac.condition_type = 'manual')
    )
  );

-- RLS Policies for vault_delegates
CREATE POLICY "Section owners can manage delegates"
  ON public.vault_delegates FOR ALL
  USING (
    section_id IN (
      SELECT id FROM public.vault_sections WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Delegates can view their assignments"
  ON public.vault_delegates FOR SELECT
  USING (delegate_id = auth.uid());

-- RLS Policies for vault_access_conditions
CREATE POLICY "Section owners can manage access conditions"
  ON public.vault_access_conditions FOR ALL
  USING (
    section_id IN (
      SELECT id FROM public.vault_sections WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Delegates can view access conditions"
  ON public.vault_access_conditions FOR SELECT
  USING (
    section_id IN (
      SELECT section_id FROM public.vault_delegates 
      WHERE delegate_id = auth.uid() AND is_active = true
    )
  );

-- RLS Policies for vault_checklists
CREATE POLICY "Owners can manage their checklists"
  ON public.vault_checklists FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "Family members can view checklists"
  ON public.vault_checklists FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    )
  );

-- RLS Policies for vault_checklist_items
CREATE POLICY "Checklist owners can manage items"
  ON public.vault_checklist_items FOR ALL
  USING (
    checklist_id IN (
      SELECT id FROM public.vault_checklists WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Family members can view checklist items"
  ON public.vault_checklist_items FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Assigned members can update their items"
  ON public.vault_checklist_items FOR UPDATE
  USING (assigned_to = auth.uid());

-- RLS Policies for vault_access_log
CREATE POLICY "Vault owners can view access logs"
  ON public.vault_access_log FOR SELECT
  USING (
    section_id IN (
      SELECT id FROM public.vault_sections WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "System can create access logs"
  ON public.vault_access_log FOR INSERT
  WITH CHECK (accessed_by = auth.uid());

-- Function to check vault access
CREATE OR REPLACE FUNCTION public.check_vault_access(
  p_section_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_owner boolean;
  is_delegate boolean;
  is_unlocked boolean;
BEGIN
  -- Check if user is owner
  SELECT EXISTS(
    SELECT 1 FROM vault_sections 
    WHERE id = p_section_id AND owner_id = p_user_id
  ) INTO is_owner;
  
  IF is_owner THEN
    RETURN true;
  END IF;
  
  -- Check if user is delegate
  SELECT EXISTS(
    SELECT 1 FROM vault_delegates 
    WHERE section_id = p_section_id 
    AND delegate_id = p_user_id 
    AND is_active = true
  ) INTO is_delegate;
  
  IF NOT is_delegate THEN
    RETURN false;
  END IF;
  
  -- Check if section is unlocked
  SELECT EXISTS(
    SELECT 1 FROM vault_access_conditions
    WHERE section_id = p_section_id
    AND (is_unlocked = true OR condition_type = 'manual')
  ) INTO is_unlocked;
  
  RETURN is_unlocked;
END;
$$;

-- Function to log vault access
CREATE OR REPLACE FUNCTION public.log_vault_access(
  p_section_id uuid,
  p_item_id uuid,
  p_access_type text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
  section_family_id uuid;
BEGIN
  -- Get family_id from section
  SELECT family_id INTO section_family_id
  FROM vault_sections
  WHERE id = p_section_id;
  
  INSERT INTO vault_access_log (
    section_id,
    item_id,
    family_id,
    accessed_by,
    access_type,
    metadata
  ) VALUES (
    p_section_id,
    p_item_id,
    section_family_id,
    auth.uid(),
    p_access_type,
    p_metadata
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Function to calculate vault progress
CREATE OR REPLACE FUNCTION public.calculate_vault_progress(
  p_family_id uuid,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_sections integer;
  sections_with_items integer;
  total_items integer;
  delegates_assigned integer;
  checklists_completed integer;
  total_checklists integer;
  progress_percentage numeric;
BEGIN
  -- Count total sections
  SELECT COUNT(*) INTO total_sections
  FROM vault_sections
  WHERE family_id = p_family_id AND owner_id = p_user_id AND is_active = true;
  
  -- Count sections with items
  SELECT COUNT(DISTINCT section_id) INTO sections_with_items
  FROM vault_items
  WHERE family_id = p_family_id;
  
  -- Count total items
  SELECT COUNT(*) INTO total_items
  FROM vault_items
  WHERE family_id = p_family_id;
  
  -- Count delegates assigned
  SELECT COUNT(DISTINCT section_id) INTO delegates_assigned
  FROM vault_delegates
  WHERE family_id = p_family_id AND is_active = true;
  
  -- Count completed checklists
  SELECT COUNT(*) INTO checklists_completed
  FROM vault_checklist_items
  WHERE family_id = p_family_id AND is_completed = true;
  
  -- Count total checklist items
  SELECT COUNT(*) INTO total_checklists
  FROM vault_checklist_items
  WHERE family_id = p_family_id;
  
  -- Calculate progress percentage
  IF total_sections > 0 THEN
    progress_percentage := (
      (sections_with_items::numeric / total_sections::numeric * 40) +
      (CASE WHEN total_items > 10 THEN 30 ELSE total_items::numeric * 3 END) +
      (delegates_assigned::numeric / GREATEST(total_sections, 1)::numeric * 20) +
      (CASE WHEN total_checklists > 0 
        THEN checklists_completed::numeric / total_checklists::numeric * 10 
        ELSE 0 END)
    );
  ELSE
    progress_percentage := 0;
  END IF;
  
  RETURN jsonb_build_object(
    'total_sections', total_sections,
    'sections_with_items', sections_with_items,
    'total_items', total_items,
    'delegates_assigned', delegates_assigned,
    'checklists_completed', checklists_completed,
    'total_checklists', total_checklists,
    'progress_percentage', LEAST(progress_percentage, 100)
  );
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_vault_items_section ON vault_items(section_id);
CREATE INDEX idx_vault_delegates_section ON vault_delegates(section_id);
CREATE INDEX idx_vault_delegates_user ON vault_delegates(delegate_id);
CREATE INDEX idx_vault_access_log_section ON vault_access_log(section_id);
CREATE INDEX idx_vault_access_log_user ON vault_access_log(accessed_by);
CREATE INDEX idx_vault_checklist_items_checklist ON vault_checklist_items(checklist_id);