import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, Type, Video, X, Lightbulb } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'

interface BlankCanvasModalProps {
  isOpen: boolean
  onSelectType: (type: 'text' | 'audio' | 'video') => void
  onCancel: () => void
}

export function BlankCanvasModal({ 
  isOpen,
  onSelectType,
  onCancel 
}: BlankCanvasModalProps) {
  const { track } = useAnalytics()

  const handleSelectType = (type: 'text' | 'audio' | 'video') => {
    track('blank_canvas.input_type_selected', {
      input_type: type
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
            Start with a blank canvas
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-2">
          {/* Explanation */}
          <div className="p-4 bg-accent/50 rounded-lg border flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Share anything on your mind</p>
              <p className="text-sm text-muted-foreground">
                No prompt needed — just start sharing a memory, story, or thought that matters to you.
              </p>
            </div>
          </div>

          {/* Input Type Options */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              How would you like to share?
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
                      Speak naturally about whatever comes to mind
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
                      Type out your thoughts and memories
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
                      Record yourself sharing your story
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              There's no wrong way to share — your family treasures every memory
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}