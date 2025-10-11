import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChangeSuggestion {
  id: string;
  person_id: string;
  family_id: string;
  suggested_by?: string;
  suggester_name?: string;
  suggester_email?: string;
  block_id?: string;
  change_type: 'block_content' | 'block_add' | 'block_remove' | 'person_info';
  current_value?: any;
  suggested_value: any;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_reason?: string;
  created_at: string;
  updated_at: string;
}

export function useChangeSuggestions(personId: string) {
  return useQuery({
    queryKey: ['change-suggestions', personId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_change_suggestions')
        .select('*')
        .eq('person_id', personId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ChangeSuggestion[];
    },
  });
}

export function useApproveSuggestion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ suggestionId, reviewerId }: { suggestionId: string; reviewerId: string }) => {
      const { data, error } = await (supabase.rpc as any)('approve_change_suggestion', {
        p_suggestion_id: suggestionId,
        p_reviewer_id: reviewerId,
        p_apply_changes: true,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change-suggestions'] });
      toast({
        title: 'Suggestion approved',
        description: 'The change has been applied.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Approval failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useRejectSuggestion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      suggestionId, 
      reviewerId, 
      reason 
    }: { 
      suggestionId: string; 
      reviewerId: string; 
      reason: string;
    }) => {
      const { data, error } = await (supabase.rpc as any)('reject_change_suggestion', {
        p_suggestion_id: suggestionId,
        p_reviewer_id: reviewerId,
        p_reason: reason,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change-suggestions'] });
      toast({
        title: 'Suggestion rejected',
        description: 'The change has been declined.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Rejection failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useSubmitSuggestion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (suggestion: {
      person_id: string;
      family_id: string;
      suggested_by?: string;
      suggester_name?: string;
      suggester_email?: string;
      block_id?: string;
      change_type: 'block_content' | 'block_add' | 'block_remove' | 'person_info';
      current_value?: any;
      suggested_value: any;
      reason?: string;
    }) => {
      const { data, error } = await supabase
        .from('content_change_suggestions')
        .insert([suggestion])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['change-suggestions', variables.person_id] });
      toast({
        title: 'Suggestion submitted',
        description: 'Your change suggestion has been submitted for review.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Submission failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
