import { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { CountdownTimer } from '@/lib/recorder/startFromPrompt'
import { ElderPrompt, truncatePrompt } from '@/lib/prompts/getElderPrompts'

interface CountdownModalProps {
  isOpen: boolean
  prompt: ElderPrompt
  onComplete: () => void
  onCancel: () => void
}

export function CountdownModal({ 
  isOpen, 
  prompt, 
  onComplete, 
  onCancel 
}: CountdownModalProps) {
  const [count, setCount] = useState(3)
  const [timer, setTimer] = useState<CountdownTimer | null>(null)

  useEffect(() => {
    if (isOpen) {
      setCount(3)
      const countdownTimer = new CountdownTimer(
        (currentCount) => setCount(currentCount),
        () => {
          setTimer(null)
          onComplete()
        }
      )
      setTimer(countdownTimer)
      countdownTimer.start(3)

      return () => {
        countdownTimer.stop()
        setTimer(null)
      }
    }
  }, [isOpen, onComplete])

  const handleCancel = () => {
    if (timer) {
      timer.stop()
      setTimer(null)
    }
    onCancel()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-md mx-auto">
        <div className="relative p-6 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="absolute top-0 right-0 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="space-y-6">
            {/* Prompt Preview */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Starting in...</p>
              <p className="text-lg font-medium text-foreground">
                {truncatePrompt(prompt.text, 60)}
              </p>
            </div>

            {/* Countdown Circle */}
            <div className="relative w-32 h-32 mx-auto">
              <svg 
                className="w-full h-full transform -rotate-90" 
                viewBox="0 0 100 100"
              >
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="hsl(var(--muted))"
                  strokeWidth="4"
                  fill="transparent"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="hsl(var(--primary))"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - (4 - count) / 3)}`}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              
              {/* Countdown Number */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold text-primary">
                  {count}
                </span>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Get ready to speak naturally
              </p>
              <p className="text-xs text-muted-foreground">
                You'll have 90 seconds to share your thoughts
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}