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
      kind: prompt.kind,
      action: isSpeaking ? 'stop' : 'start'
    })

    if (isSpeaking) {
      stop()
    } else {
      // Use slightly slower rate and higher pitch for better clarity
      speak(prompt.text, {
        rate: 0.8,
        pitch: 1.0,
        volume: 0.9
      })
    }
  }

  return (
    <div className="flex gap-2">
      {/* Hear It Button */}
      {ttsSupported ? (
        <Button
          onClick={handleTTS}
          variant="outline"
          size="sm"
          className={`h-10 px-3 text-sm font-medium min-w-0 transition-colors ${
            isSpeaking 
              ? 'bg-primary/10 border-primary/20 text-primary' 
              : 'hover:bg-accent'
          }`}
          aria-label={isSpeaking ? "Stop reading prompt" : "Hear this prompt"}
          aria-pressed={isSpeaking}
        >
          {isSpeaking ? (
            <VolumeX className="w-4 h-4 mr-2" />
          ) : (
            <Volume2 className="w-4 h-4 mr-2" />
          )}
          <span className="hidden sm:inline">
            {isSpeaking ? 'Stop' : 'Hear it'}
          </span>
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="h-10 px-3 text-sm font-medium min-w-0 bg-muted/50 hover:bg-muted"
          onClick={() => {
            // Fallback: show alert with prompt text for screen readers or manual reading
            alert(`Prompt: ${prompt.text}\n\nNote: Text-to-speech is not available in this browser. You can read this prompt aloud or have someone read it to you.`)
          }}
          title="Text-to-speech not available - click to see prompt text"
        >
          <Volume2 className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Read prompt</span>
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