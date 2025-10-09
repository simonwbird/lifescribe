import { Info, Plus, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePeopleWithNoContent } from '@/hooks/usePeopleWithNoContent';
import { useAnalytics } from '@/hooks/useAnalytics';

interface MissingContentBannerProps {
  familyId: string | null;
}

const DISMISS_KEY_PREFIX = 'missing-content-banner-dismissed-';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function MissingContentBanner({ familyId }: MissingContentBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const { data: peopleWithoutContent = [], isLoading } = usePeopleWithNoContent(familyId);
  const { track } = useAnalytics();
  const navigate = useNavigate();

  // Check localStorage for dismissal
  useEffect(() => {
    if (!familyId) return;

    const dismissKey = `${DISMISS_KEY_PREFIX}${familyId}`;
    const dismissedUntil = localStorage.getItem(dismissKey);

    if (dismissedUntil) {
      const dismissedTime = parseInt(dismissedUntil, 10);
      if (Date.now() < dismissedTime) {
        setDismissed(true);
      } else {
        // Expired, remove from localStorage
        localStorage.removeItem(dismissKey);
      }
    }
  }, [familyId]);

  // Track banner shown
  useEffect(() => {
    if (!isLoading && !dismissed && peopleWithoutContent.length > 0 && familyId) {
      track({
        event_name: 'audit_banner_shown',
        properties: {
          family_id: familyId,
          people_count: peopleWithoutContent.length,
          page: window.location.pathname
        }
      } as any);
    }
  }, [isLoading, dismissed, peopleWithoutContent.length, familyId, track]);

  if (isLoading || dismissed || peopleWithoutContent.length === 0) {
    return null;
  }

  const count = peopleWithoutContent.length;
  const firstPerson = peopleWithoutContent[0];
  const names = peopleWithoutContent
    .slice(0, 2)
    .map(p => p.given_name || p.full_name)
    .join(' and ');
  const moreCount = Math.max(0, count - 2);

  const handleAddMemory = () => {
    if (!familyId) return;

    track({
      event_name: 'audit_banner_clicked',
      properties: {
        family_id: familyId,
        people_count: count,
        first_person_id: firstPerson.id
      }
    } as any);

    // Navigate to story creation pre-filtered for the first person without content
    navigate(`/stories/new?personId=${firstPerson.id}&personName=${encodeURIComponent(firstPerson.full_name)}`);
  };

  const handleDismiss = () => {
    if (!familyId) return;

    track({
      event_name: 'audit_banner_dismissed',
      properties: {
        family_id: familyId,
        people_count: count
      }
    } as any);

    // Store dismissal with 7-day expiry
    const dismissKey = `${DISMISS_KEY_PREFIX}${familyId}`;
    const expiryTime = Date.now() + DISMISS_DURATION_MS;
    localStorage.setItem(dismissKey, expiryTime.toString());
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
          <p className="text-sm text-muted-foreground mb-3">
            {count === 1 ? (
              <>
                A few branches are still waiting for stories. <span className="font-medium text-foreground">{names}</span> would love to have their first memory added.
              </>
            ) : count === 2 ? (
              <>
                A few branches are still waiting for stories. <span className="font-medium text-foreground">{names}</span> would love to have their first memories added.
              </>
            ) : (
              <>
                A few branches are still waiting for stories. <span className="font-medium text-foreground">{names}</span>
                {moreCount > 0 && <span> and {moreCount} {moreCount === 1 ? 'other' : 'others'}</span>} would love to have their first memories added.
              </>
            )}
          </p>
          
          <Button
            onClick={handleAddMemory}
            size="sm"
            variant="default"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Memory
          </Button>
        </div>
      </div>
    </div>
  );
}
