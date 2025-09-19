import React, { useState, useEffect } from 'react'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import VoiceFirstHero from '@/components/home/VoiceFirstHero'
import InviteBanner from '@/components/home/InviteBanner'
import FamilyUpdatesFeed from '@/components/home/FamilyUpdatesFeed'
import WeeklyDigest from '@/components/home/WeeklyDigest'
import WeeklyDigestPreview from '@/components/WeeklyDigestPreview'
import Upcoming from '@/components/home/Upcoming'
import DraftsRow from '@/components/home/DraftsRow'
import OnboardingProgress from '@/components/onboarding/OnboardingProgress'
import FloatingCoachMark from '@/components/onboarding/FloatingCoachMark'
import { SimpleHeader } from '@/components/home/simple/SimpleHeader'
import SimpleRecordingController from '@/components/home/simple/SimpleRecordingController'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import RegionConfirmationBanner from '@/components/RegionConfirmationBanner'
import { supabase } from '@/lib/supabase'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useMode } from '@/hooks/useMode'
import { useNavigate } from 'react-router-dom'
import { ElderPrompt } from '@/lib/prompts/getElderPrompts'
import { 
  checkMicrophonePermission, 
  isOnline, 
  getPromptTitle 
} from '@/lib/recorder/startFromPrompt'
import { CountdownModal } from '@/components/home/simple/CountdownModal'
import { PermissionDeniedCard } from '@/components/home/simple/PermissionDeniedCard'
import { OfflineQueueCard } from '@/components/home/simple/OfflineQueueCard'
import VoiceCaptureModal from '@/components/voice/VoiceCaptureModal'
import { formatForUser, getCurrentUserRegion } from '@/utils/date'
import ImpersonationBoundary from '@/components/ImpersonationBoundary'

// Types
interface ActivityItem {
  id: string
  type: 'story' | 'comment' | 'invite' | 'photo'
  actor: string
  action: string
  target: string
  snippet?: string
  time: string
  unread: boolean
}

interface DraftItem {
  id: string
  type: 'story' | 'voice' | 'video' | 'photo' | 'property' | 'object'
  title: string
  progress: number
  lastEdited: string
}

