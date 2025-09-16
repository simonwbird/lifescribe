import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Type } from 'lucide-react'
import { ElderPrompt } from '@/lib/prompts/getElderPrompts'

interface PermissionDeniedCardProps {
  prompt: ElderPrompt
  onTryAgain: () => void
  onTypeInstead: () => void
  onDismiss: () => void
}

export function PermissionDeniedCard({ 
  prompt, 
  onTryAgain, 
  onTypeInstead, 
  onDismiss 
}: PermissionDeniedCardProps) {
  return (
    <Card className="w-full border-destructive/50 bg-destructive/5">
      <CardContent className="p-6">
        <div className="space-y-4 text-center">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <MicOff className="w-8 h-8 text-destructive" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Microphone is blocked
            </h3>
            <p className="text-sm text-muted-foreground">
              We need microphone access to record your story. 
              Please check your browser settings and allow microphone access.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={onTryAgain}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              <Mic className="w-4 h-4 mr-2" />
              Try again
            </Button>
            
            <Button
              onClick={onTypeInstead}
              size="lg"
              className="flex-1"
            >
              <Type className="w-4 h-4 mr-2" />
              Type instead
            </Button>
          </div>

          {/* Dismiss */}
          <Button
            onClick={onDismiss}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            Maybe later
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}