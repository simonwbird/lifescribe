import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Gift, Camera, Users, Lightbulb, ChevronRight } from 'lucide-react';
import type { UpcomingMoment } from '@/lib/homeTypes';

export default function RightRail() {
  const [streak, setStreak] = useState({ current: 4, total: 7 });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [upcomingMoments, setUpcomingMoments] = useState<UpcomingMoment[]>([]);

  useEffect(() => {
    // Mock data - would fetch from database in real app
    setSuggestions([
      'Tag people in last week\'s upload?',
      'Add locations to 2 photos',
      'Write about your childhood home'
    ]);

    setUpcomingMoments([
      {
        id: '1',
        type: 'birthday',
        personName: 'Mom',
        date: '2024-01-15',
        daysUntil: 3
      },
      {
        id: '2',
        type: 'anniversary',
        personName: 'Parents',
        date: '2024-01-22',
        daysUntil: 10
      }
    ]);
  }, []);

  return (
    <div className="space-y-6">
      {/* Progress/Streak */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h3 font-serif text-charcoal flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-sage" />
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-body text-charcoal">Stories captured</span>
                <span className="text-body font-medium text-sage">
                  {streak.current} of {streak.total}
                </span>
              </div>
              <Progress 
                value={(streak.current / streak.total) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="text-fine text-warm-gray">
              You're doing great! Keep the momentum going.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h3 font-serif text-charcoal flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-sage" />
            Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-between text-left h-auto p-3 hover:bg-sage/5"
              >
                <span className="text-body text-charcoal">
                  {suggestion}
                </span>
                <ChevronRight className="w-4 h-4 text-warm-gray" />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Moments */}
      {upcomingMoments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-h3 font-serif text-charcoal flex items-center">
              <Gift className="w-5 h-5 mr-2 text-sage" />
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingMoments.map((moment) => (
                <div
                  key={moment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-warm-beige/20"
                >
                  <div>
                    <p className="text-body text-charcoal font-medium">
                      {moment.type === 'birthday' ? '🎂' : '💕'} {moment.personName}
                    </p>
                    <p className="text-fine text-warm-gray">
                      {moment.type === 'birthday' ? 'Birthday' : 'Anniversary'} in {moment.daysUntil} days
                    </p>
                  </div>
                  
                  <Button size="sm" variant="outline" className="text-sage border-sage/30">
                    Write note
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}