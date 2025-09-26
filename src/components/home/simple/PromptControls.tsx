import { Button } from '@/components/ui/button'
import { Volume2, VolumeX, Shuffle } from 'lucide-react'
import { useTextToSpeech } from '@/hooks/useTextToSpeech'
import { ElderPrompt } from '@/lib/prompts/getElderPrompts'
import { useAnalytics } from '@/hooks/useAnalytics'

interface PromptControlsProps {
  prompt: ElderPrompt
  onShuffle: () => void
  shuffling: boolean
  enhanced?: boolean // For prominent elder-friendly display
}

export function PromptControls({ prompt, onShuffle, shuffling, enhanced = false }: PromptControlsProps) {
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
        rate: 0.75, // Even slower for elders
        pitch: 1.0,
        volume: 0.9
      })
    }
  }

  // Enhanced mode for prominent elder-friendly display
  if (enhanced) {
    return (
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        {/* Large "Hear It" Button */}
        {ttsSupported ? (
          <Button
            onClick={handleTTS}
            variant={isSpeaking ? "default" : "outline"}
            size="lg"
            className={`h-16 px-8 text-lg font-bold min-w-48 transition-all duration-200 ${
              isSpeaking 
                ? 'bg-green-600 hover:bg-green-700 text-white animate-pulse' 
                : 'border-2 hover:bg-accent hover:scale-105'
            }`}
            aria-label={isSpeaking ? "Stop reading prompt aloud" : "Hear this prompt read aloud"}
            aria-pressed={isSpeaking}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-6 h-6 mr-3" />
                <span>Stop Reading</span>
              </>
            ) : (
              <>
                <Volume2 className="w-6 h-6 mr-3" />
                <span>Hear It</span>
              </>
            )}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="lg"
            className="h-16 px-8 text-lg font-bold min-w-48 bg-muted/50 hover:bg-muted border-2"
            onClick={() => {
              alert(`Prompt: ${prompt.text}\n\nNote: Text-to-speech is not available in this browser. You can read this prompt aloud or have someone read it to you.`)
            }}
            title="Text-to-speech not available - click to see prompt text"
          >
            <Volume2 className="w-6 h-6 mr-3" />
            <span>Read Prompt</span>
          </Button>
        )}
      </div>
    )
  }

  // Regular mode for smaller displays
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