import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUncitedStories } from '@/hooks/useStorySources';
import { AlertCircle, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface UncitedStoriesWidgetProps {
  familyId: string;
}

export function UncitedStoriesWidget({ familyId }: UncitedStoriesWidgetProps) {
  const { data: uncitedStories = [], isLoading } = useUncitedStories(familyId);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileQuestion className="h-4 w-4" />
            Citations Needed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (uncitedStories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileQuestion className="h-4 w-4" />
            Citations Needed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-success">All stories are cited! 🎉</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 text-warning" />
          Citations Needed
        </CardTitle>
        <CardDescription>
          {uncitedStories.length} {uncitedStories.length === 1 ? 'story needs' : 'stories need'} sources
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {uncitedStories.slice(0, 5).map((story) => (
          <div
            key={story.id}
            className="flex items-start justify-between gap-2 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
            onClick={() => navigate(`/story/${story.id}`)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{story.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
        {uncitedStories.length > 5 && (
          <Button
            variant="link"
            size="sm"
            className="w-full"
            onClick={() => navigate('/research/citations?status=uncited')}
            aria-label={`View all ${uncitedStories.length} uncited stories`}
          >
            View all {uncitedStories.length} uncited stories
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
