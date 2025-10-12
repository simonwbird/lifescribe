import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, TrendingUp } from 'lucide-react';

interface StreaksWidgetProps {
  personId: string;
  familyId: string;
}

export function StreaksWidget({ personId, familyId }: StreaksWidgetProps) {
  // Placeholder for now - will be enhanced with real data later
  const streaks = [
    {
      type: 'days',
      count: 7,
      label: 'days active',
      icon: Flame,
    },
    {
      type: 'total',
      count: 12,
      label: 'contributions this month',
      icon: TrendingUp,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Flame className="h-4 w-4" />
          Your Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {streaks.map((streak) => {
          const Icon = streak.icon;
          return (
            <div key={streak.type} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {streak.count} {streak.label}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
