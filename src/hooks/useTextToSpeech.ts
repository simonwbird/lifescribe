import { useState, useCallback, useRef, useEffect } from 'react'

export function useTextToSpeech() {
  const [isSupported] = useState(() => 'speechSynthesis' in window)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null)

  // Load available voices
  useEffect(() => {
    if (!isSupported) return

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices()
      setVoices(availableVoices)
    }

    loadVoices()
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [isSupported])

  // Find the best female voice
  const getBestFemaleVoice = useCallback(() => {
    if (!voices.length) return null

    // Priority order for natural female voices
    const femaleVoicePreferences = [
      // English female voices (high quality)
      'Samantha', 'Alex', 'Victoria', 'Allison', 'Ava', 'Susan', 'Zoe',
      // Microsoft voices
      'Microsoft Zira', 'Microsoft Hazel', 'Microsoft Eva', 'Microsoft Aria',
      // Google voices  
      'Google UK English Female', 'Google US English Female',
      // Any voice with 'female' in name
      'Female',
      // Fallback: any voice with these names
      'Karen', 'Moira', 'Tessa', 'Veena', 'Fiona', 'Serena'
    ]

    // First try to find voices by name preference
    for (const preference of femaleVoicePreferences) {
      const voice = voices.find(v => 
        v.name.toLowerCase().includes(preference.toLowerCase())
      )
      if (voice) return voice
    }

    // Fallback: find any voice that might be female (avoid obviously male names)
    const maleNames = ['daniel', 'thomas', 'jorge', 'diego', 'fred', 'albert', 'ralph']
    const femaleVoice = voices.find(v => 
      v.lang.startsWith('en') && 
      !maleNames.some(male => v.name.toLowerCase().includes(male))
    )

    return femaleVoice || voices[0] || null
  }, [voices])

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
    
    // Set options with defaults optimized for natural female speech
    utterance.rate = options?.rate ?? 0.85  // Slightly slower for clarity
    utterance.pitch = options?.pitch ?? 1.1 // Slightly higher for feminine sound
    utterance.volume = options?.volume ?? 0.8
    
    // Use custom voice or find best female voice
    if (options?.voice) {
      utterance.voice = options.voice
    } else {
      const femaleVoice = getBestFemaleVoice()
      if (femaleVoice) {
        utterance.voice = femaleVoice
      }
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
  }, [isSupported, getBestFemaleVoice])

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