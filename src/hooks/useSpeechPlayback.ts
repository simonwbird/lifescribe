import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface UseSpeechPlaybackOptions {
  rate?: number
  pitch?: number
  volume?: number
  lang?: string
  voice?: string
  onEnd?: () => void
  onError?: (error: Error) => void
}

export interface UseSpeechPlaybackReturn {
  isPlaying: boolean
  isLoading: boolean
  speak: (text: string) => Promise<void>
  stop: () => void
  toggle: (text: string) => void
  currentText: string | null
}

/**
 * React hook for managing speech playback with ElevenLabs
 * Provides controls for speaking text, stopping, and tracking playback state
 */
export const useSpeechPlayback = (options: UseSpeechPlaybackOptions = {}): UseSpeechPlaybackReturn => {
  const {
    voice = 'Brian',
    onEnd,
    onError
  } = options

  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentText, setCurrentText] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const speakText = useCallback(async (text: string) => {
    if (!text) return

    try {
      // Stop any ongoing playback
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      setIsLoading(true)
      setCurrentText(text)

      // Call ElevenLabs TTS edge function
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { text, voice }
      })

      if (error) throw error
      if (!data?.audioContent) throw new Error('No audio data received')

      // Create audio element and play
      const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`)
      audioRef.current = audio

      audio.onplay = () => {
        setIsLoading(false)
        setIsPlaying(true)
      }

      audio.onended = () => {
        setIsPlaying(false)
        setCurrentText(null)
        audioRef.current = null
        onEnd?.()
      }

      audio.onerror = (event) => {
        console.error('Audio playback error:', event)
        setIsPlaying(false)
        setIsLoading(false)
        setCurrentText(null)
        audioRef.current = null
        onError?.(new Error('Audio playback failed'))
      }

      await audio.play()
    } catch (error) {
      console.error('Error in speak:', error)
      setIsLoading(false)
      setIsPlaying(false)
      setCurrentText(null)
      onError?.(error as Error)
    }
  }, [voice, onEnd, onError])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsPlaying(false)
    setIsLoading(false)
    setCurrentText(null)
  }, [])

  const toggle = useCallback((text: string) => {
    if (isPlaying && currentText === text) {
      stop()
    } else {
      speakText(text)
    }
  }, [isPlaying, currentText, stop, speakText])

  return {
    isPlaying,
    isLoading,
    speak: speakText,
    stop,
    toggle,
    currentText
  }
}
