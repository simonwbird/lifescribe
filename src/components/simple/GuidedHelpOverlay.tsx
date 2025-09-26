import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Hand, 
  Mic, 
  Video, 
  Camera, 
  X, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Play,
  Square
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface GuidedHelpOverlayProps {
  type: 'voice' | 'video' | 'photo' | 'general'
  isVisible: boolean
  onDismiss?: () => void
  target?: string // CSS selector for positioning
  className?: string
}

const helpContent = {
  voice: {
    icon: Mic,
    title: "🎤 Voice Recording Guide",
    steps: [
      {
        icon: Hand,
        text: "Tap the red microphone button to start recording",
        detail: "The button will turn bright red when recording"
      },
      {
        icon: Mic,
        text: "Speak clearly into your device's microphone",
        detail: "Get close to your phone/computer for best quality"
      },
      {
        icon: Square,
        text: "Tap the stop button when you're finished",
        detail: "You can record up to 2 minutes at a time"
      },
      {
        icon: Play,
        text: "Listen to your recording before sharing",
        detail: "You can re-record if you're not happy with it"
      }
    ],
    tip: "💡 Pro tip: Find a quiet spot for the clearest recording!"
  },
  video: {
    icon: Video,
    title: "🎬 Video Recording Guide", 
    steps: [
      {
        icon: Camera,
        text: "Tap the camera button to start recording video",
        detail: "Make sure you allow camera permissions"
      },
      {
        icon: Hand,
        text: "Hold your device steady for best results",
        detail: "Portrait or landscape mode both work great"
      },
      {
        icon: Square,
        text: "Tap stop when you're done recording",
        detail: "Videos can be up to 30 seconds long"
      },
      {
        icon: CheckCircle,
        text: "Preview your video before sharing",
        detail: "You can retake if needed"
      }
    ],
    tip: "💡 Pro tip: Good lighting makes your videos look amazing!"
  },
  photo: {
    icon: Camera,
    title: "📸 Photo Sharing Guide",
    steps: [
      {
        icon: Camera,
        text: "Tap the camera icon to take a new photo",
        detail: "Or drag & drop photos from your device"
      },
      {
        icon: Hand,
        text: "Select photos from your gallery if preferred",
        detail: "You can choose multiple photos at once"
      },
      {
        icon: Sparkles,
        text: "Add fun stickers and reactions",
        detail: "Express yourself with our emoji collection"
      },
      {
        icon: ArrowRight,
        text: "Share with your family instantly",
        detail: "They'll get notified right away!"
      }
    ],
    tip: "💡 Pro tip: Multiple photos tell better stories!"
  },
  general: {
    icon: Sparkles,
    title: "✨ Getting Started Guide",
    steps: [
      {
        icon: Hand,
        text: "Tap any colorful button to get started",
        detail: "All the fun features have bright, friendly colors"
      },
      {
        icon: Sparkles,
        text: "Look for animated hints and sparkles",
        detail: "They show you where the magic happens"
      },
      {
        icon: CheckCircle,
        text: "Green checkmarks mean success",
        detail: "You'll see confetti when things go well!"
      },
      {
        icon: ArrowRight,
        text: "Follow the guided prompts",
        detail: "We'll help you every step of the way"
      }
    ],
    tip: "💡 Pro tip: The app gets more fun the more you use it!"
  }
}

export default function GuidedHelpOverlay({
  type,
  isVisible,
  onDismiss,
  target,
  className
}: GuidedHelpOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [hasInteracted, setHasInteracted] = useState(false)
  const content = helpContent[type]
  const IconComponent = content.icon

  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0)
      setHasInteracted(false)
    }
  }, [isVisible])

  const nextStep = () => {
    if (currentStep < content.steps.length - 1) {
      setCurrentStep(prev => prev + 1)
      setHasInteracted(true)
    } else {
      onDismiss?.()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const currentStepData = content.steps[currentStep]
  const StepIcon = currentStepData.icon

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in",
        className
      )}
    >
        <Card className="w-full max-w-md bg-gradient-to-br from-white via-blue-50 to-purple-50 border-2 border-primary/20 shadow-2xl">
          <CardContent className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">{content.title}</h3>
              </div>
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  Step {currentStep + 1} of {content.steps.length}
                </span>
                <Badge variant="outline" className="bg-white/50">
                  {Math.round(((currentStep + 1) / content.steps.length) * 100)}%
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${((currentStep + 1) / content.steps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Current Step */}
            <div
              key={currentStep}
              className="p-4 bg-white/60 rounded-xl border border-gray-200 space-y-3 animate-fade-in"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg shrink-0">
                  <StepIcon className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-2 flex-1">
                  <p className="text-base font-semibold text-gray-800">
                    {currentStepData.text}
                  </p>
                  <p className="text-sm text-gray-600">
                    {currentStepData.detail}
                  </p>
                </div>
              </div>
            </div>

            {/* Tip */}
            <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <p className="text-sm font-medium text-yellow-800">
                {content.tip}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-2">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="hover-scale"
              >
                ← Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {content.steps.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      index <= currentStep 
                        ? "bg-gradient-to-r from-blue-500 to-purple-500" 
                        : "bg-gray-300"
                    )}
                  />
                ))}
              </div>

              <Button
                onClick={nextStep}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 hover-scale font-semibold"
              >
                {currentStep === content.steps.length - 1 ? "Got it! ✨" : "Next →"}
              </Button>
            </div>

            {/* Skip Option */}
            {!hasInteracted && (
              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="text-gray-500 hover:text-gray-700 text-xs"
                >
                  Skip tutorial
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
}