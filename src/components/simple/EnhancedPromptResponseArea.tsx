import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Video, PenTool, Sparkles } from 'lucide-react';
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
    description: 'Natural and easy',
    color: 'bg-green-500 hover:bg-green-600',
    isDefault: true
  },
  {
    id: 'video' as ResponseFormat,
    label: 'Video Message',
    icon: Video,
    description: 'Show your expressions',
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    id: 'text' as ResponseFormat,
    label: 'Write Your Story',
    icon: PenTool,
    description: 'Take your time',
    color: 'bg-purple-500 hover:bg-purple-600'
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
  const [showFormatOptions, setShowFormatOptions] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ResponseFormat>('voice');
  const { track } = useAnalytics();
  const { toast } = useToast();
  const { isFirstTime, markCompleted, showGuide } = useFirstTimeExperience();

  const handlePrimaryAction = () => {
    if (!showFormatOptions) {
      setShowFormatOptions(true);
      track('activity_clicked', { 
        action: 'prompt_response_expanded',
        prompt_id: prompt.id,
        prompt_type: prompt.type
      });
    } else {
      handleFormatSelected(selectedFormat);
    }
  };

  const handleFormatSelected = (format: ResponseFormat) => {
    track('activity_clicked', {
      action: 'response_format_selected',
      format,
      prompt_id: prompt.id,
      prompt_type: prompt.type,
      is_first_time: isFirstTime
    });

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
            "border-2 border-primary/20 hover:border-primary/40",
            showFormatOptions && "rounded-b-none"
          )}
          aria-label={showFormatOptions ? `Record using ${selectedFormatOption.label}` : "Respond to this prompt"}
        >
          <div className="flex items-center gap-3">
            {showFormatOptions ? (
              <>
                <selectedFormatOption.icon className="h-6 w-6" />
                <span>Record with {selectedFormatOption.label}</span>
              </>
            ) : (
              <>
                <Mic className="h-6 w-6" />
                <span>Respond to this prompt</span>
              </>
            )}
          </div>
        </Button>

        {/* Inline Format Options */}
        {showFormatOptions && (
          <Card className="rounded-t-none border-t-0 shadow-lg">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {formatOptions.map((option) => (
                  <Button
                    key={option.id}
                    variant={selectedFormat === option.id ? "default" : "outline"}
                    onClick={() => setSelectedFormat(option.id)}
                    className={cn(
                      "h-20 flex-col gap-2 transition-all duration-200",
                      selectedFormat === option.id && option.color,
                      option.isDefault && selectedFormat !== option.id && "border-primary/50"
                    )}
                  >
                    <option.icon className="h-5 w-5" />
                    <div className="text-center">
                      <div className="font-semibold text-sm">{option.label}</div>
                      <div className="text-xs opacity-80">{option.description}</div>
                    </div>
                    {option.isDefault && selectedFormat !== option.id && (
                      <Badge variant="secondary" className="text-xs">
                        Recommended
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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