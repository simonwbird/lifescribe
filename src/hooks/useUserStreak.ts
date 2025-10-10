import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export function useUserStreak(userId?: string) {
  return useQuery({
    queryKey: ['user-streak', userId],
    queryFn: async () => {
      if (!userId) return null

      const { data, error } = await supabase
        .from('user_streaks')
        .select('current_streak, longest_streak, last_completed_at')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching user streak:', error)
        return null
      }

      return data || { current_streak: 0, longest_streak: 0, last_completed_at: null }
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true
  })
}
