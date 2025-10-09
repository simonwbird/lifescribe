import { Info, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePeopleWithNoContent } from '@/hooks/usePeopleWithNoContent';
import { useAnalytics } from '@/hooks/useAnalytics';

interface MissingContentBannerProps {
  familyId: string | null;
}

export function MissingContentBanner({ familyId }: MissingContentBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const { data: peopleWithoutContent = [], isLoading } = usePeopleWithNoContent(familyId);
  const { track } = useAnalytics();
  const navigate = useNavigate();

  if (isLoading || dismissed || peopleWithoutContent.length === 0) {
    return null;
  }

  const count = peopleWithoutContent.length;
  const names = peopleWithoutContent
    .slice(0, 3)
    .map(p => p.given_name || p.full_name)
    .join(', ');
  const moreCount = Math.max(0, count - 3);

  const handleAddStory = () => {
    track('missing_content_banner_clicked', {
      people_count: count,
      action: 'add_story'
    });
    navigate('/stories/new');
  };

  const handleDismiss = () => {
    track('missing_content_banner_dismissed', {
      people_count: count
    });
    setDismissed(true);
  };

  return (
    <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <div className="flex-shrink-0 mt-0.5">
          <Info className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium mb-1">
            What's Missing?
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {count === 1 ? (
              <>
                <span className="font-medium text-foreground">{names}</span> has no stories yet
              </>
            ) : (
              <>
                <span className="font-medium text-foreground">{names}</span>
                {moreCount > 0 && <span> and {moreCount} {moreCount === 1 ? 'other' : 'others'}</span>} have no stories yet
              </>
            )}
            {' '}— want to add one?
          </p>
          
          <Button
            onClick={handleAddStory}
            size="sm"
            variant="default"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add a Story
          </Button>
        </div>
      </div>
    </div>
  );
}
