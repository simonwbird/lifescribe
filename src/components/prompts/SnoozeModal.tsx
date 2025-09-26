import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock } from 'lucide-react';

interface SnoozeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSnooze: (until: Date) => void;
  promptTitle: string;
}

export function SnoozeModal({ isOpen, onClose, onSnooze, promptTitle }: SnoozeModalProps) {
  const [duration, setDuration] = useState<string>('');

  const getDurationDate = (durationValue: string): Date => {
    const now = new Date();
    switch (durationValue) {
      case '1hour':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case '3hours':
        return new Date(now.getTime() + 3 * 60 * 60 * 1000);
      case '1day':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case '3days':
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      case '1week':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case '1month':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  };

  const getDurationLabel = (durationValue: string): string => {
    switch (durationValue) {
      case '1hour': return '1 hour';
      case '3hours': return '3 hours';
      case '1day': return '1 day';
      case '3days': return '3 days';
      case '1week': return '1 week';
      case '1month': return '1 month';
      default: return '';
    }
  };

  const handleSnooze = () => {
    if (duration) {
      onSnooze(getDurationDate(duration));
      onClose();
      setDuration('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Snooze Prompt
          </DialogTitle>
          <DialogDescription>
            When would you like to be reminded about "{promptTitle}"?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a duration..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1hour">In 1 hour</SelectItem>
              <SelectItem value="3hours">In 3 hours</SelectItem>
              <SelectItem value="1day">Tomorrow</SelectItem>
              <SelectItem value="3days">In 3 days</SelectItem>
              <SelectItem value="1week">In 1 week</SelectItem>
              <SelectItem value="1month">In 1 month</SelectItem>
            </SelectContent>
          </Select>

          {duration && (
            <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                This prompt will return on{' '}
                <span className="font-medium">
                  {getDurationDate(duration).toLocaleDateString()} at{' '}
                  {getDurationDate(duration).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSnooze} disabled={!duration}>
            <Clock className="h-4 w-4 mr-2" />
            Snooze for {getDurationLabel(duration)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}