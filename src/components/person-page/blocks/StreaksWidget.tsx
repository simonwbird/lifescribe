import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, TrendingUp } from 'lucide-react';
import { useUserStreak } from '@/hooks/useUserStreak';

interface StreaksWidgetProps {
  personId: string;
  familyId: string;
}

export function StreaksWidget({ personId, familyId }: StreaksWidgetProps) {
  const { data: streakData, isLoading } = useUserStreak(personId, familyId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-6 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStreak = streakData?.current_streak || 0;
  const postsThisWeek = streakData?.posts_this_week || 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Flame className="h-4 w-4" />
          Your Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <div className="flex-1">
            <div className="text-sm font-medium">
              {currentStreak} {currentStreak === 1 ? 'week' : 'weeks'} streak
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <div className="flex-1">
            <div className="text-sm font-medium">
              {postsThisWeek} {postsThisWeek === 1 ? 'post' : 'posts'} this week
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
