import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInProgressPrompts } from '@/hooks/usePromptProgress';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ContinueWhereYouLeftOffProps {
  familyId: string;
  onContinue: (instanceId: string) => void;
}

export function ContinueWhereYouLeftOff({ familyId, onContinue }: ContinueWhereYouLeftOffProps) {
  const { data: inProgressPrompts, isLoading } = useInProgressPrompts(familyId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!inProgressPrompts || inProgressPrompts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Continue Where You Left Off
        </CardTitle>
        <CardDescription>
          Pick up where you left off with these drafts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {inProgressPrompts.map((instance) => (
          <div
            key={instance.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card"
          >
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">
                {instance.prompt?.title || 'Untitled Prompt'}
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                {instance.prompt?.body?.substring(0, 80)}...
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  Draft saved
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(instance.updated_at), { addSuffix: true })}
                </span>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => onContinue(instance.id)}
              className="ml-3 shrink-0"
            >
              <Play className="h-4 w-4 mr-1" />
              Continue
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}