export default function Home() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [drafts, setDrafts] = useState<DraftItem[]>([])
  const [loading, setLoading] = useState(true)
  const [profileId, setProfileId] = useState<string>('')
  const [spaceId, setSpaceId] = useState<string>('')
  const [isSimpleMode, setIsSimpleMode] = useState<boolean>(false)
  const [hasOtherMembers, setHasOtherMembers] = useState<boolean>(false)
  
  // Recording controller state for Simple Mode
  const [currentPrompt, setCurrentPrompt] = useState<ElderPrompt | null>(null)
  const [showCountdown, setShowCountdown] = useState(false)
  const [showPermissionDenied, setShowPermissionDenied] = useState(false)
  const [showOfflineQueue, setShowOfflineQueue] = useState(false)
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  
  // Track analytics
  const { track } = useAnalytics()
  const { mode, flags, loading: modeLoading } = useMode()
  const navigate = useNavigate()

  // Handle URL param for voice focus after invite flow
  const urlParams = new URLSearchParams(window.location.search)
  const focusVoice = urlParams.get('focus') === 'voice'

  useEffect(() => {
    loadHomeData()
    track('home_v2_load')
  }, [])

  // Set up real-time updates for new stories
  useEffect(() => {
    if (!spaceId) return

    const channel = supabase
      .channel('family-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stories',
          filter: `family_id=eq.${spaceId}`
        },
        (payload) => {
          console.log('New story published:', payload)
          // Refresh the activities when a new story is added
          loadActivities(spaceId)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [spaceId])

  const loadHomeData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setProfileId(user.id)

      // Get user's profile and family
      const [profileResult, memberResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('simple_mode')
          .eq('id', user.id)
          .single(),
        supabase
          .from('members')
          .select('family_id')
          .eq('profile_id', user.id)
          .single()
      ])

      if (profileResult.data) {
        setIsSimpleMode(profileResult.data.simple_mode || false)
      }

      if (!memberResult.data) return

      setSpaceId(memberResult.data.family_id)

      // Check if family has other members
      const { data: memberCount } = await supabase
        .from('members')
        .select('id')
        .eq('family_id', memberResult.data.family_id)
      
      setHasOtherMembers((memberCount?.length || 0) > 1)

      await Promise.all([
        loadActivities(memberResult.data.family_id),
        loadDrafts(user.id, memberResult.data.family_id)
      ])
    } catch (error) {
      console.error('Error loading home data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadActivities = async (familyId: string) => {
    try {
      const activities: ActivityItem[] = []

      // Get recent stories
      const { data: stories } = await supabase
        .from('stories')
        .select(`
          id,
          title,
          content,
          created_at,
          family_member_profiles:profile_id (full_name)
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(15)

      if (stories) {
        stories.forEach(story => {
          activities.push({
            id: `story-${story.id}`,
            type: 'story',
            actor: story.family_member_profiles?.full_name || 'Someone',
            action: 'shared a story',
            target: story.title,
            snippet: story.content?.substring(0, 150) + '...',
            time: getRelativeTime(story.created_at),
            unread: isRecent(story.created_at)
          })
        })
      }

      // Sort activities by creation time (most recent first)
      activities.sort((a, b) => parseTimeAgo(a.time) - parseTimeAgo(b.time))

      setActivities(activities)

      // Get recent comments
      const { data: comments } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          story_id,
          family_member_profiles:profile_id (full_name),
          stories:story_id (title)
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (comments) {
        comments.forEach(comment => {
          activities.push({
            id: `comment-${comment.id}`,
            type: 'comment',
            actor: comment.family_member_profiles?.full_name || 'Someone',
            action: 'commented on',
            target: comment.stories?.title || 'a story',
            snippet: comment.content?.substring(0, 100),
            time: getRelativeTime(comment.created_at),
            unread: isRecent(comment.created_at)
          })
        })
      }

      // Sort by time
      activities.sort((a, b) => {
        const timeA = new Date(a.time.includes('ago') ? Date.now() - parseTimeAgo(a.time) : a.time).getTime()
        const timeB = new Date(b.time.includes('ago') ? Date.now() - parseTimeAgo(b.time) : b.time).getTime()
        return timeB - timeA
      })

      // Add sample activities if we have few real ones
      if (activities.length < 10) {
        const sampleActivities: ActivityItem[] = [
          {
            id: 'sample-1',
            type: 'photo',
            actor: 'Emma',
            action: 'uploaded photos from',
            target: 'Family Reunion 2024',
            snippet: '12 new photos added to the album',
            time: '3 hours ago',
            unread: true
          },
          {
            id: 'sample-2',
            type: 'story',
            actor: 'Michael',
            action: 'shared memories about',
            target: 'Dad\'s Workshop',
            snippet: 'Remember how he taught us to build birdhouses every weekend...',
            time: '5 hours ago',
            unread: false
          },
          {
            id: 'sample-3',
            type: 'invite',
            actor: 'Sarah',
            action: 'invited',
            target: 'Cousin Jake to join',
            snippet: 'Welcome to our family space!',
            time: '1 day ago',
            unread: true
          },
          {
            id: 'sample-4',
            type: 'photo',
            actor: 'David',
            action: 'added photos to',
            target: 'Grandma\'s 85th Birthday',
            snippet: '8 new photos from the celebration',
            time: '2 days ago',
            unread: false
          },
          {
            id: 'sample-5',
            type: 'story',
            actor: 'Lisa',
            action: 'recorded a voice story about',
            target: 'Christmas Morning 1995',
            snippet: 'The year we got our first computer and dad spent hours...',
            time: '3 days ago',
            unread: false
          },
          {
            id: 'sample-6',
            type: 'comment',
            actor: 'Robert',
            action: 'commented on',
            target: 'Mom\'s Apple Pie Recipe',
            snippet: 'I remember she always added a pinch of cinnamon to the crust',
            time: '4 days ago',
            unread: false
          }
        ]
        activities.push(...sampleActivities.slice(0, 10 - activities.length))
      }

      setActivities(activities)
    } catch (error) {
      console.error('Error loading activities:', error)
      setActivities([])
    }
  }

  const loadDrafts = async (userId: string, familyId: string) => {
    try {
      const drafts: DraftItem[] = []

      // Get recent stories (as drafts)
      const { data: stories } = await supabase
        .from('stories')
        .select('id, title, updated_at')
        .eq('family_id', familyId)
        .eq('profile_id', userId)
        .order('updated_at', { ascending: false })
        .limit(3)

      if (stories) {
        stories.forEach(story => {
          drafts.push({
            id: story.id,
            type: 'story',
            title: story.title,
            progress: Math.floor(Math.random() * 40) + 60,
            lastEdited: getRelativeTime(story.updated_at)
          })
        })
      }

      setDrafts(drafts)
    } catch (error) {
      console.error('Error loading drafts:', error)
      setDrafts([])
    }
  }

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} days ago`
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`
    
    return formatForUser(dateString, 'relative', getCurrentUserRegion())
  }

  const isRecent = (dateString: string): boolean => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    return diffInHours <= 24
  }

  const parseTimeAgo = (timeStr: string): number => {
    if (timeStr.includes('hours ago')) {
      const hours = parseInt(timeStr)
      return hours * 60 * 60 * 1000
    }
    if (timeStr.includes('days ago')) {
      const days = parseInt(timeStr)
      return days * 24 * 60 * 60 * 1000
    }
    return 0
  }

  const handleStoryCreated = (storyId: string) => {
    // Optimistically update the feed
    loadHomeData()
    track('voice_story_published', { storyId })
  }

  const handleResumeDraft = (draftId: string) => {
    track('draft_resumed', { draftId })
    // Navigate to edit the draft
  }

  const handleDeleteDraft = (draftId: string) => {
    track('draft_deleted', { draftId })
    setDrafts(prev => prev.filter(d => d.id !== draftId))
  }

  // Simple Mode Recording Integration
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
    
    // Open voice recording modal and start recording immediately
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
    const searchParams = new URLSearchParams({
      type: 'text',
      promptTitle: title,
      prompt_id: currentPrompt.id,
      prompt_text: currentPrompt.text,
      ...(currentPrompt.context?.personId && { 
        person_id: currentPrompt.context.personId 
      })
    })
    
    navigate(`/stories/new?${searchParams.toString()}`)
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

  if (loading || modeLoading) {
    return (
      <ImpersonationBoundary>
        <AuthGate>
          <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-6 space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-20 w-full" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
                <div className="space-y-6">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            </main>
          </div>
        </AuthGate>
      </ImpersonationBoundary>
    )
  }

  if (mode === 'simple') {
    return (
      <AuthGate>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-6 space-y-6">
            {/* Simple Mode: Unified Header */}
            <SimpleHeader
              profileId={profileId || 'default'}
              spaceId={spaceId || 'default'}
              onRecordPrompt={handlePromptSelected}
            />

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

            {/* Invite Banner */}
            {!hasOtherMembers && (
              <InviteBanner />
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Family Updates Feed */}
              <div className="lg:col-span-2">
                <div className="space-y-4 min-h-[600px]">
                  <h4 className="text-2xl font-bold text-foreground">
                    Family Updates
                  </h4>
                  <FamilyUpdatesFeed 
                    activities={activities}
                    variant="simple"
                  />
                </div>
              </div>

              {/* Right Rail */}
              <div className="space-y-6">
                <WeeklyDigest />
                <Upcoming />
              </div>
            </div>
          </main>
        </div>
      </AuthGate>
    )
  }

  // Studio Mode
  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Recording Controller */}
          {isSimpleMode && (
            <SimpleRecordingController
              profileId={profileId || 'default'}
              spaceId={spaceId || 'default'}
            />
          )}

          {/* Voice Hero + Segmented Controls */}
          <VoiceFirstHero 
            mode="studio"
            onStoryCreated={handleStoryCreated}
          />

          {/* Invite Banner */}
          <InviteBanner />

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Primary Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Pinned Drafts Row */}
              {drafts.length > 0 && (
                <DraftsRow 
                  drafts={drafts}
                  onResume={handleResumeDraft}
                  onDelete={handleDeleteDraft}
                />
              )}

              {/* Dense Feed */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">
                  What's New
                </h2>
                <FamilyUpdatesFeed 
                  activities={activities}
                  variant="studio"
                />
              </div>
            </div>

            {/* Right Rail */}
            <div className="space-y-6">
              <WeeklyDigestPreview familyId={spaceId} />
              <Upcoming />
            </div>
          </div>
        </main>
        
        {/* Onboarding Components */}
        <OnboardingProgress 
          profileId={profileId} 
          familyId={spaceId} 
        />
        <FloatingCoachMark 
          profileId={profileId} 
          familyId={spaceId} 
        />
      </div>
    </AuthGate>
  )
}