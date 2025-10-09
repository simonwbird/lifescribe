// Shared utility for Text-to-Speech using Web Speech API

let currentUtterance: SpeechSynthesisUtterance | null = null

export interface SpeechOptions {
  rate?: number // 0.1 to 10, default 1
  pitch?: number // 0 to 2, default 1
  volume?: number // 0 to 1, default 1
  voice?: SpeechSynthesisVoice
  lang?: string
  onEnd?: () => void
  onError?: (error: Error) => void
}

/**
 * Speak text using Web Speech API
 * @param text - The text to speak
 * @param options - Optional speech configuration
 * @returns Promise that resolves when speech ends or is interrupted
 */
export const speak = (text: string, options: SpeechOptions = {}): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Stop any ongoing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
    }

    if (!text || text.trim().length === 0) {
      resolve()
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    currentUtterance = utterance

    // Set options
    utterance.rate = options.rate ?? 0.9 // Slightly slower for clarity
    utterance.pitch = options.pitch ?? 1
    utterance.volume = options.volume ?? 1
    utterance.lang = options.lang ?? 'en-US'

    if (options.voice) {
      utterance.voice = options.voice
    }

    // Event handlers
    utterance.onend = () => {
      currentUtterance = null
      options.onEnd?.()
      resolve()
    }

    utterance.onerror = (event) => {
      currentUtterance = null
      const error = new Error(`Speech synthesis error: ${event.error}`)
      options.onError?.(error)
      reject(error)
    }

    // Start speaking
    window.speechSynthesis.speak(utterance)
  })
}

/**
 * Stop any ongoing speech
 */
export const stopSpeaking = (): void => {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel()
    currentUtterance = null
  }
}

/**
 * Check if speech is currently active
 */
export const isSpeaking = (): boolean => {
  return window.speechSynthesis.speaking
}

/**
 * Pause speech (can be resumed)
 */
export const pauseSpeaking = (): void => {
  if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause()
  }
}

/**
 * Resume paused speech
 */
export const resumeSpeaking = (): void => {
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume()
  }
}

/**
 * Get available voices
 * Note: May return empty array initially, voices load asynchronously
 */
export const getVoices = (): SpeechSynthesisVoice[] => {
  return window.speechSynthesis.getVoices()
}

/**
 * Wait for voices to load and return them
 */
export const waitForVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      resolve(voices)
      return
    }

    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices())
    }
  })
}

/**
 * Get preferred voice for the given language
 */
export const getPreferredVoice = (lang: string = 'en-US'): SpeechSynthesisVoice | undefined => {
  const voices = getVoices()
  
  // Try to find a voice that matches the language
  const matchingVoice = voices.find(voice => voice.lang === lang)
  if (matchingVoice) return matchingVoice

  // Fallback to any English voice
  const englishVoice = voices.find(voice => voice.lang.startsWith('en'))
  if (englishVoice) return englishVoice

  // Return default voice
  return voices[0]
}
