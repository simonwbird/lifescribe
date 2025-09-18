import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Nudge, NudgeTemplate, NudgeAnalytics, AudienceEstimate } from '@/lib/nudgeTypes';

export function useNudgeData() {
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [templates, setTemplates] = useState<NudgeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load nudges with template data
      const { data: nudgesData, error: nudgesError } = await supabase
        .from('nudges')
        .select(`
          *,
          template:nudge_templates!nudges_template_id_fkey(*),
          variant_b_template:nudge_templates!nudges_variant_b_template_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (nudgesError) throw nudgesError;

      // Load templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('nudge_templates')
        .select('*')
        .order('category', { ascending: true });

      if (templatesError) throw templatesError;

      // Type cast the data to match our interfaces
      const typedNudges: Nudge[] = (nudgesData || []).map(nudge => ({
        ...nudge,
        trigger_config: nudge.trigger_config as Record<string, any>,
        audience_rules: nudge.audience_rules as Record<string, any>,
        throttle_config: nudge.throttle_config as { max_per_day: number; min_interval_hours: number },
        conversion_events: nudge.conversion_events as string[],
        template: nudge.template ? {
          ...nudge.template,
          variables: nudge.template.variables as string[]
        } : undefined,
        variant_b_template: nudge.variant_b_template ? {
          ...nudge.variant_b_template,
          variables: nudge.variant_b_template.variables as string[]
        } : undefined
      }));
      
      const typedTemplates: NudgeTemplate[] = (templatesData || []).map(template => ({
        ...template,
        variables: template.variables as string[]
      }));

      setNudges(typedNudges);
      setTemplates(typedTemplates);
    } catch (err) {
      console.error('Error loading nudge data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load nudge data');
    } finally {
      setLoading(false);
    }
  };

  const createNudge = async (nudgeData: Partial<Nudge>) => {
    try {
      // Prepare data for insertion, excluding joined fields
      const insertData = {
        name: nudgeData.name!,
        description: nudgeData.description,
        trigger_type: nudgeData.trigger_type!,
        trigger_config: nudgeData.trigger_config || {},
        channel: nudgeData.channel!,
        template_id: nudgeData.template_id,
        audience_rules: nudgeData.audience_rules || {},
        throttle_config: nudgeData.throttle_config || { max_per_day: 1, min_interval_hours: 24 },
        status: nudgeData.status || 'draft',
        is_ab_test: nudgeData.is_ab_test || false,
        holdout_percentage: nudgeData.holdout_percentage || 0,
        variant_a_percentage: nudgeData.variant_a_percentage || 50,
        variant_b_template_id: nudgeData.variant_b_template_id,
        conversion_window_hours: nudgeData.conversion_window_hours || 72,
        conversion_events: nudgeData.conversion_events || ['MEMORY_RECORDED'],
        created_by: (await supabase.auth.getUser()).data.user?.id!,
        family_id: nudgeData.family_id
      };

      const { data, error } = await supabase
        .from('nudges')
        .insert([insertData])
        .select(`
          *,
          template:nudge_templates!nudges_template_id_fkey(*),
          variant_b_template:nudge_templates!nudges_variant_b_template_id_fkey(*)
        `)
        .single();

      if (error) throw error;

      // Type cast the returned data
      const typedNudge: Nudge = {
        ...data,
        trigger_config: data.trigger_config as Record<string, any>,
        audience_rules: data.audience_rules as Record<string, any>,
        throttle_config: data.throttle_config as { max_per_day: number; min_interval_hours: number },
        conversion_events: data.conversion_events as string[],
        template: data.template ? {
          ...data.template,
          variables: data.template.variables as string[]
        } : undefined,
        variant_b_template: data.variant_b_template ? {
          ...data.variant_b_template,
          variables: data.variant_b_template.variables as string[]
        } : undefined
      };

      setNudges(prev => [typedNudge, ...prev]);
      return typedNudge;
    } catch (err) {
      console.error('Error creating nudge:', err);
      throw err;
    }
  };

  const updateNudge = async (id: string, updates: Partial<Nudge>) => {
    try {
      const { data, error } = await supabase
        .from('nudges')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          template:nudge_templates!nudges_template_id_fkey(*),
          variant_b_template:nudge_templates!nudges_variant_b_template_id_fkey(*)
        `)
        .single();

      if (error) throw error;

      // Type cast the returned data
      const typedNudge: Nudge = {
        ...data,
        trigger_config: data.trigger_config as Record<string, any>,
        audience_rules: data.audience_rules as Record<string, any>,
        throttle_config: data.throttle_config as { max_per_day: number; min_interval_hours: number },
        conversion_events: data.conversion_events as string[],
        template: data.template ? {
          ...data.template,
          variables: data.template.variables as string[]
        } : undefined,
        variant_b_template: data.variant_b_template ? {
          ...data.variant_b_template,
          variables: data.variant_b_template.variables as string[]
        } : undefined
      };

      setNudges(prev => prev.map(n => n.id === id ? typedNudge : n));
      return typedNudge;
    } catch (err) {
      console.error('Error updating nudge:', err);
      throw err;
    }
  };

  const deleteNudge = async (id: string) => {
    try {
      const { error } = await supabase
        .from('nudges')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNudges(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting nudge:', err);
      throw err;
    }
  };

  const estimateAudience = async (
    triggerType: string,
    audienceRules: Record<string, any>
  ): Promise<AudienceEstimate> => {
    try {
      // This would call an edge function to calculate audience size
      // For now, return mock data
      return {
        total_users: 1000,
        eligible_users: 250,
        holdout_users: 25,
        variant_a_users: 112,
        variant_b_users: 113
      };
    } catch (err) {
      console.error('Error estimating audience:', err);
      throw err;
    }
  };

  const getNudgeAnalytics = async (nudgeId: string): Promise<NudgeAnalytics> => {
    try {
      // This would aggregate data from nudge_sends and nudge_conversions
      // For now, return mock data
      return {
        total_sends: 225,
        delivery_rate: 0.94,
        open_rate: 0.32,
        click_rate: 0.18,
        conversion_rate: 0.12,
        conversions_by_variant: {
          control: 8,
          a: 12,
          b: 15
        },
        avg_hours_to_convert: 18.5
      };
    } catch (err) {
      console.error('Error getting nudge analytics:', err);
      throw err;
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    nudges,
    templates,
    loading,
    error,
    createNudge,
    updateNudge,
    deleteNudge,
    estimateAudience,
    getNudgeAnalytics,
    refetch: loadData
  };
}