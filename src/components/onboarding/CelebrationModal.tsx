import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Users, Mic, Trophy, ArrowRight } from 'lucide-react'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
}

interface CelebrationModalProps {
  open: boolean
  onClose: () => void
  step: OnboardingStep | null
  onNext?: () => void
}

const celebrationMessages = {
  'first-memory': {
    title: '🎉 Your First Memory is Recorded!',
    message: 'Amazing! You\'ve just captured your first precious memory. This is the beginning of your family\'s digital legacy.',
    nextAction: 'Now invite someone special to hear this story',
    nextLabel: 'Invite a Loved One',
    badge: 'First Storyteller'
  },
  'invite-someone': {
    title: '💌 Invitation Sent!',
    message: 'Perfect! You\'ve invited someone to join your family space. They\'ll receive a warm invitation to be part of your story collection.',
    nextAction: 'Keep recording memories while you wait',
    nextLabel: 'Record Another',
    badge: 'Family Builder'
  },
  'first-listener': {
    title: '🏆 You Have Your First Listener!',
    message: 'Wonderful! Someone has joined your family space. Your stories now have an audience who will treasure them forever.',
    nextAction: 'Your Weekly Digest is now unlocked',
    nextLabel: 'Explore Features',
    badge: 'Connected Family'
  }
}

export default function CelebrationModal({ open, onClose, step, onNext }: CelebrationModalProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (open) {
      setShowConfetti(true)
      // Auto-hide confetti after animation
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [open])

  if (!step) return null

  const celebration = celebrationMessages[step.id as keyof typeof celebrationMessages]
  if (!celebration) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center relative">
            {step.icon}
            {showConfetti && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
              </div>
            )}
          </div>
          
          <div>
            <DialogTitle className="text-xl font-semibold mb-2">
              {celebration.title}
            </DialogTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {celebration.badge}
            </Badge>
          </div>
        </DialogHeader>
        
        <div className="text-center space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            {celebration.message}
          </p>
          
          <div className="bg-accent/50 rounded-lg p-4">
            <p className="text-sm font-medium text-brand-700 mb-2">
              Next Step:
            </p>
            <p className="text-sm text-muted-foreground">
              {celebration.nextAction}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Continue Later
            </Button>
            {onNext && (
              <Button 
                onClick={() => {
                  onNext()
                  onClose()
                }}
                className="flex-1 bg-brand-600 hover:bg-brand-700"
              >
                {celebration.nextLabel}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}