import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, Image, Mic } from 'lucide-react';
import { UpcomingItem } from '@/lib/homeTypes';
import { useAnalytics } from '@/hooks/useAnalytics';

// Mock data
const mockUpcoming: UpcomingItem[] = [
  {
    id: '1',
    person: 'Mom',
    type: 'Birthday',
    when: '2025-01-15'
  },
  {
    id: '2',
    person: 'Sarah & Mike',
    type: 'Anniversary',
    when: '2025-01-20'
  }
];

export default function Upcoming() {
  const { track } = useAnalytics();

  const getDaysUntil = (date: string) => {
    const eventDate = new Date(date);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleQuickAction = (action: string, person: string) => {
    track('upcoming_quick_action', { action, person });
    console.log(`${action} for ${person}`);
    // In real app, would open appropriate creation flow
  };

  if (mockUpcoming.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-serif">Upcoming</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {mockUpcoming.map((item) => {
          const daysUntil = getDaysUntil(item.when);
          const isToday = daysUntil === 0;
          const isPast = daysUntil < 0;
          
          return (
            <div 
              key={item.id}
              className={`p-3 rounded-lg border ${
                isToday 
                  ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800' 
                  : 'bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{item.person}'s {item.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {isToday ? 'Today!' : isPast ? `${Math.abs(daysUntil)} days ago` : `${daysUntil} days`}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-1 flex-wrap">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleQuickAction('write_note', item.person)}
                  className="h-7 px-2 text-xs"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Write note
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleQuickAction('add_photo', item.person)}
                  className="h-7 px-2 text-xs"
                >
                  <Image className="h-3 w-3 mr-1" />
                  Add photo
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleQuickAction('record_greeting', item.person)}
                  className="h-7 px-2 text-xs"
                >
                  <Mic className="h-3 w-3 mr-1" />
                  Record
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}