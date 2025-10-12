import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuestsWidgetProps {
  personId: string;
  familyId: string;
  onStartQuest?: (questId: string) => void;
}

interface Quest {
  id: string;
  title: string;
  description: string;
}

export function QuestsWidget({ personId, familyId, onStartQuest }: QuestsWidgetProps) {
  const { toast } = useToast();

  const quests: Quest[] = [
    {
      id: 'five-jobs',
      title: 'Five Jobs That Shaped Me',
      description: 'Share the jobs that defined your journey',
    },
    {
      id: 'rooms-i-loved',
      title: 'Rooms I Loved',
      description: 'Describe spaces that meant the most',
    },
    {
      id: 'songs-that-saved-me',
      title: 'Songs That Saved My Year',
      description: 'Share the music that got you through',
    },
  ];

  const handleStart = (questId: string) => {
    if (onStartQuest) {
      onStartQuest(questId);
    } else {
      // Scroll to stories section
      const storiesSection = document.getElementById('stories');
      if (storiesSection) {
        storiesSection.scrollIntoView({ behavior: 'smooth' });
        toast({
          title: 'Quest started!',
          description: 'Start writing your story below.',
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Story Quests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {quests.map((quest) => (
            <div
              key={quest.id}
              className="rounded-lg border p-3 space-y-2 hover:bg-accent/50 transition-colors"
            >
              <div>
                <div className="text-sm font-medium">{quest.title}</div>
                <div className="text-xs text-muted-foreground">
                  {quest.description}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStart(quest.id)}
                className="w-full"
              >
                Start Quest
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
