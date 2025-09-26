import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { StoriesPageLayout } from '@/components/design-system'
import { ImmersivePromptCard } from '@/components/prompts/ImmersivePromptCard'
import { StarterSet } from '@/components/prompts/StarterSet'
import { CelebrationAnimation } from '@/components/prompts/CelebrationAnimation'
import { usePromptSequencing } from '@/hooks/usePromptSequencing'
import { useAnalytics } from '@/hooks/useAnalytics'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, Target } from 'lucide-react'

export default function PromptsWow() {
  const navigate = useNavigate()
  const { track } = useAnalytics()
  const {
    currentPrompt,
    streak,
    progress,
    personalizationLevel,
    loading,
    shufflePrompt,
    markPromptCompleted
  } = usePromptSequencing()

  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationType, setCelebrationType] = useState<'story_saved' | 'streak_milestone' | 'first_story' | 'week_complete'>('story_saved')
  const [showStarterSet, setShowStarterSet] = useState(false)

  useEffect(() => {
    // Show starter set if no current prompt (new user)
    if (!loading && !currentPrompt) {
      setShowStarterSet(true)
    }
  }, [loading, currentPrompt])

  useEffect(() => {
    // Track page load for analytics
    track('home_activity_open', {
      hasCurrentPrompt: !!currentPrompt,
      streak,
      personalizationLevel,
      showingStarterSet: showStarterSet
    })
  }, [currentPrompt, streak, personalizationLevel, showStarterSet, track])

  const handleModeSelect = (mode: 'write' | 'voice' | 'photo' | 'quick') => {
    if (!currentPrompt) return

    track('create_item_selected', {
      mode,
      promptId: currentPrompt.id,
      theme: currentPrompt.theme,
      streak,
      timeToSelect: Date.now() // You could track actual time from page load
    })

    // Navigate to story creation with prompt context
    const searchParams = new URLSearchParams({
      prompt: currentPrompt.id,
      mode,
      theme: currentPrompt.theme
    })

    navigate(`/stories/new?${searchParams.toString()}`)
  }

  const handleShuffle = () => {
    shufflePrompt()
  }

  const handleStarterPromptSelect = (promptId: string) => {
    track('create_item_selected', { promptId })
    
    // Navigate to story creation with starter prompt
    const searchParams = new URLSearchParams({
      prompt: promptId,
      mode: 'write',
      isStarter: 'true'
    })

    navigate(`/stories/new?${searchParams.toString()}`)
  }

  const handleGetStarted = () => {
    setShowStarterSet(false)
    track('create_item_selected')
  }

  const handleCelebrationComplete = () => {
    setShowCelebration(false)
  }

  // Simulate celebration trigger (in real app, this would be triggered after story save)
  const triggerCelebration = (type: typeof celebrationType) => {
    setCelebrationType(type)
    setShowCelebration(true)
  }

  if (loading) {
    return (
      <StoriesPageLayout>
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </StoriesPageLayout>
    )
  }

  return (
    <StoriesPageLayout>
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header with back button for debugging/testing */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/home')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>

          {/* Quick stats for testing */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              Level {personalizationLevel}
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {streak} day streak
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        {showStarterSet ? (
          <StarterSet
            onPromptSelect={handleStarterPromptSelect}
            onGetStarted={handleGetStarted}
          />
        ) : currentPrompt ? (
          <ImmersivePromptCard
            prompt={currentPrompt}
            streak={streak}
            progress={progress}
            onShuffle={handleShuffle}
            onModeSelect={handleModeSelect}
            className="max-w-2xl mx-auto"
          />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">No prompts available</h2>
            <p className="text-muted-foreground mb-6">
              There seems to be an issue loading your prompts.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        )}

        {/* Testing buttons for celebrations */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-12 p-4 bg-muted/30 rounded-lg">
            <h3 className="text-sm font-medium mb-3">Testing Controls</h3>
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => triggerCelebration('story_saved')}
              >
                Test Story Saved
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => triggerCelebration('streak_milestone')}
              >
                Test Streak Milestone
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => triggerCelebration('first_story')}
              >
                Test First Story
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => triggerCelebration('week_complete')}
              >
                Test Week Complete
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowStarterSet(!showStarterSet)}
              >
                Toggle Starter Set
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Celebration animation */}
      <CelebrationAnimation
        show={showCelebration}
        type={celebrationType}
        streak={streak}
        onComplete={handleCelebrationComplete}
      />
    </StoriesPageLayout>
  )
}