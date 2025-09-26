import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, X } from 'lucide-react';

interface FallbackPrompt {
  id: string;
  title: string;
  body: string;
  category: string;
}

interface NotApplicableModalProps {
  isOpen: boolean;
  onClose: () => void;
  fallbackPrompt?: FallbackPrompt;
  onAcceptFallback: (prompt: FallbackPrompt) => void;
}

export function NotApplicableModal({ 
  isOpen, 
  onClose, 
  fallbackPrompt, 
  onAcceptFallback 
}: NotApplicableModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            How about this instead?
          </DialogTitle>
          <DialogDescription>
            Since that prompt wasn't quite right for you, here's an alternative suggestion:
          </DialogDescription>
        </DialogHeader>

        {fallbackPrompt && (
          <div className="space-y-3">
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="flex items-start gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {fallbackPrompt.category}
                </Badge>
              </div>
              <h4 className="font-medium mb-1">{fallbackPrompt.title}</h4>
              <p className="text-sm text-muted-foreground">
                {fallbackPrompt.body}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Maybe Later
          </Button>
          {fallbackPrompt && (
            <Button
              onClick={() => {
                onAcceptFallback(fallbackPrompt);
                onClose();
              }}
              className="gap-2"
            >
              <Lightbulb className="h-4 w-4" />
              Try This One
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}