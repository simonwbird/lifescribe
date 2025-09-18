import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle, Trophy, Users, Mic, Pin, X, ChevronUp, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import CelebrationModal from './CelebrationModal'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
  action?: () => void
  actionLabel?: string
}

interface OnboardingProgressProps {
  profileId: string
  familyId: string
  className?: string
}

export default function OnboardingProgress({ profileId, familyId, className }: OnboardingProgressProps) {
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationStep, setCelebrationStep] = useState<OnboardingStep | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    checkProgress()
    
    // Check if user has dismissed the checklist
    const dismissed = localStorage.getItem(`onboarding-dismissed-${profileId}`)
    if (dismissed) {
      setIsDismissed(true)
    }
  }, [profileId, familyId])

  const checkProgress = async () => {
    try {
      // Check if user has recorded their first memory
      const { data: stories } = await supabase
        .from('stories')
        .select('id')
        .eq('profile_id', profileId)
        .eq('family_id', familyId)
        .limit(1)
      
      const hasFirstMemory = (stories?.length || 0) > 0

      // Check if user has invited someone
      const { data: invites } = await supabase
        .from('invites')
        .select('id')
        .eq('invited_by', profileId)
        .eq('family_id', familyId)
        .limit(1)
      
      const hasInvitedSomeone = (invites?.length || 0) > 0

      // Check if family has other accepted members
      const { data: members } = await supabase
        .from('members')
        .select('id')
        .eq('family_id', familyId)
        .neq('profile_id', profileId)
      
      const hasAcceptedInvites = (members?.length || 0) > 0

      // Check if user has pinned anything (mock for now)
      const hasPinnedHighlight = false // This would check pinned_story_ids

      const newSteps: OnboardingStep[] = [
        {
          id: 'first-memory',
          title: 'Record your first memory',
          description: 'Share a story that matters to you',
          icon: <Mic className="h-4 w-4" />,
          completed: hasFirstMemory,
          action: () => window.location.href = '/stories/new?type=voice',
          actionLabel: 'Start Recording'
        },
        {
          id: 'invite-someone',
          title: 'Invite a loved one',
          description: 'Share your memories with family',
          icon: <Users className="h-4 w-4" />,
          completed: hasInvitedSomeone,
          action: () => {
            // Open invite modal or navigate to people page
            window.location.href = '/people'
          },
          actionLabel: 'Invite Family'
        },
        {
          id: 'first-listener',
          title: 'Get your first listener',
          description: 'Someone joins to hear your stories',
          icon: <Trophy className="h-4 w-4" />,
          completed: hasAcceptedInvites
        }
      ]

      setSteps(newSteps)
      
      // Check for newly completed steps to trigger celebration
      const prevCompleted = steps.filter(s => s.completed).length
      const nowCompleted = newSteps.filter(s => s.completed).length
      
      if (nowCompleted > prevCompleted && nowCompleted > 0) {
        const newlyCompleted = newSteps.find((step, index) => 
          step.completed && (steps[index] && !steps[index].completed)
        )
        
        if (newlyCompleted) {
          setCelebrationStep(newlyCompleted)
          setShowCelebration(true)
        }
      }
    } catch (error) {
      console.error('Error checking onboarding progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const completedCount = steps.filter(s => s.completed).length
  const totalSteps = steps.length
  const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem(`onboarding-dismissed-${profileId}`, 'true')
  }

  // Don't show if all completed or dismissed
  if (loading || isDismissed || completedCount === totalSteps) {
    return null
  }

  return (
    <>
      <Card className={`fixed bottom-4 right-4 w-80 z-50 shadow-lg border-brand-200 ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-brand-600" />
              Getting Started
              <Badge variant="secondary" className="text-xs">
                {completedCount}/{totalSteps}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0 space-y-3">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex-shrink-0">
                  {step.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${step.completed ? 'text-green-700 line-through' : 'text-foreground'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                
                {!step.completed && step.action && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={step.action}
                    className="text-xs border-brand-200 hover:bg-brand-50"
                  >
                    {step.actionLabel}
                  </Button>
                )}
              </div>
            ))}
            
            {completedCount > 0 && completedCount < totalSteps && (
              <div className="text-center pt-2 border-t">
                <p className="text-xs text-brand-600 font-medium">
                  🎉 Great progress! Keep going to unlock your Weekly Digest.
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <CelebrationModal
        open={showCelebration}
        onClose={() => setShowCelebration(false)}
        step={celebrationStep}
        onNext={() => {
          if (celebrationStep?.id === 'first-memory') {
            // Suggest inviting someone next
            window.location.href = '/people'
          }
        }}
      />
    </>
  )
}