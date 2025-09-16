import { useState, useCallback, useRef } from 'react'

export function useTextToSpeech() {
  const [isSupported] = useState(() => 'speechSynthesis' in window)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = useCallback((text: string, options?: {
    rate?: number
    pitch?: number
    volume?: number
    voice?: SpeechSynthesisVoice
  }) => {
    if (!isSupported || !text.trim()) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    
    // Set options with defaults
    utterance.rate = options?.rate ?? 0.9
    utterance.pitch = options?.pitch ?? 1
    utterance.volume = options?.volume ?? 0.8
    
    if (options?.voice) {
      utterance.voice = options.voice
    }

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true)
      setIsPaused(false)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      setIsPaused(false)
      currentUtterance.current = null
    }

    utterance.onerror = () => {
      setIsSpeaking(false)
      setIsPaused(false)
      currentUtterance.current = null
    }

    utterance.onpause = () => {
      setIsPaused(true)
    }

    utterance.onresume = () => {
      setIsPaused(false)
    }

    currentUtterance.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [isSupported])

  const stop = useCallback(() => {
    if (!isSupported) return
    
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
    currentUtterance.current = null
  }, [isSupported])

  const pause = useCallback(() => {
    if (!isSupported || !isSpeaking) return
    
    window.speechSynthesis.pause()
  }, [isSupported, isSpeaking])

  const resume = useCallback(() => {
    if (!isSupported || !isPaused) return
    
    window.speechSynthesis.resume()
  }, [isSupported, isPaused])

  const getVoices = useCallback(() => {
    if (!isSupported) return []
    return window.speechSynthesis.getVoices()
  }, [isSupported])

  return {
    isSupported,
    isSpeaking,
    isPaused,
    speak,
    stop,
    pause,
    resume,
    getVoices
  }
}