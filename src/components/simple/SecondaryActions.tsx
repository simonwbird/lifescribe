import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Mic2, PenTool } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/hooks/useAnalytics';

interface SecondaryActionsProps {
  onLifePage: () => void;
  onCreateFreeform: () => void;
  onAddPhoto: () => void;
  onQuickVoice: () => void;
  userAge: 'child' | 'teen' | 'adult' | 'elder';
}

const getLifePageAction = (userAge: 'child' | 'teen' | 'adult' | 'elder') => {
  // TODO: Add proper context detection based on current profile being viewed
  // For now, defaulting to "Build Your Life Page" until profile context is available
  return {
    id: 'life_page',
    label: 'Build Your Life Page',
    icon: PenTool, // Using PenTool as placeholder for 📖
    description: 'Collect stories, photos, and memories in one place',
    action: 'onLifePage' as const, // Updated to use life page handler
    emoji: '📖'
  }
}

const getSecondaryActions = (userAge: 'child' | 'teen' | 'adult' | 'elder') => [
  getLifePageAction(userAge),
  {
    id: 'quick_voice',
    label: 'Try Quick Voice',
    icon: Mic2,
    description: 'Just start talking',
    action: 'onQuickVoice' as const,
    emoji: '🎙'
  },
  {
    id: 'create_story',
    label: 'Create Your Own Story',
    icon: PenTool,
    description: 'Share anything you like',
    action: 'onCreateFreeform' as const,
    emoji: '✍️'
  }
];

export default function SecondaryActions({
  onLifePage,
  onCreateFreeform,
  onAddPhoto,
  onQuickVoice,
  userAge
}: SecondaryActionsProps) {
  const { track } = useAnalytics();

  const actionHandlers = {
    onLifePage,
    onCreateFreeform,
    onAddPhoto,
    onQuickVoice
  };

  const handleActionClick = (actionId: string, handlerKey: keyof typeof actionHandlers) => {
    track('activity_clicked', {
      action: 'secondary_action_clicked',
      action_id: actionId,
      user_age: userAge
    });

    actionHandlers[handlerKey]();
  };

  const secondaryActions = getSecondaryActions(userAge);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {secondaryActions.map((action) => (
        <Card 
          key={action.id}
          className={cn(
            "cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
            "border-border hover:border-brand-primary/30 bg-card hover:bg-neutral-canvas",
            "group"
          )}
          onClick={() => handleActionClick(action.id, action.action)}
        >
          <CardContent className="p-4 text-center">
            <div className="space-y-2">
              {/* Icon with emoji */}
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg" role="img" aria-label={action.label}>
                  {action.emoji}
                </span>
                <action.icon className={cn(
                  "h-5 w-5 text-primary transition-all duration-300",
                  "group-hover:scale-110 group-hover:text-brand-primary"
                )} />
              </div>
              
              {/* Label */}
              <h3 className={cn(
                "font-semibold text-sm text-foreground",
                "group-hover:text-primary transition-colors duration-300"
              )}>
                {action.label}
              </h3>
              
              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed">
                {action.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}