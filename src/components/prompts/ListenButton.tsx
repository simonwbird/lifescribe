import { Volume2, VolumeX, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSpeechPlayback } from '@/hooks/useSpeechPlayback'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface ListenButtonProps {
  text: string
  promptId?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showLabel?: boolean
}

export function ListenButton({
  text,
  promptId,
  variant = 'outline',
  size = 'default',
  className,
  showLabel = false
}: ListenButtonProps) {
  const { track } = useAnalytics()
  const { isPlaying, isLoading, speak, stop, currentText } = useSpeechPlayback({
    voice: 'Brian', // Premium ElevenLabs voice
    onEnd: () => {
      track({
        event_name: 'tts_play_end',
        properties: {
          prompt_id: promptId,
          text_length: text.length,
          voice: 'elevenlabs_brian'
        }
      } as any)
    },
    onError: (error) => {
      console.error('TTS error:', error)
    }
  })

  const isThisPlaying = isPlaying && currentText === text

  const handleClick = async () => {
    if (isThisPlaying) {
      stop()
    } else {
      track({
        event_name: 'tts_play_start',
        properties: {
          prompt_id: promptId,
          text_length: text.length,
          voice: 'elevenlabs_brian'
        }
      } as any)
      await speak(text)
    }
  }

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={cn(
        'transition-all',
        isThisPlaying && 'animate-pulse',
        className
      )}
      aria-label={isThisPlaying ? 'Stop reading prompt' : 'Hear this prompt'}
      aria-pressed={isThisPlaying}
    >
      {isLoading ? (
        <>
          <Loader2 className={cn(
            size === 'icon' ? 'h-5 w-5' : 'h-4 w-4',
            showLabel && 'mr-2',
            'animate-spin'
          )} />
          {showLabel && 'Loading...'}
        </>
      ) : isThisPlaying ? (
        <>
          <VolumeX className={cn(
            size === 'icon' ? 'h-5 w-5' : 'h-4 w-4',
            showLabel && 'mr-2'
          )} />
          {showLabel && 'Stop'}
        </>
      ) : (
        <>
          <Volume2 className={cn(
            size === 'icon' ? 'h-5 w-5' : 'h-4 w-4',
            showLabel && 'mr-2'
          )} />
          {showLabel && 'Listen'}
        </>
      )}
    </Button>
  )
}
