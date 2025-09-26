import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { usePromptProgress } from '@/hooks/usePromptProgress';
import { Skeleton } from '@/components/ui/skeleton';

interface ProgressHeaderProps {
  familyId: string;
  variant?: 'full' | 'compact';
}

export function ProgressHeader({ familyId, variant = 'full' }: ProgressHeaderProps) {
  const { data: progress, isLoading } = usePromptProgress(familyId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-2 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progress) return null;

  const completionPercentage = progress.overall.total_active > 0 
    ? Math.round((progress.overall.completed / progress.overall.total_active) * 100)
    : 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Overall Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground">
                Your Family Story Progress
              </h3>
              <span className="text-sm text-muted-foreground">
                {progress.overall.completed} of {progress.overall.total_active} completed
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {completionPercentage}% complete
            </p>
          </div>

          {/* Category Progress - only show in full variant */}
          {variant === 'full' && progress.by_category?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 text-muted-foreground">By Category</p>
              <div className="flex flex-wrap gap-2">
                {progress.by_category.map((category) => (
                  <Badge 
                    key={category.category} 
                    variant="secondary" 
                    className="text-xs"
                  >
                    {category.category} {category.completed}/{category.total}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Person Progress - show top 3 in compact, all in full */}
          {progress.by_person?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 text-muted-foreground">By Person</p>
              <div className="flex flex-wrap gap-2">
                {(variant === 'compact' ? progress.by_person.slice(0, 3) : progress.by_person)
                  .map((person) => (
                  <Badge 
                    key={person.person_id} 
                    variant="outline" 
                    className="text-xs"
                  >
                    {person.name} {person.completed}/{person.total}
                  </Badge>
                ))}
                {variant === 'compact' && progress.by_person.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{progress.by_person.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}