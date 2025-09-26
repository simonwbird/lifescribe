import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Play, Clock, X, Ban, SkipForward } from 'lucide-react';
import { SnoozeModal } from './SnoozeModal';
import { NotApplicableModal } from './NotApplicableModal';
import { 
  skipPromptInstance, 
  markNotApplicable, 
  snoozePromptInstance,
  markInProgress,
  type NotApplicableResponse 
} from '@/services/promptStatusService';
import { useToast } from '@/hooks/use-toast';

interface PromptStatusActionsProps {
  instanceId: string;
  promptTitle: string;
  status: string;
  onStatusChange?: () => void;
  onStartPrompt?: () => void;
}

export function PromptStatusActions({ 
  instanceId, 
  promptTitle, 
  status, 
  onStatusChange,
  onStartPrompt 
}: PromptStatusActionsProps) {
  const [showSnoozeModal, setShowSnoozeModal] = useState(false);
  const [showNotApplicableModal, setShowNotApplicableModal] = useState(false);
  const [fallbackPrompt, setFallbackPrompt] = useState<NotApplicableResponse['fallbackPrompt']>();
  const { toast } = useToast();

  const handleSkip = async () => {
    try {
      await skipPromptInstance(instanceId);
      toast({ title: 'Prompt skipped' });
      onStatusChange?.();
    } catch (error) {
      toast({ 
        title: 'Failed to skip prompt', 
        variant: 'destructive' 
      });
    }
  };

  const handleNotApplicable = async () => {
    try {
      const response = await markNotApplicable(instanceId);
      if (response.fallbackPrompt) {
        setFallbackPrompt(response.fallbackPrompt);
        setShowNotApplicableModal(true);
      }
      toast({ title: 'Marked as not applicable' });
      onStatusChange?.();
    } catch (error) {
      toast({ 
        title: 'Failed to mark as not applicable', 
        variant: 'destructive' 
      });
    }
  };

  const handleSnooze = async (until: Date) => {
    try {
      await snoozePromptInstance(instanceId, { until });
      toast({ title: 'Prompt snoozed' });
      onStatusChange?.();
    } catch (error) {
      toast({ 
        title: 'Failed to snooze prompt', 
        variant: 'destructive' 
      });
    }
  };

  const handleStartPrompt = async () => {
    try {
      await markInProgress(instanceId);
      onStartPrompt?.();
    } catch (error) {
      toast({ 
        title: 'Failed to start prompt', 
        variant: 'destructive' 
      });
    }
  };

  const handleAcceptFallback = async (prompt: any) => {
    // This would typically create a new prompt instance and navigate to it
    // For now, just show a success message
    toast({ 
      title: 'Alternative prompt accepted',
      description: 'You can now answer this alternative prompt instead.'
    });
  };

  if (status === 'completed') {
    return (
      <Button size="sm" variant="outline" disabled>
        Completed
      </Button>
    );
  }

  if (status === 'in_progress') {
    return (
      <Button size="sm" onClick={onStartPrompt}>
        <Play className="h-4 w-4 mr-1" />
        Continue
      </Button>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button size="sm" onClick={handleStartPrompt}>
          <Play className="h-4 w-4 mr-1" />
          Start
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowSnoozeModal(true)}>
              <Clock className="h-4 w-4 mr-2" />
              Snooze
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSkip}>
              <SkipForward className="h-4 w-4 mr-2" />
              Skip
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleNotApplicable}>
              <Ban className="h-4 w-4 mr-2" />
              Not Applicable
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SnoozeModal
        isOpen={showSnoozeModal}
        onClose={() => setShowSnoozeModal(false)}
        onSnooze={handleSnooze}
        promptTitle={promptTitle}
      />

      <NotApplicableModal
        isOpen={showNotApplicableModal}
        onClose={() => setShowNotApplicableModal(false)}
        fallbackPrompt={fallbackPrompt}
        onAcceptFallback={handleAcceptFallback}
      />
    </>
  );
}