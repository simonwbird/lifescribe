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
      <DialogContent className="max-w-lg p-6">
        <DialogHeader className="relative pb-4">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-8 w-8 rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle className="text-xl font-semibold text-left pr-10">
            How would you like to respond?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Your prompt section */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">Your prompt:</p>
            <div className="p-4 rounded-xl bg-muted/30 border">
              <p className="font-medium text-foreground">{prompt.title}</p>
            </div>
          </div>

          {/* Response options */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-4">
              Choose your preferred way to share:
            </p>
            
            <div className="space-y-3">
              {/* Voice Recording */}
              <Button
                variant="outline"
                className="w-full h-auto p-4 justify-start text-left hover:bg-muted/50 border-2 hover:border-primary/20 transition-all"
                onClick={() => onSelectResponse('voice')}
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="rounded-full bg-muted p-3 shrink-0">
                    <Mic className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="font-semibold text-foreground">Voice Recording</p>
                    <p className="text-sm text-muted-foreground">
                      Speak naturally — just like having a conversation
                    </p>
                  </div>
                </div>
              </Button>

              {/* Write Your Story */}
              <Button
                variant="outline"
                className="w-full h-auto p-4 justify-start text-left hover:bg-muted/50 border-2 hover:border-primary/20 transition-all"
                onClick={() => onSelectResponse('text')}
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="rounded-full bg-primary/10 p-3 shrink-0">
                    <Type className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="font-semibold text-foreground">Write Your Story</p>
                    <p className="text-sm text-muted-foreground">
                      Type your thoughts and memories
                    </p>
                  </div>
                </div>
              </Button>

              {/* Video Message */}
              <Button
                variant="outline"
                className="w-full h-auto p-4 justify-start text-left hover:bg-muted/50 border-2 hover:border-primary/20 transition-all"
                onClick={() => onSelectResponse('video')}
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="rounded-full bg-secondary/20 p-3 shrink-0">
                    <Video className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="font-semibold text-foreground">Video Message</p>
                    <p className="text-sm text-muted-foreground">
                      Record yourself telling the story
                    </p>
                  </div>
                </div>
              </Button>
            </div>
          </div>

          {/* Encouragement text */}
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Don't worry about being perfect — your family will love hearing from you
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}