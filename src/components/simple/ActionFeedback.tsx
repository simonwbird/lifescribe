import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  Upload, 
  Send, 
  Copy, 
  Save, 
  Heart,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Loader
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConfetti } from '@/hooks/useConfetti'

interface ActionFeedbackProps {
  action: 'sending' | 'saving' | 'uploading' | 'copying' | 'reacting' | 'success' | 'loading'
  message: string
  isVisible: boolean
  onComplete?: () => void
  duration?: number
  withSound?: boolean
  variant?: 'default' | 'celebration' | 'subtle'
  className?: string
}

const actionConfig = {
  sending: {
    icon: Send,
    color: 'text-blue-500',
    bgColor: 'from-blue-50 to-blue-100',
    borderColor: 'border-blue-200',
    sound: 'whoosh'
  },
  saving: {
    icon: Save,
    color: 'text-green-500',
    bgColor: 'from-green-50 to-green-100',
    borderColor: 'border-green-200',
    sound: 'save'
  },
  uploading: {
    icon: Upload,
    color: 'text-purple-500',
    bgColor: 'from-purple-50 to-purple-100',
    borderColor: 'border-purple-200',
    sound: 'upload'
  },
  copying: {
    icon: Copy,
    color: 'text-orange-500',
    bgColor: 'from-orange-50 to-orange-100',
    borderColor: 'border-orange-200',
    sound: 'copy'
  },
  reacting: {
    icon: Heart,
    color: 'text-pink-500',
    bgColor: 'from-pink-50 to-pink-100',
    borderColor: 'border-pink-200',
    sound: 'react'
  },
  success: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'from-green-100 to-emerald-100',
    borderColor: 'border-green-300',
    sound: 'success'
  },
  loading: {
    icon: Loader,
    color: 'text-gray-500',
    bgColor: 'from-gray-50 to-gray-100',
    borderColor: 'border-gray-200',
    sound: null
  }
}

// Simple sound effects using Web Audio API
const playSound = (type: string) => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    const soundMap: Record<string, { frequency: number; duration: number; type: OscillatorType }[]> = {
      whoosh: [{ frequency: 800, duration: 0.1, type: 'sine' }, { frequency: 400, duration: 0.1, type: 'sine' }],
      save: [{ frequency: 600, duration: 0.15, type: 'triangle' }],
      upload: [{ frequency: 440, duration: 0.1, type: 'square' }, { frequency: 660, duration: 0.1, type: 'square' }],
      copy: [{ frequency: 800, duration: 0.05, type: 'sine' }, { frequency: 800, duration: 0.05, type: 'sine' }],
      react: [{ frequency: 880, duration: 0.1, type: 'sine' }, { frequency: 1108, duration: 0.1, type: 'sine' }],
      success: [
        { frequency: 523, duration: 0.1, type: 'sine' },
        { frequency: 659, duration: 0.1, type: 'sine' },
        { frequency: 784, duration: 0.15, type: 'sine' }
      ]
    }

    const sounds = soundMap[type] || []
    
    sounds.forEach((sound, index) => {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(sound.frequency, audioContext.currentTime)
        oscillator.type = sound.type
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + sound.duration)
      }, index * 100)
    })
  } catch (error) {
    console.warn('Could not play sound:', error)
  }
}

export default function ActionFeedback({
  action,
  message,
  isVisible,
  onComplete,
  duration = 3000,
  withSound = true,
  variant = 'default',
  className
}: ActionFeedbackProps) {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const { celebrateSuccess, triggerConfetti } = useConfetti()
  
  const config = actionConfig[action]
  const IconComponent = config.icon

  useEffect(() => {
    if (isVisible) {
      // Play sound if enabled
      if (withSound && soundEnabled && config.sound) {
        playSound(config.sound)
      }
      
      // Trigger confetti for success actions
      if (action === 'success' && variant === 'celebration') {
        celebrateSuccess()
      }
      
      // Auto-complete after duration
      if (onComplete && duration > 0) {
        const timer = setTimeout(() => {
          onComplete()
        }, duration)
        
        return () => clearTimeout(timer)
      }
    }
  }, [isVisible, action, withSound, soundEnabled, variant, onComplete, duration, celebrateSuccess])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-full mx-4 animate-scale-in",
        className
      )}
    >
        <Card className={cn(
          "p-4 shadow-xl border-2 bg-gradient-to-r backdrop-blur-sm",
          config.bgColor,
          config.borderColor,
          variant === 'celebration' && "shadow-2xl animate-pulse"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full bg-white/80 shadow-sm",
              variant === 'celebration' && "animate-bounce"
            )}>
              <IconComponent className={cn(
                "w-5 h-5",
                config.color,
                action === 'loading' && "animate-spin"
              )} />
            </div>
            
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">
                {message}
              </p>
              
              {action === 'success' && variant === 'celebration' && (
                <div className="flex items-center gap-1 mt-1">
                  <Sparkles className="w-3 h-3 text-yellow-500 animate-pulse" />
                  <span className="text-xs text-gray-600 font-medium">
                    Awesome job! ✨
                  </span>
                </div>
              )}
            </div>
            
            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1 hover:bg-white/50 rounded transition-colors"
              title={soundEnabled ? "Disable sounds" : "Enable sounds"}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-gray-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
          
          {/* Progress bar for timed actions */}
          {duration > 0 && action !== 'loading' && (
            <div className="mt-3 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full bg-gradient-to-r transition-all", config.color.replace('text-', 'from-').replace('-500', '-400'), "to-transparent")}
                style={{ 
                  width: "100%",
                  animation: duration > 0 ? `shrink ${duration}ms linear forwards` : undefined
                }}
              />
            </div>
          )}
        </Card>
      </div>
    )
}

// Hook for easy feedback management
export function useActionFeedback() {
  const [feedback, setFeedback] = useState<{
    action: ActionFeedbackProps['action']
    message: string
    variant?: ActionFeedbackProps['variant']
    duration?: number
  } | null>(null)

  const showFeedback = (
    action: ActionFeedbackProps['action'], 
    message: string, 
    options?: {
      variant?: ActionFeedbackProps['variant']
      duration?: number
    }
  ) => {
    setFeedback({
      action,
      message,
      variant: options?.variant || 'default',
      duration: options?.duration || 3000
    })
  }

  const hideFeedback = () => {
    setFeedback(null)
  }

  // Convenience methods
  const showSuccess = (message: string, celebration = false) => {
    showFeedback('success', message, { 
      variant: celebration ? 'celebration' : 'default',
      duration: celebration ? 4000 : 3000
    })
  }

  const showSaving = (message = "Saving changes...") => {
    showFeedback('saving', message, { duration: 0 }) // No auto-hide for in-progress actions
  }

  const showSending = (message = "Sending message...") => {
    showFeedback('sending', message, { duration: 0 })
  }

  const showUploading = (message = "Uploading files...") => {
    showFeedback('uploading', message, { duration: 0 })
  }

  const showCopied = (message = "Copied to clipboard! 📋") => {
    showFeedback('copying', message)
  }

  const showReaction = (message = "Reaction added! ❤️") => {
    showFeedback('reacting', message, { variant: 'celebration' })
  }

  const FeedbackComponent = feedback ? (
    <ActionFeedback
      action={feedback.action}
      message={feedback.message}
      isVisible={true}
      onComplete={hideFeedback}
      variant={feedback.variant}
      duration={feedback.duration}
    />
  ) : null

  return {
    showFeedback,
    showSuccess,
    showSaving,
    showSending,
    showUploading,
    showCopied,
    showReaction,
    hideFeedback,
    FeedbackComponent
  }
}