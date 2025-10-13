import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_completed_at: string | null;
  posts_this_week: number;
}

export function useUserStreak(userId?: string, familyId?: string) {
  const queryClient = useQueryClient();

  const streakQuery = useQuery({
    queryKey: ['user-streak', userId, familyId],
    queryFn: async (): Promise<StreakData | null> => {
      if (!userId || !familyId) return null

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
      const weekStartStr = weekStart.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('user_streaks' as any)
        .select('*')
        .eq('user_id', userId)
        .eq('family_id', familyId)
        .eq('week_start_date', weekStartStr)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user streak:', error)
        return null
      }

      return (data as any) || { 
        current_streak: 0, 
        longest_streak: 0, 
        last_completed_at: null,
        posts_this_week: 0 
      }
    },
    enabled: !!userId && !!familyId,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true
  });

  const updateStreakMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !familyId) return null;

      const { data, error } = await supabase.rpc('update_user_streak' as any, {
        p_user_id: userId,
        p_family_id: familyId
      } as any);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-streak', userId, familyId] });
    }
  });

  return {
    ...streakQuery,
    updateStreak: updateStreakMutation.mutate,
    isUpdating: updateStreakMutation.isPending
  };
}
