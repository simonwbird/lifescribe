import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EntitySuggestion {
  entity_id: string;
  entity_type: string;
  entity_name: string;
  match_score: number;
  match_reason: string;
}

export function useEntitySuggestions(
  content: string,
  familyId: string | undefined,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['entity-suggestions', content, familyId],
    queryFn: async () => {
      if (!content || !familyId) return [];

      const { data, error } = await supabase.rpc('suggest_entity_links', {
        p_content: content,
        p_family_id: familyId,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: enabled && !!content && !!familyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateEntityLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sourceId,
      sourceType,
      entityId,
      entityType,
      familyId,
    }: {
      sourceId: string;
      sourceType: string;
      entityId: string;
      entityType: string;
      familyId: string;
    }) => {
      const { data, error } = await supabase
        .from('entity_links')
        .insert({
          source_id: sourceId,
          source_type: sourceType,
          entity_id: entityId,
          entity_type: entityType,
          family_id: familyId,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-links'] });
      toast.success('Link created successfully');
    },
    onError: (error) => {
      console.error('Error creating entity link:', error);
      toast.error('Failed to create link');
    },
  });
}

export function useEntityLinks(sourceId: string, sourceType: string) {
  return useQuery({
    queryKey: ['entity-links', sourceId, sourceType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entity_links')
        .select('*')
        .eq('source_id', sourceId)
        .eq('source_type', sourceType);

      if (error) throw error;
      return data;
    },
    enabled: !!sourceId && !!sourceType,
  });
}

export function useDeleteEntityLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from('entity_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-links'] });
      toast.success('Link removed');
    },
    onError: (error) => {
      console.error('Error deleting entity link:', error);
      toast.error('Failed to remove link');
    },
  });
}
