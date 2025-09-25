import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, Type, Video, X } from 'lucide-react'
import { ElderPrompt, truncatePrompt } from '@/lib/prompts/getElderPrompts'
import { useAnalytics } from '@/hooks/useAnalytics'

interface InputTypeModalProps {
  isOpen: boolean
  prompt: ElderPrompt
  onSelectType: (type: 'text' | 'audio' | 'video') => void
  onCancel: () => void
}

export function InputTypeModal({ 
  isOpen, 
  prompt, 
  onSelectType,
  onCancel 
}: InputTypeModalProps) {
  const { track } = useAnalytics()

  const handleSelectType = (type: 'text' | 'audio' | 'video') => {
    track('prompt.input_type_selected', {
      prompt_id: prompt.id,
      input_type: type,
      prompt_kind: prompt.kind
    })
    
    onSelectType(type)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-lg mx-auto">
        <DialogHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="absolute -top-2 -right-2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle className="text-xl font-medium pr-8">
            How would you like to respond?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-2">
          {/* Prompt Preview */}
          <div className="p-4 bg-accent/50 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-2">Your prompt:</p>
            <p className="text-base font-medium">
              {truncatePrompt(prompt.text, 120)}
            </p>
          </div>

          {/* Input Type Options */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Choose your preferred way to share:
            </p>
            
            {/* Audio Option */}
            <Card 
              className="cursor-pointer hover:bg-accent/50 transition-colors border-2 hover:border-primary/20"
              onClick={() => handleSelectType('audio')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mic className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-base">Voice Recording</h3>
                    <p className="text-sm text-muted-foreground">
                      Speak naturally — just like having a conversation
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Text Option */}
            <Card 
              className="cursor-pointer hover:bg-accent/50 transition-colors border-2 hover:border-primary/20"
              onClick={() => handleSelectType('text')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Type className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-base">Write Your Story</h3>
                    <p className="text-sm text-muted-foreground">
                      Type your thoughts and memories
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Option */}
            <Card 
              className="cursor-pointer hover:bg-accent/50 transition-colors border-2 hover:border-primary/20"
              onClick={() => handleSelectType('video')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Video className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-base">Video Message</h3>
                    <p className="text-sm text-muted-foreground">
                      Record yourself telling the story
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Don't worry about being perfect — your family will love hearing from you
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}