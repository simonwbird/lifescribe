import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mic, Video, PenTool, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useToast } from '@/hooks/use-toast';
import SecondaryActions from './SecondaryActions';
import EmotionalNudges from './EmotionalNudges';
import FirstTimeGuide from './FirstTimeGuide';
import { useFirstTimeExperience } from '@/hooks/useFirstTimeExperience';

interface EnhancedPromptResponseAreaProps {
  prompt: {
    id: string;
    text: string;
    type: 'general' | 'personal';
  };
  onRecord: (format: 'voice' | 'video' | 'text') => void;
  onLifePage: () => void;
  onCreateFreeform: () => void;
  onAddPhoto: () => void;
  onQuickVoice: () => void;
  userAge?: 'child' | 'teen' | 'adult' | 'elder';
}

type ResponseFormat = 'voice' | 'video' | 'text';

const formatOptions = [
  {
    id: 'voice' as ResponseFormat,
    label: 'Voice Recording',
    icon: Mic,
    description: 'Speak naturally — just like having a conversation',
    color: 'bg-gray-100 hover:bg-gray-200',
    isDefault: true
  },
  {
    id: 'text' as ResponseFormat,
    label: 'Write Your Story',
    icon: PenTool,
    description: 'Type your thoughts and memories',
    color: 'bg-blue-100 hover:bg-blue-200'
  },
  {
    id: 'video' as ResponseFormat,
    label: 'Video Message',
    icon: Video,
    description: 'Record yourself telling the story',
    color: 'bg-purple-100 hover:bg-purple-200'
  }
];

export default function EnhancedPromptResponseArea({
  prompt,
  onRecord,
  onLifePage,
  onCreateFreeform,
  onAddPhoto,
  onQuickVoice,
  userAge = 'adult'
}: EnhancedPromptResponseAreaProps) {
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showFormatOptions, setShowFormatOptions] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ResponseFormat>('voice');
  const { track } = useAnalytics();
  const { toast } = useToast();
  const { isFirstTime, markCompleted, showGuide } = useFirstTimeExperience();

  const handlePrimaryAction = () => {
    setShowResponseModal(true);
    track('activity_clicked', { 
      action: 'prompt_response_modal_opened',
      prompt_id: prompt.id,
      prompt_type: prompt.type
    });
  };

  const handleFormatSelected = (format: ResponseFormat) => {
    track('activity_clicked', {
      action: 'response_format_selected',
      format,
      prompt_id: prompt.id,
      prompt_type: prompt.type,
      is_first_time: isFirstTime
    });

    setShowResponseModal(false);
    onRecord(format);
    
    // Show celebration for first-time users
    if (isFirstTime) {
      toast({
        title: "🎉 Amazing start!",
        description: "Your family will love hearing from you!",
        duration: 5000,
      });
      markCompleted('first_story');
    }
  };

  const selectedFormatOption = formatOptions.find(f => f.id === selectedFormat) || formatOptions[0];

  return (
    <div className="space-y-3 relative">
      {/* First-Time Guide Overlay */}
      {showGuide && (
        <FirstTimeGuide
          onDismiss={() => markCompleted('guide_seen')}
          userAge={userAge}
        />
      )}

      {/* Prompt Display */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <Badge variant="outline" className="mb-2 text-xs">
                {prompt.type === 'personal' ? 'Personal Prompt' : 'Family Prompt'}
              </Badge>
              <p className="text-lg font-medium leading-relaxed text-foreground">
                {prompt.text}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Primary Action Button */}
      <div className="space-y-3">
        <Button
          onClick={handlePrimaryAction}
          size="lg"
          className={cn(
            "w-full h-16 text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300",
            "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground",
            "focus:ring-4 focus:ring-primary/30 focus:outline-none",
            "border-2 border-primary/20 hover:border-primary/40"
          )}
          aria-label="Respond to this prompt"
        >
          <div className="flex items-center gap-3">
            <Mic className="h-6 w-6" />
            <span>Respond to this prompt</span>
          </div>
        </Button>
      </div>

      {/* Response Format Modal */}
      <Dialog open={showResponseModal} onOpenChange={setShowResponseModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif">How would you like to respond?</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Your prompt:</p>
              <p className="font-medium text-foreground">{prompt.text}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-4">Choose your preferred way to share:</p>
              
              <div className="space-y-3">
                {formatOptions.map((option) => (
                  <Button
                    key={option.id}
                    variant="ghost"
                    onClick={() => handleFormatSelected(option.id)}
                    className={cn(
                      "w-full h-auto p-4 justify-start gap-4",
                      "hover:bg-gray-50 border border-gray-200 rounded-lg",
                      "transition-all duration-200"
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-full flex-shrink-0",
                      option.color
                    )}>
                      <option.icon className="h-5 w-5 text-gray-700" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't worry about being perfect — your family will love hearing from you
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Secondary Actions */}
      <SecondaryActions
        onLifePage={onLifePage}
        onCreateFreeform={onCreateFreeform}
        onAddPhoto={onAddPhoto}
        onQuickVoice={onQuickVoice}
        userAge={userAge}
      />

      {/* Emotional Nudges */}
      <EmotionalNudges
        userAge={userAge}
        selectedFormat={selectedFormat}
        hasResponded={false}
      />
    </div>
  );
}