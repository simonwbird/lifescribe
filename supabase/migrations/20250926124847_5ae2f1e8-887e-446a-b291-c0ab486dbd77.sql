-- Phase 4: Add status management and progress tracking

-- First, update the status enum to include all required statuses
DO $$ BEGIN
  -- Check if the enum already exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prompt_instance_status') THEN
    CREATE TYPE prompt_instance_status AS ENUM ('open', 'in_progress', 'completed', 'skipped', 'not_applicable', 'snoozed');
  ELSE
    -- Add new enum values if they don't exist
    BEGIN
      ALTER TYPE prompt_instance_status ADD VALUE IF NOT EXISTS 'skipped';
      ALTER TYPE prompt_instance_status ADD VALUE IF NOT EXISTS 'not_applicable';
      ALTER TYPE prompt_instance_status ADD VALUE IF NOT EXISTS 'snoozed';
    EXCEPTION WHEN duplicate_object THEN
      -- Values already exist, continue
    END;
  END IF;
END $$;

-- Update prompt_instances table to use the proper enum type and add missing columns
DO $$ BEGIN
  -- Add status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompt_instances' AND column_name = 'status') THEN
    ALTER TABLE public.prompt_instances ADD COLUMN status prompt_instance_status DEFAULT 'open';
  END IF;
  
  -- Add snoozed_until column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompt_instances' AND column_name = 'snoozed_until') THEN
    ALTER TABLE public.prompt_instances ADD COLUMN snoozed_until timestamp with time zone;
  END IF;
  
  -- Add updated_at column if it doesn't exist  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompt_instances' AND column_name = 'updated_at') THEN
    ALTER TABLE public.prompt_instances ADD COLUMN updated_at timestamp with time zone DEFAULT now();
  END IF;
END $$;

-- Create index for filtering by status
CREATE INDEX IF NOT EXISTS idx_prompt_instances_status ON public.prompt_instances(status);

-- Create index for snoozed items
CREATE INDEX IF NOT EXISTS idx_prompt_instances_snoozed ON public.prompt_instances(snoozed_until) WHERE status = 'snoozed';

-- Create composite index for filtering
CREATE INDEX IF NOT EXISTS idx_prompt_instances_filtering ON public.prompt_instances(family_id, status, created_at DESC);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_prompt_instances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prompt_instances_updated_at_trigger
  BEFORE UPDATE ON public.prompt_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_instances_updated_at();

-- Function to automatically return snoozed prompts to open status
CREATE OR REPLACE FUNCTION check_snoozed_prompts()
RETURNS void AS $$
BEGIN
  UPDATE public.prompt_instances 
  SET status = 'open', snoozed_until = NULL
  WHERE status = 'snoozed' 
    AND snoozed_until IS NOT NULL 
    AND snoozed_until <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get progress statistics
CREATE OR REPLACE FUNCTION get_prompts_progress(p_family_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  overall_stats jsonb;
  category_stats jsonb[];
  person_stats jsonb[];
  rec record;
BEGIN
  -- Get overall progress
  SELECT jsonb_build_object(
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'total_active', COUNT(*) FILTER (WHERE status IN ('open', 'in_progress', 'completed'))
  ) INTO overall_stats
  FROM public.prompt_instances pi
  WHERE pi.family_id = p_family_id;

  -- Get progress by category (from prompt metadata)
  SELECT array_agg(
    jsonb_build_object(
      'category', category,
      'completed', completed_count,
      'total', total_count
    )
  ) INTO category_stats
  FROM (
    SELECT 
      COALESCE(p.metadata->>'category', 'Other') as category,
      COUNT(*) FILTER (WHERE pi.status = 'completed') as completed_count,
      COUNT(*) FILTER (WHERE pi.status IN ('open', 'in_progress', 'completed')) as total_count
    FROM public.prompt_instances pi
    JOIN public.prompts p ON pi.prompt_id = p.id
    WHERE pi.family_id = p_family_id
    GROUP BY COALESCE(p.metadata->>'category', 'Other')
    ORDER BY category
  ) category_progress;

  -- Get progress by person
  SELECT array_agg(
    jsonb_build_object(
      'person_id', person_id,
      'name', person_name,
      'completed', completed_count,
      'total', total_count
    )
  ) INTO person_stats
  FROM (
    SELECT 
      person_id,
      COALESCE(pe.full_name, 'Unknown') as person_name,
      COUNT(*) FILTER (WHERE pi.status = 'completed') as completed_count,
      COUNT(*) FILTER (WHERE pi.status IN ('open', 'in_progress', 'completed')) as total_count
    FROM public.prompt_instances pi
    JOIN unnest(pi.person_ids) as person_id ON true
    LEFT JOIN public.people pe ON pe.id = person_id::uuid
    WHERE pi.family_id = p_family_id
      AND array_length(pi.person_ids, 1) > 0
    GROUP BY person_id, pe.full_name
    ORDER BY pe.full_name
  ) person_progress;

  -- Build final result
  result := jsonb_build_object(
    'overall', overall_stats,
    'by_category', COALESCE(category_stats, '[]'::jsonb),
    'by_person', COALESCE(person_stats, '[]'::jsonb)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;