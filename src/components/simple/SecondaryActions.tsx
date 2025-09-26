import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Plus, Camera, Mic2, Heart, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/hooks/useAnalytics';

interface SecondaryActionsProps {
  onBrowseFeed: () => void;
  onCreateFreeform: () => void;
  onAddPhoto: () => void;
  onQuickVoice: () => void;
  userAge: 'child' | 'teen' | 'adult' | 'elder';
}

const baseActions = [
  {
    id: 'browse_feed',
    label: 'Browse the Family Feed',
    icon: Eye,
    description: 'See stories from others',
    action: 'onBrowseFeed' as const,
    isPrimary: true
  },
  {
    id: 'create_freeform',
    label: 'Create your own story',
    icon: Plus,
    description: 'Share anything on your mind',
    action: 'onCreateFreeform' as const,
    isPrimary: true
  }
];

const rotatingActions = [
  {
    id: 'add_photo',
    label: 'Add a Photo Memory',
    icon: Camera,
    description: 'Share a special moment',
    action: 'onAddPhoto' as const,
    ageGroups: ['child', 'teen', 'adult', 'elder']
  },
  {
    id: 'quick_voice',
    label: 'Try Quick Voice',
    icon: Mic2,
    description: 'Just start talking',
    action: 'onQuickVoice' as const,
    ageGroups: ['elder', 'adult']
  },
  {
    id: 'family_moments',
    label: 'Share Family Moments',
    icon: Heart,
    description: 'Tell us about today',
    action: 'onCreateFreeform' as const,
    ageGroups: ['child', 'teen']
  },
  {
    id: 'connect_family',
    label: 'Connect with Family',
    icon: Users,
    description: 'See who\'s been active',
    action: 'onBrowseFeed' as const,
    ageGroups: ['adult', 'elder']
  }
];

export default function SecondaryActions({
  onBrowseFeed,
  onCreateFreeform,
  onAddPhoto,
  onQuickVoice,
  userAge
}: SecondaryActionsProps) {
  const [currentRotatingIndex, setCurrentRotatingIndex] = useState(0);
  const { track } = useAnalytics();

  const actionHandlers = {
    onBrowseFeed,
    onCreateFreeform,
    onAddPhoto,
    onQuickVoice
  };

  // Filter rotating actions by age group
  const availableRotatingActions = rotatingActions.filter(
    action => action.ageGroups.includes(userAge)
  );

  // Rotate through available actions every 10 seconds
  useEffect(() => {
    if (availableRotatingActions.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentRotatingIndex(prev => 
        (prev + 1) % availableRotatingActions.length
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [availableRotatingActions.length]);

  const handleActionClick = (actionId: string, handlerKey: keyof typeof actionHandlers) => {
    track('activity_clicked', {
      action: 'secondary_action_clicked',
      action_id: actionId,
      user_age: userAge,
      is_rotating: !baseActions.some(a => a.id === actionId)
    });

    actionHandlers[handlerKey]();
  };

  const currentRotatingAction = availableRotatingActions[currentRotatingIndex];

  return (
    <div className="space-y-3">
      {/* Primary Secondary Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {baseActions.map((action) => (
          <Button
            key={action.id}
            variant="ghost"
            onClick={() => handleActionClick(action.id, action.action)}
            className={cn(
              "h-16 flex-col gap-1 text-muted-foreground hover:text-foreground",
              "hover:bg-muted/60 transition-all duration-200",
              "border border-muted/30 hover:border-muted/60"
            )}
          >
            <action.icon className="h-5 w-5" />
            <div className="text-center">
              <div className="font-medium text-sm">{action.label}</div>
              <div className="text-xs opacity-70">{action.description}</div>
            </div>
          </Button>
        ))}
      </div>

      {/* Rotating Action */}
      {currentRotatingAction && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => handleActionClick(currentRotatingAction.id, currentRotatingAction.action)}
            className={cn(
              "h-12 px-6 flex items-center gap-2 text-muted-foreground hover:text-foreground",
              "hover:bg-muted/40 transition-all duration-300",
              "border border-dashed border-muted/40 hover:border-muted/60",
              "animate-fade-in"
            )}
          >
            <currentRotatingAction.icon className="h-4 w-4" />
            <div className="text-center">
              <span className="font-medium text-sm">{currentRotatingAction.label}</span>
              <span className="text-xs opacity-70 ml-2">• {currentRotatingAction.description}</span>
            </div>
          </Button>
        </div>
      )}
    </div>
  );
}