import { ElderPrompt } from '@/lib/prompts/getElderPrompts'

export interface PromptRecordingConfig {
  prompt: ElderPrompt
  onCountdownComplete: () => void
  onPermissionDenied: () => void
  onOffline: () => void
}

export function getPromptTitle(prompt: ElderPrompt): string {
  // Generate short title from prompt text
  let title = prompt.text.replace(/[.?!]$/, '') // Remove ending punctuation
  
  // Handle common patterns for better titles
  if (title.toLowerCase().startsWith('tell us about ')) {
    title = title.substring('tell us about '.length)
  } else if (title.toLowerCase().startsWith('describe ')) {
    title = title.substring('describe '.length)
  } else if (title.toLowerCase().startsWith('record a ')) {
    title = title.substring('record a '.length)
  }
  
  // Capitalize first letter and limit length
  title = title.charAt(0).toUpperCase() + title.slice(1)
  
  if (title.length > 50) {
    title = title.substring(0, 47) + '...'
  }
  
  return title
}

export async function checkMicrophonePermission(): Promise<'granted' | 'denied' | 'prompt'> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return 'denied'
    }

    // Check if we already have permission
    if (navigator.permissions) {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      return permission.state as 'granted' | 'denied' | 'prompt'
    }

    // Fallback: try to get access (this will prompt if needed)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop()) // Clean up
      return 'granted'
    } catch (error) {
      return 'denied'
    }
  } catch (error) {
    console.error('Permission check failed:', error)
    return 'denied'
  }
}

export function isOnline(): boolean {
  return navigator.onLine
}

export class CountdownTimer {
  private countdownInterval: NodeJS.Timeout | null = null
  private onTick: (count: number) => void
  private onComplete: () => void

  constructor(onTick: (count: number) => void, onComplete: () => void) {
    this.onTick = onTick
    this.onComplete = onComplete
  }

  start(seconds: number = 3): void {
    let count = seconds
    this.onTick(count)

    this.countdownInterval = setInterval(() => {
      count--
      if (count > 0) {
        this.onTick(count)
        // Play beep sound (subtle)
        this.playBeep()
      } else {
        this.stop()
        this.onComplete()
      }
    }, 1000)
  }

  stop(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval)
      this.countdownInterval = null
    }
  }

  private playBeep(): void {
    try {
      // Create a subtle beep using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime) // 800Hz tone
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime) // Low volume
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      // Fallback: no beep if Web Audio API fails
      console.warn('Beep failed:', error)
    }
  }
}