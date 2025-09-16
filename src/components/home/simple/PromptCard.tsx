import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, Volume2, VolumeX } from 'lucide-react'
import { ElderPrompt, truncatePrompt } from '@/lib/prompts/getElderPrompts'

interface PromptCardProps {
  prompt: ElderPrompt
  onRecord: (prompt: ElderPrompt) => void
  onTTS?: (prompt: ElderPrompt) => void
  isSpeaking?: boolean
}

export function PromptCard({ 
  prompt, 
  onRecord, 
  onTTS, 
  isSpeaking 
}: PromptCardProps) {
  return (
    <Card className="w-full border-2 hover:border-primary/20 transition-colors">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Prompt Text */}
          <div className="space-y-2">
            <p className="text-xl sm:text-2xl font-medium leading-relaxed text-foreground">
              {truncatePrompt(prompt.text, 90)}
            </p>
            <p className="text-sm text-muted-foreground">
              No need to be perfect—just talk.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 items-center">
            <Button
              onClick={() => onRecord(prompt)}
              size="lg"
              className="flex-1 h-12 text-base font-medium bg-primary hover:bg-primary/90"
            >
              <Mic className="w-5 h-5 mr-2" />
              Start with this
            </Button>

            {onTTS && (
              <Button
                onClick={() => onTTS(prompt)}
                variant="outline"
                size="lg"
                className="h-12 w-12 p-0 shrink-0"
                aria-label={isSpeaking ? "Stop reading prompt" : "Hear this prompt"}
                aria-pressed={isSpeaking}
              >
                {isSpeaking ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}