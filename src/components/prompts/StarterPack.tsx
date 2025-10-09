import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { useAnalytics } from '@/hooks/useAnalytics'
import type { PromptInstance } from '@/hooks/usePrompts'

interface StarterPackProps {
  prompts: PromptInstance[]
  completedPrompts: Set<string>
  onComplete: (promptId: string) => void
}

export function StarterPack({ prompts, completedPrompts, onComplete }: StarterPackProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const navigate = useNavigate()
  const { track } = useAnalytics()

  const progress = completedPrompts.size
  const total = prompts.length
  const isComplete = progress === total

  useEffect(() => {
    // Track starter pack begin when first shown
    if (!hasStarted && prompts.length > 0) {
      track('starter_pack_begin', {
        prompt_count: prompts.length
      })
      setHasStarted(true)
    }
  }, [prompts, hasStarted, track])

  useEffect(() => {
    // Track starter pack complete when all done
    if (isComplete && total > 0 && hasStarted) {
      track('starter_pack_complete', {
        prompts_completed: total,
        time_to_complete: Date.now() // Could calculate actual time if needed
      })
    }
  }, [isComplete, total, hasStarted, track])

  if (prompts.length === 0) return null

  const currentPrompt = prompts[currentIndex]
  const isCurrentComplete = completedPrompts.has(currentPrompt?.id)

  const handleNext = () => {
    if (currentIndex < prompts.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleRespond = () => {
    track('starter_pack_prompt_clicked', {
      prompt_id: currentPrompt.id,
      prompt_index: currentIndex,
      prompt_title: currentPrompt.prompt?.title
    })

    const searchParams = new URLSearchParams({
      type: 'text',
      promptTitle: currentPrompt.prompt?.title || '',
      prompt_id: currentPrompt.id,
      prompt_text: currentPrompt.prompt?.body || '',
      is_starter: 'true'
    })

    navigate(`/stories/new?${searchParams.toString()}`)
  }

  if (isComplete) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardContent className="p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-semibold mb-2">Starter Pack Complete! 🎉</h3>
            <p className="text-muted-foreground">
              You've shared your first memories. Keep exploring more prompts below.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Starter Pack</h3>
          </div>
          <Badge variant="secondary" className="font-mono">
            {progress}/{total}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex gap-1">
            {prompts.map((prompt, index) => (
              <button
                key={prompt.id}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "flex-1 h-2 rounded-full transition-all",
                  index === currentIndex && "ring-2 ring-primary ring-offset-2",
                  completedPrompts.has(prompt.id)
                    ? "bg-primary"
                    : index === currentIndex
                    ? "bg-primary/50"
                    : "bg-muted"
                )}
                aria-label={`Prompt ${index + 1}`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Complete these 3 prompts to get started
          </p>
        </div>

        {/* Current Prompt */}
        {currentPrompt && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Badge variant="outline" className="capitalize">
                {currentPrompt.prompt?.category || 'Firsts'}
              </Badge>
              <h4 className="text-xl font-medium leading-relaxed">
                {currentPrompt.prompt?.title}
              </h4>
              <p className="text-sm text-muted-foreground">
                {currentPrompt.prompt?.body}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentIndex === prompts.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Button
                onClick={handleRespond}
                disabled={isCurrentComplete}
                className="gap-2"
              >
                {isCurrentComplete ? (
                  <>
                    <Check className="h-4 w-4" />
                    Completed
                  </>
                ) : (
                  'Start This Prompt'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
