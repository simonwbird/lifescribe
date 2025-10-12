import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, startOfDay } from 'date-fns';

interface UpcomingDatesWidgetProps {
  personId: string;
  familyId: string;
}

interface UpcomingDate {
  id: string;
  title: string;
  date: Date;
  daysUntil: number;
  type: 'milestone' | 'event' | 'goal';
}

export function UpcomingDatesWidget({ personId, familyId }: UpcomingDatesWidgetProps) {
  const [dates, setDates] = useState<UpcomingDate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingDates();
  }, [personId, familyId]);

  const fetchUpcomingDates = async () => {
    try {
      const today = startOfDay(new Date());
      const sixtyDaysFromNow = new Date(today);
      sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

      // Fetch stories with dates in the future (milestones, events)
      const { data: upcomingStories } = await supabase
        .from('stories')
        .select('id, title, occurred_on, tags')
        .eq('family_id', familyId)
        .gte('occurred_on', today.toISOString())
        .lte('occurred_on', sixtyDaysFromNow.toISOString())
        .order('occurred_on', { ascending: true })
        .limit(5);

      // Fetch from person_story_links for this person
      const { data: personStoryLinks } = await supabase
        .from('person_story_links')
        .select('story_id')
        .eq('person_id', personId);

      const personStoryIds = new Set(
        (personStoryLinks || []).map((link: any) => link.story_id)
      );

      const upcomingDates: UpcomingDate[] = (upcomingStories || [])
        .filter((story: any) => personStoryIds.has(story.id))
        .map((story: any) => {
          const storyDate = new Date(story.occurred_on);
          const daysUntil = differenceInDays(storyDate, today);
          
          let type: 'milestone' | 'event' | 'goal' = 'event';
          if (story.tags?.includes('milestone')) type = 'milestone';
          if (story.tags?.includes('now-next')) type = 'goal';

          return {
            id: story.id,
            title: story.title,
            date: storyDate,
            daysUntil,
            type,
          };
        })
        .sort((a: UpcomingDate, b: UpcomingDate) => a.daysUntil - b.daysUntil);

      setDates(upcomingDates);
    } catch (error) {
      console.error('Error fetching upcoming dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'milestone':
        return 'bg-primary/10 text-primary';
      case 'goal':
        return 'bg-blue-500/10 text-blue-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading || dates.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Upcoming Dates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dates.map((date) => (
            <div
              key={date.id}
              className="rounded-lg border p-3 space-y-2 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {date.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {date.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <Badge variant="outline" className={getTypeColor(date.type)}>
                  {date.type}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {date.daysUntil === 0
                  ? 'Today'
                  : date.daysUntil === 1
                  ? 'Tomorrow'
                  : `In ${date.daysUntil} days`}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
