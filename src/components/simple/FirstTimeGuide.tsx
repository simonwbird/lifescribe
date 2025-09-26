import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, X, ArrowDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FirstTimeGuideProps {
  onDismiss: () => void;
  userAge: 'child' | 'teen' | 'adult' | 'elder';
}

const guideContent = {
  elder: {
    title: "Welcome! Let's get you started",
    steps: [
      "Tap the big button below to record your story",
      "Speak naturally—just like talking to family",
      "Tap again when you're done talking",
      "Your story will be saved automatically"
    ],
    encouragement: "Take your time—there's no rush, and you can always try again!"
  },
  adult: {
    title: "Quick Start Guide",
    steps: [
      "Tap 'Respond to this prompt' to begin",
      "Choose your preferred format (Voice is recommended)",
      "Record your response naturally",
      "Your story is automatically saved"
    ],
    encouragement: "Jump right in—your family will love hearing from you!"
  },
  teen: {
    title: "Ready to Share? 🎉",
    steps: [
      "Hit the big button to start recording",
      "Pick Voice, Video, or Text—whatever feels right",
      "Just be yourself and share your thoughts",
      "Done! Your story goes live instantly"
    ],
    encouragement: "No pressure—just have fun with it! ✨"
  },
  child: {
    title: "Let's Make a Story! 🌟",
    steps: [
      "Press the colorful button below",
      "Talk about anything awesome!",
      "Press again when you're finished",
      "Your family will love hearing from you!"
    ],
    encouragement: "You're going to do great! Just have fun! 🎈"
  }
};

export default function FirstTimeGuide({ onDismiss, userAge }: FirstTimeGuideProps) {
  const content = guideContent[userAge];

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center pt-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onDismiss}
      />
      
      {/* Guide Card */}
      <Card className={cn(
        "relative w-full max-w-md mx-4 shadow-2xl border-2",
        "animate-scale-in",
        userAge === 'child' && "border-primary/50 bg-gradient-to-br from-primary/5 to-secondary/5",
        userAge === 'teen' && "border-secondary/50 bg-gradient-to-br from-secondary/5 to-primary/5"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className={cn(
              "flex items-center gap-2",
              userAge === 'child' && "text-primary",
              userAge === 'teen' && "text-secondary"
            )}>
              <Sparkles className="h-5 w-5" />
              {content.title}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-8 w-8 p-0 hover:bg-muted/60"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Steps */}
          <div className="space-y-3">
            {content.steps.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                  "bg-primary text-primary-foreground"
                )}>
                  {index + 1}
                </div>
                <p className="text-sm leading-relaxed">{step}</p>
              </div>
            ))}
          </div>

          {/* Pointing Arrow */}
          <div className="flex justify-center py-2">
            <ArrowDown className={cn(
              "h-6 w-6 text-primary animate-bounce",
              userAge === 'child' && "h-8 w-8 text-secondary"
            )} />
          </div>

          {/* Encouragement */}
          <div className={cn(
            "p-3 rounded-lg text-sm text-center",
            "bg-muted/30 border border-muted/20"
          )}>
            <Mic className="h-4 w-4 mx-auto mb-2 text-primary" />
            <p className="font-medium">{content.encouragement}</p>
          </div>

          {/* Action Button */}
          <Button
            onClick={onDismiss}
            className={cn(
              "w-full",
              userAge === 'child' && "bg-gradient-to-r from-primary to-secondary text-white",
              userAge === 'teen' && "bg-gradient-to-r from-secondary to-primary text-white"
            )}
          >
            Got it! Let's start
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}