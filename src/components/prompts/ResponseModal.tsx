import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, Type, Video, X } from 'lucide-react';

interface ResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: {
    title: string;
    body: string;
  };
  onSelectResponse: (type: 'voice' | 'text' | 'video') => void;
}

export function ResponseModal({ isOpen, onClose, prompt, onSelectResponse }: ResponseModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-6 w-6"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle className="text-left pr-8">
            How would you like to respond?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Your prompt section */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Your prompt:</p>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-medium">{prompt.title}</p>
            </div>
          </div>

          {/* Response options */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Choose your preferred way to share:
            </p>
            
            <div className="space-y-3">
              {/* Voice Recording */}
              <Button
                variant="outline"
                className="w-full h-auto p-4 justify-start text-left"
                onClick={() => onSelectResponse('voice')}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2 shrink-0">
                    <Mic className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Voice Recording</p>
                    <p className="text-sm text-muted-foreground">
                      Speak naturally — just like having a conversation
                    </p>
                  </div>
                </div>
              </Button>

              {/* Write Your Story */}
              <Button
                variant="outline"
                className="w-full h-auto p-4 justify-start text-left"
                onClick={() => onSelectResponse('text')}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/20 text-primary p-2 shrink-0">
                    <Type className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Write Your Story</p>
                    <p className="text-sm text-muted-foreground">
                      Type your thoughts and memories
                    </p>
                  </div>
                </div>
              </Button>

              {/* Video Message */}
              <Button
                variant="outline"
                className="w-full h-auto p-4 justify-start text-left"
                onClick={() => onSelectResponse('video')}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-accent/20 text-accent-foreground p-2 shrink-0">
                    <Video className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Video Message</p>
                    <p className="text-sm text-muted-foreground">
                      Record yourself telling the story
                    </p>
                  </div>
                </div>
              </Button>
            </div>
          </div>

          {/* Encouragement text */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't worry about being perfect — your family will love hearing from you
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}