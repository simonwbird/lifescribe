import React, { useState, useEffect } from 'react'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import VoiceFirstHero from '@/components/home/VoiceFirstHero'
import InviteBanner from '@/components/home/InviteBanner'
import FamilyUpdatesFeed from '@/components/home/FamilyUpdatesFeed'
import WeeklyDigest from '@/components/home/WeeklyDigest'
import Upcoming from '@/components/home/Upcoming'
import DraftsRow from '@/components/home/DraftsRow'
import { SimpleInspirationBar } from '@/components/home/simple/SimpleInspirationBar'
import SimpleRecordingController from '@/components/home/simple/SimpleRecordingController'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useMode } from '@/hooks/useMode'
import { ElderPrompt } from '@/lib/prompts/getElderPrompts'

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
  
  // Track analytics
  const { track } = useAnalytics()
  const { mode, flags, loading: modeLoading } = useMode()

  // Handle URL param for voice focus after invite flow
  const urlParams = new URLSearchParams(window.location.search)
  const focusVoice = urlParams.get('focus') === 'voice'

  useEffect(() => {
    loadHomeData()
    track('home_v2_load')
  }, [])

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
          profiles:profile_id (full_name)
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(8)

      if (stories) {
        stories.forEach(story => {
          activities.push({
            id: `story-${story.id}`,
            type: 'story',
            actor: story.profiles?.full_name || 'Someone',
            action: 'shared a story',
            target: story.title,
            snippet: story.content?.substring(0, 150) + '...',
            time: getRelativeTime(story.created_at),
            unread: isRecent(story.created_at)
          })
        })
      }

      // Get recent comments
      const { data: comments } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          story_id,
          profiles:profile_id (full_name),
          stories:story_id (title)
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (comments) {
        comments.forEach(comment => {
          activities.push({
            id: `comment-${comment.id}`,
            type: 'comment',
            actor: comment.profiles?.full_name || 'Someone',
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
    
    return date.toLocaleDateString()
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
  const handlePromptSelected = (prompt: ElderPrompt) => {
    // This will be handled by the SimpleRecordingController
    console.log('Prompt selected:', prompt)
  }

  if (loading || modeLoading) {
    return (
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
    )
  }

  if (mode === 'simple') {
    return (
      <AuthGate>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-6 space-y-6">
            {/* Simple Mode: Inspiration Bar */}
            {isSimpleMode && profileId && spaceId && (
              <SimpleInspirationBar
                profileId={profileId}
                spaceId={spaceId}
                onRecordPrompt={handlePromptSelected}
              />
            )}

            {/* Recording Controller */}
            {isSimpleMode && profileId && spaceId && (
              <SimpleRecordingController
                profileId={profileId}
                spaceId={spaceId}
              />
            )}

            {/* Voice-first Hero */}
            <VoiceFirstHero 
              mode={isSimpleMode ? 'simple' : mode}
              onStoryCreated={handleStoryCreated}
            />

            {/* Invite Banner */}
            <InviteBanner />

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Family Updates Feed */}
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-foreground">
                    Family Updates
                  </h2>
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
              <WeeklyDigest />
              <Upcoming />
            </div>
          </div>
        </main>
      </div>
    </AuthGate>
  )
}