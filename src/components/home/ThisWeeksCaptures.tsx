import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Flame, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ThisWeeksCaptures() {
  const navigate = useNavigate();
  const capturesThisWeek = 4;
  const weeklyGoal = 7;
  const currentStreak = 12;
  const progressPercentage = (capturesThisWeek / weeklyGoal) * 100;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/analytics/captures?range=this-week')}
            className="text-lg font-serif hover:text-primary transition-colors focus:outline-none focus:text-primary text-left"
            aria-label="View detailed capture analytics"
          >
            This Week's Captures
          </button>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
            Turn off streaks
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{capturesThisWeek} / {weeklyGoal}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <div className="flex items-center gap-1">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">{currentStreak} day streak!</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Keep sharing to maintain your streak. Great job staying connected with your family!
        </p>

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={() => navigate('/analytics/captures?range=this-week')}
          aria-label="View full capture analytics"
        >
          View Details
          <ArrowRight className="h-3 w-3 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}