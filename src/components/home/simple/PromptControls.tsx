import { Button } from '@/components/ui/button'
import { Volume2, VolumeX, Shuffle } from 'lucide-react'
import { useTextToSpeech } from '@/hooks/useTextToSpeech'
import { ElderPrompt } from '@/lib/prompts/getElderPrompts'
import { useAnalytics } from '@/hooks/useAnalytics'

interface PromptControlsProps {
  prompt: ElderPrompt
  onShuffle: () => void
  shuffling: boolean
}

export function PromptControls({ prompt, onShuffle, shuffling }: PromptControlsProps) {
  const { speak, isSpeaking, stop, isSupported: ttsSupported } = useTextToSpeech()
  const { track } = useAnalytics()

  const handleTTS = () => {
    track('prompt.tts_play', {
      prompt_id: prompt.id,
      kind: prompt.kind
    })

    if (isSpeaking) {
      stop()
    } else {
      speak(prompt.text)
    }
  }

  return (
    <div className="flex gap-2">
      {/* Hear It Button */}
      {ttsSupported && (
        <Button
          onClick={handleTTS}
          variant="outline"
          size="sm"
          className="h-10 px-3 text-sm font-medium min-w-0"
          aria-label={isSpeaking ? "Stop reading prompt" : "Hear this prompt"}
          aria-pressed={isSpeaking}
        >
          {isSpeaking ? (
            <VolumeX className="w-4 h-4 mr-2" />
          ) : (
            <Volume2 className="w-4 h-4 mr-2" />
          )}
          <span className="hidden sm:inline">Hear it</span>
        </Button>
      )}

      {/* Shuffle Button */}
      <Button
        onClick={onShuffle}
        variant="outline"
        size="sm"
        disabled={shuffling}
        className="h-10 px-3 text-sm font-medium min-w-0"
        aria-label="Shuffle prompts"
      >
        <Shuffle className={`w-4 h-4 mr-2 ${shuffling ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">Shuffle</span>
      </Button>
    </div>
  )
}