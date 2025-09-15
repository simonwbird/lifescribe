import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mic, FileText, Camera, Video, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useLabs } from '@/hooks/useLabs'
import VoiceCaptureModal from '@/components/voice/VoiceCaptureModal'

interface VoiceFirstHeroProps {
  mode: 'simple' | 'studio'
  className?: string
  onStoryCreated?: (storyId: string) => void
}

export default function VoiceFirstHero({ mode, className, onStoryCreated }: VoiceFirstHeroProps) {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false)
  const { track } = useAnalytics()
  const { labsEnabled, flags } = useLabs()

  const handleVoiceClick = () => {
    setIsVoiceModalOpen(true)
    track('voice_hero_start')
  }

  const handleStoryCreated = (storyId: string) => {
    setIsVoiceModalOpen(false)
    onStoryCreated?.(storyId)
  }

  if (mode === 'simple') {
    return (
      <>
        <Card className={cn("bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20", className)}>
          <CardContent className="p-8 text-center">
            <div className="max-w-md mx-auto space-y-6">
              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-foreground">
                  Record a memory
                </h1>
                <p className="text-lg text-muted-foreground">
                  Tap to capture your voice and preserve family stories
                </p>
              </div>
              
              <Button
                size="lg"
                onClick={handleVoiceClick}
                className="w-full h-16 text-lg gap-3 bg-primary hover:bg-primary/90"
                aria-label="Start recording a memory"
              >
                <Mic className="h-6 w-6" />
                Start Recording
              </Button>
              
              <p className="text-sm text-muted-foreground">
                90 seconds max • Auto-transcribed • Share with family
              </p>
            </div>
          </CardContent>
        </Card>

        <VoiceCaptureModal
          open={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          onStoryCreated={handleStoryCreated}
        />
      </>
    )
  }

  // Studio Mode
  const captureOptions = [
    {
      id: 'voice',
      icon: Mic,
      label: 'Voice',
      description: 'Record up to 90 seconds',
      color: 'bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-200',
      action: handleVoiceClick,
      disabled: false
    },
    {
      id: 'write',
      icon: FileText,
      label: 'Write',
      description: 'Text story',
      color: 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200',
      href: '/stories/new?type=write',
      disabled: !labsEnabled && !flags.advancedComposer
    },
    {
      id: 'photo',
      icon: Camera,
      label: 'Photo',
      description: 'Upload & caption',
      color: 'bg-green-100 hover:bg-green-200 text-green-700 border-green-200', 
      href: '/stories/new?type=photo',
      disabled: !labsEnabled && !flags.advancedComposer
    },
    {
      id: 'video',
      icon: Video,
      label: 'Video',
      description: 'Record or upload',
      color: 'bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-200',
      href: '/stories/new?type=video',
      disabled: false
    },
    {
      id: 'prompts',
      icon: Lightbulb,
      label: 'Prompts',
      description: 'Guided questions',
      color: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border-yellow-200',
      href: '/prompts',
      disabled: false
    }
  ]

  return (
    <>
      <Card className={cn("bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20", className)}>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Capture a memory
            </h1>
            <p className="text-muted-foreground">
              Choose how you'd like to share your story
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {captureOptions.map((option) => {
              const Icon = option.icon
              const isDisabled = option.disabled
              
              const buttonContent = (
                <div className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border transition-all",
                  option.color,
                  isDisabled && "opacity-50 cursor-not-allowed",
                  "min-h-[100px] justify-center"
                )}>
                  <Icon className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs opacity-75">{option.description}</div>
                  </div>
                </div>
              )

              if (option.action) {
                return (
                  <Button
                    key={option.id}
                    variant="ghost"
                    className="p-0 h-auto"
                    onClick={option.action}
                    disabled={isDisabled}
                  >
                    {buttonContent}
                  </Button>
                )
              }

              if (option.href && !isDisabled) {
                return (
                  <Link
                    key={option.id}
                    to={option.href}
                    className="block"
                  >
                    {buttonContent}
                  </Link>
                )
              }

              return (
                <div key={option.id} className="cursor-not-allowed">
                  {buttonContent}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <VoiceCaptureModal
        open={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onStoryCreated={handleStoryCreated}
      />
    </>
  )
}