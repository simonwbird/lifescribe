import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Target, Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TeenStreakWidgetProps {
  userId: string;
  familyId: string;
}

export function TeenStreakWidget({ userId, familyId }: TeenStreakWidgetProps) {
  const { toast } = useToast();

  const { data: streakData, isLoading } = useQuery({
    queryKey: ['teen-streak', userId, familyId],
    queryFn: async () => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
      const weekStartStr = weekStart.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('user_streaks' as any)
        .select('*')
        .eq('user_id', userId)
        .eq('family_id', familyId)
        .eq('week_start_date', weekStartStr)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching streak:', error);
        throw error;
      }

      return (data as any) || {
        current_streak: 0,
        longest_streak: 0,
        posts_this_week: 0,
        last_completed_at: null
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStreak = streakData?.current_streak || 0;
  const longestStreak = streakData?.longest_streak || 0;
  const postsThisWeek = streakData?.posts_this_week || 0;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Your Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Streak */}
        <div className="flex items-center gap-3 p-4 bg-background rounded-lg border border-primary/10">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-500/10">
            <Flame className="h-6 w-6 text-orange-500" />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-foreground">
              {currentStreak} {currentStreak === 1 ? 'week' : 'weeks'}
            </div>
            <div className="text-sm text-muted-foreground">
              Keep it going! 🔥
            </div>
          </div>
        </div>

        {/* This Week's Progress */}
        <div className="flex items-center gap-3 p-4 bg-background rounded-lg border border-primary/10">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10">
            <Target className="h-6 w-6 text-blue-500" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold text-foreground">
              {postsThisWeek} {postsThisWeek === 1 ? 'post' : 'posts'} this week
            </div>
            <div className="text-sm text-muted-foreground">
              {postsThisWeek > 0 ? 'Awesome work!' : 'Post to start your week!'}
            </div>
          </div>
        </div>

        {/* Longest Streak */}
        {longestStreak > 0 && (
          <div className="flex items-center gap-3 p-4 bg-background rounded-lg border border-primary/10">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10">
              <Trophy className="h-6 w-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold text-foreground">
                {longestStreak} {longestStreak === 1 ? 'week' : 'weeks'}
              </div>
              <div className="text-sm text-muted-foreground">
                Best streak ever! 🏆
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center pt-2">
          Post each week to keep your streak alive!
        </p>
      </CardContent>
    </Card>
  );
}
