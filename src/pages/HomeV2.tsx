import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { TopBar } from '@/components/home/TopBar'
import { HeroStrip } from '@/components/home/HeroStrip'
import { SmartFeed } from '@/components/home/SmartFeed'
import { VoiceCapture } from '@/components/home/VoiceCapture'
import RightRail from '@/components/home/RightRail'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Mic, Menu } from 'lucide-react'
import ElderModeView from '@/components/elder/ElderModeView'
import { useElderMode } from '@/hooks/useElderMode'
import { useAnalytics } from '@/hooks/useAnalytics'
import { SimpleInspirationBar } from '@/components/home/simple/SimpleInspirationBar'
import { CountdownModal } from '@/components/home/simple/CountdownModal'
import { PermissionDeniedCard } from '@/components/home/simple/PermissionDeniedCard'
import { OfflineQueueCard } from '@/components/home/simple/OfflineQueueCard'
import VoiceCaptureModal from '@/components/voice/VoiceCaptureModal'
import { ElderPrompt } from '@/lib/prompts/getElderPrompts'
import { checkMicrophonePermission, isOnline, getPromptTitle } from '@/lib/recorder/startFromPrompt'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export default function HomeV2() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [familyId, setFamilyId] = useState<string>('')
  const [showVoiceCapture, setShowVoiceCapture] = useState(false)
  const [toolsDrawerOpen, setToolsDrawerOpen] = useState(false)
  const { isElderMode, phoneCode, isLoading: elderModeLoading } = useElderMode(userId)
  const { track } = useAnalytics()
  
  // Prompt recording state
  const [currentPrompt, setCurrentPrompt] = useState<ElderPrompt | null>(null)
  const [showCountdown, setShowCountdown] = useState(false)
  const [showPermissionDenied, setShowPermissionDenied] = useState(false)
  const [showOfflineQueue, setShowOfflineQueue] = useState(false)
  const [showVoiceModal, setShowVoiceModal] = useState(false)

  // Handle ?panel=tools URL parameter
  useEffect(() => {
    const panel = searchParams.get('panel')
    if (panel === 'tools') {
      setToolsDrawerOpen(true)
    }
  }, [searchParams])

  // Update URL when drawer opens/closes
  const handleToolsDrawerChange = (open: boolean) => {
    setToolsDrawerOpen(open)
    if (open) {
      setSearchParams({ panel: 'tools' })
    } else {
      searchParams.delete('panel')
      setSearchParams(searchParams)
    }
  }

  // Prompt recording handlers
  const handlePromptSelected = async (prompt: ElderPrompt) => {
    setCurrentPrompt(prompt)

    // Check if online
    if (!isOnline()) {
      setShowOfflineQueue(true)
      track('recorder.offline_queue', {
        prompt_id: prompt.id,
        prompt_kind: prompt.kind
      })
      return
    }

    // Check microphone permission
    const permission = await checkMicrophonePermission()
    if (permission === 'denied') {
      setShowPermissionDenied(true)
      track('recorder.permission_denied', {
        prompt_id: prompt.id,
        prompt_kind: prompt.kind
      })
      return
    }

    // Start countdown if permission granted or will be prompted
    setShowCountdown(true)
  }

  const handleCountdownComplete = () => {
    if (!currentPrompt) return
    setShowCountdown(false)
    setShowVoiceModal(true)
  }

  const handlePermissionRetry = async () => {
    if (!currentPrompt) return
    const permission = await checkMicrophonePermission()
    if (permission !== 'denied') {
      setShowPermissionDenied(false)
      setShowCountdown(true)
    }
  }

  const handleTypeInstead = () => {
    if (!currentPrompt) return
    setShowPermissionDenied(false)

    // Navigate to text story creation
    const title = getPromptTitle(currentPrompt)
    const params = new URLSearchParams({
      type: 'text',
      promptTitle: title,
      prompt_id: currentPrompt.id,
      prompt_text: currentPrompt.text,
      ...(currentPrompt.context?.personId && {
        person_id: currentPrompt.context.personId
      })
    })
    navigate(`/stories/new?${params.toString()}`)
  }

  const handleOfflineProceed = () => {
    if (!currentPrompt) return
    setShowOfflineQueue(false)
    setShowCountdown(true)
  }

  const handleCancel = () => {
    setShowCountdown(false)
    setShowPermissionDenied(false)
    setShowOfflineQueue(false)
    setShowVoiceModal(false)
    setCurrentPrompt(null)
  }

  const handleStoryCreated = (storyId: string) => {
    track('voice_story_published', { storyId })
    setShowVoiceModal(false)
    setCurrentPrompt(null)
  }

  useEffect(() => {
    loadUserAndFamily()
  }, [])

  async function loadUserAndFamily() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }
      setUserId(user.id)

      // Get family from URL param or first membership
      const paramFamily = searchParams.get('family')
      if (paramFamily) {
        setFamilyId(paramFamily)
      } else {
        const { data: membership } = await supabase
          .from('members')
          .select('family_id')
          .eq('profile_id', user.id)
          .limit(1)
          .single()

        if (membership) {
          setFamilyId(membership.family_id)
        }
      }
    } catch (error) {
      console.error('Error loading home:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || elderModeLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-14 border-b bg-background/95">
          <div className="container flex h-14 items-center px-4 gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 flex-1 max-w-lg" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div className="container px-4 py-6">
          <div className="grid gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Show Elder Mode if enabled
  if (isElderMode && phoneCode) {
    return <ElderModeView userId={userId} familyId={familyId} phoneCode={phoneCode} />
  }

  if (!familyId || !userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No Family Found</h1>
          <p className="text-muted-foreground mb-4">
            You need to be part of a family to use this app.
          </p>
          <button
            onClick={() => navigate('/onboarding')}
            className="text-primary hover:underline"
          >
            Get Started
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header below global header */}
      <div className="sticky top-14 md:top-16 z-40 bg-background border-b">
        <TopBar familyId={familyId} userId={userId} />
      </div>
      
      <HeroStrip 
        familyId={familyId} 
        userId={userId} 
        isElderMode={isElderMode}
        onOpenVoiceCapture={() => setShowVoiceCapture(true)}
      />

      {/* Today's Prompt Section */}
      <div className="container max-w-[1400px] px-4 pt-6 mx-auto">
        <div className="max-w-[1100px] mx-auto">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Today's prompt
            </h2>
            <SimpleInspirationBar
              profileId={userId}
              spaceId={familyId}
              onRecordPrompt={handlePromptSelected}
            />
          </div>

          {/* Recording Controller Modals */}
          {currentPrompt && (
            <CountdownModal
              isOpen={showCountdown}
              prompt={currentPrompt}
              onComplete={handleCountdownComplete}
              onCancel={handleCancel}
            />
          )}

          {showPermissionDenied && currentPrompt && (
            <div className="mb-6">
              <PermissionDeniedCard
                prompt={currentPrompt}
                onTryAgain={handlePermissionRetry}
                onTypeInstead={handleTypeInstead}
                onDismiss={handleCancel}
              />
            </div>
          )}

          {showOfflineQueue && (
            <div className="mb-6">
              <OfflineQueueCard
                onProceed={handleOfflineProceed}
                onCancel={handleCancel}
              />
            </div>
          )}
        </div>
      </div>

      {/* Voice Recording Modal */}
      <VoiceCaptureModal
        open={showVoiceModal}
        onClose={() => {
          setShowVoiceModal(false)
          setCurrentPrompt(null)
        }}
        onStoryCreated={handleStoryCreated}
        prompt={currentPrompt || undefined}
        autoStart={true}
      />

      {/* Two-column layout: Feed + Right Rail */}
      <div className="container max-w-[1400px] px-4 py-6 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,680px)_320px] gap-6 max-w-[1100px] mx-auto">
          {/* Left: Main Feed */}
          <main role="main" aria-label="Story feed" className="space-y-4 min-w-0">
            {/* Voice Capture Toggle */}
            {!showVoiceCapture && (
              <Button 
                onClick={() => setShowVoiceCapture(true)}
                variant="outline"
                className="w-full gap-2 border-dashed"
                aria-label="Record voice note"
              >
                <Mic className="h-4 w-4" />
                Record Voice Note
              </Button>
            )}

            {/* Inline Voice Capture */}
            {showVoiceCapture && (
              <VoiceCapture
                familyId={familyId}
                userId={userId}
                onPublished={() => setShowVoiceCapture(false)}
                onCancel={() => setShowVoiceCapture(false)}
              />
            )}

            <SmartFeed familyId={familyId} userId={userId} />
          </main>

          {/* Right: Widgets Rail (Desktop only) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <RightRail />
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Tools Drawer */}
      <Sheet open={toolsDrawerOpen} onOpenChange={handleToolsDrawerChange}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-6 right-6 z-50 lg:hidden shadow-lg rounded-full w-14 h-14 p-0"
            aria-label="Open tools drawer"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="right" 
          className="w-full sm:w-[400px] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Tools & Widgets</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <RightRail />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
