import { useState, useCallback, useEffect, useRef } from 'react'
import { speak, stopSpeaking, isSpeaking as checkIsSpeaking, type SpeechOptions } from '@/utils/speechUtils'

export interface UseSpeechPlaybackOptions {
  rate?: number
  pitch?: number
  volume?: number
  lang?: string
  onEnd?: () => void
  onError?: (error: Error) => void
}

export interface UseSpeechPlaybackReturn {
  isPlaying: boolean
  speak: (text: string) => Promise<void>
  stop: () => void
  toggle: (text: string) => void
  currentText: string | null
}

/**
 * React hook for managing speech playback
 * Provides controls for speaking text, stopping, and tracking playback state
 */
export const useSpeechPlayback = (options: UseSpeechPlaybackOptions = {}): UseSpeechPlaybackReturn => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentText, setCurrentText] = useState<string | null>(null)
  const checkIntervalRef = useRef<NodeJS.Timeout>()

  // Check if speech is actually playing (polling for accuracy)
  useEffect(() => {
    if (isPlaying) {
      checkIntervalRef.current = setInterval(() => {
        if (!checkIsSpeaking()) {
          setIsPlaying(false)
          setCurrentText(null)
        }
      }, 100)
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [isPlaying])

  const speakText = useCallback(async (text: string) => {
    if (!text) return

    try {
      setIsPlaying(true)
      setCurrentText(text)

      await speak(text, {
        ...options,
        onEnd: () => {
          setIsPlaying(false)
          setCurrentText(null)
          options.onEnd?.()
        },
        onError: (error) => {
          setIsPlaying(false)
          setCurrentText(null)
          options.onError?.(error)
        }
      })
    } catch (error) {
      setIsPlaying(false)
      setCurrentText(null)
      console.error('Speech playback error:', error)
    }
  }, [options])

  const stop = useCallback(() => {
    stopSpeaking()
    setIsPlaying(false)
    setCurrentText(null)
  }, [])

  const toggle = useCallback((text: string) => {
    if (isPlaying && currentText === text) {
      stop()
    } else {
      speakText(text)
    }
  }, [isPlaying, currentText, stop, speakText])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    isPlaying,
    speak: speakText,
    stop,
    toggle,
    currentText
  }
}
