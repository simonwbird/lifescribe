import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProgressStats {
  overall: {
    completed: number;
    total_active: number;
  };
  by_category: Array<{
    category: string;
    completed: number;
    total: number;
  }>;
  by_person: Array<{
    person_id: string;
    name: string;
    completed: number;
    total: number;
  }>;
}

export function usePromptProgress(familyId: string) {
  return useQuery({
    queryKey: ['prompt-progress', familyId],
    queryFn: async (): Promise<ProgressStats> => {
      const { data, error } = await supabase.rpc('get_prompts_progress', {
        p_family_id: familyId
      });

      if (error) throw error;
      return data as ProgressStats;
    },
    enabled: !!familyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useInProgressPrompts(familyId: string) {
  return useQuery({
    queryKey: ['in-progress-prompts', familyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_instances')
        .select(`
          id,
          updated_at,
          prompt:prompts(
            id,
            title,
            body,
            category
          )
        `)
        .eq('family_id', familyId)
        .eq('status', 'in_progress')
        .order('updated_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
    enabled: !!familyId,
  });
}