import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { PromptInstance } from './usePrompts'

/**
 * Optimized hook specifically for fetching today's prompt
 * Only fetches the first open prompt instead of all prompts
 */
export function useTodaysPrompt(familyId: string) {
  return useQuery({
    queryKey: ['todays-prompt', familyId],
    queryFn: async (): Promise<PromptInstance | null> => {
      // Only fetch the first open prompt with minimal data
      const { data, error } = await supabase
        .from('prompt_instances')
        .select(`
          id,
          status,
          person_ids,
          due_at,
          created_at,
          updated_at,
          prompt:prompts(
            id,
            title,
            body,
            category
          )
        `)
        .eq('family_id', familyId)
        .eq('status', 'open')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return data as PromptInstance | null
    },
    enabled: !!familyId,
    staleTime: 0, // Always refetch to get latest prompt after completion
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to page
    refetchOnMount: true // Refetch when component mounts
  })
}

/**
 * Optimized hook for in-progress prompts (up to 3)
 */
export function useInProgressPrompts(familyId: string) {
  return useQuery({
    queryKey: ['in-progress-prompts-mini', familyId],
    queryFn: async (): Promise<PromptInstance[]> => {
      const { data, error } = await supabase
        .from('prompt_instances')
        .select(`
          id,
          status,
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
        .limit(3)

      if (error) throw error
      return (data || []) as PromptInstance[]
    },
    enabled: !!familyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  })
}