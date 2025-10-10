// Add lazy loading for heavy components
import { lazy } from 'react'

const FamilyUpdatesFeed = lazy(() => import('@/components/home/FamilyUpdatesFeed'))
const OnboardingProgress = lazy(() => import('@/components/onboarding/OnboardingProgress'))
const WeeklyDigest = lazy(() => import('@/components/home/WeeklyDigest'))

import React, { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import AuthGate from '@/components/auth/AuthGate';
import Header from '@/components/Header';
import VoiceFirstHero from '@/components/home/VoiceFirstHero';
import InviteBanner from '@/components/home/InviteBanner';
// Lazy loaded components
import WeeklyDigestPreview from '@/components/WeeklyDigestPreview';
import Upcoming from '@/components/home/Upcoming';
import DraftsRow from '@/components/home/DraftsRow';
import FloatingCoachMark from '@/components/onboarding/FloatingCoachMark';
import QuickStoryCreator from '@/components/stories/QuickStoryCreator';
import { SimpleHeader } from '@/components/home/simple/SimpleHeader';
import { SimpleAdminPanel } from '@/components/home/simple/SimpleAdminPanel';
import SimpleRecordingController from '@/components/home/simple/SimpleRecordingController';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import RegionConfirmationBanner from '@/components/RegionConfirmationBanner';
import { supabase } from '@/integrations/supabase/client';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useMode } from '@/hooks/useMode';
import { useLabs } from '@/hooks/useLabs';
import { useNavigate } from 'react-router-dom';
import BirthdayRail from '@/components/prompts/BirthdayRail';
import { ContinueWhereYouLeftOff } from '@/components/prompts/ContinueWhereYouLeftOff';
import { ProgressHeader } from '@/components/prompts/ProgressHeader';
import { ElderPrompt } from '@/lib/prompts/getElderPrompts';
import { checkMicrophonePermission, isOnline, getPromptTitle } from '@/lib/recorder/startFromPrompt';
import { CountdownModal } from '@/components/home/simple/CountdownModal';
import { PermissionDeniedCard } from '@/components/home/simple/PermissionDeniedCard';
import { OfflineQueueCard } from '@/components/home/simple/OfflineQueueCard';
import VoiceCaptureModal from '@/components/voice/VoiceCaptureModal';
import { formatForUser, getCurrentUserRegion } from '@/utils/date';
import ImpersonationBoundary from '@/components/ImpersonationBoundary';
import { DiscoveryModeBanner } from '@/components/discovery/DiscoveryModeBanner';
import { DiscoveryModeToggle } from '@/components/discovery/DiscoveryModeToggle';
import { useIsUnder13 } from '@/hooks/useUserAge';
import { useDiscoveryMode } from '@/hooks/useDiscoveryMode';

// Types
interface ActivityItem {
  id: string;
  type: 'story' | 'comment' | 'invite' | 'photo';
  actor: string;
  action: string;
  target: string;
  snippet?: string;
  time: string;
  unread: boolean;
}
interface DraftItem {
  id: string;
  type: 'story' | 'voice' | 'video' | 'photo' | 'property' | 'object';
  title: string;
  progress: number;
  lastEdited: string;
}
export default function Home() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [familyMembers, setFamilyMembers] = useState<Array<{
    id: string;
    name: string;
  }>>([]);
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string>('');
  const [spaceId, setSpaceId] = useState<string>('');
  const [isSimpleMode, setIsSimpleMode] = useState<boolean>(false);
  const [hasOtherMembers, setHasOtherMembers] = useState<boolean>(false);

  // Recording controller state for Simple Mode
  const [currentPrompt, setCurrentPrompt] = useState<ElderPrompt | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showPermissionDenied, setShowPermissionDenied] = useState(false);
  const [showOfflineQueue, setShowOfflineQueue] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // Track analytics
  const {
    track
  } = useAnalytics();
  const {
    mode,
    flags,
    loading: modeLoading
  } = useMode();
  const navigate = useNavigate();
  const isUnder13 = useIsUnder13();
  const { isDiscoveryMode } = useDiscoveryMode();
  
  // Memoize expensive calculations
  const memoizedFamilyMembers = useMemo(() => familyMembers, [familyMembers])
  const memoizedActivities = useMemo(() => activities, [activities])
  const memoizedDrafts = useMemo(() => drafts, [drafts])

  // Handle URL param for voice focus after invite flow
  const [focusVoice, setFocusVoice] = useState(false);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setFocusVoice(urlParams.get('focus') === 'voice');
    loadHomeData();
    track('home_v2_load');
  }, []);

  // Set up real-time updates for new stories (debounced)
  useEffect(() => {
    if (!spaceId) return;
    
    let debounceTimer: NodeJS.Timeout;
    const channel = supabase.channel('family-updates').on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'stories',
      filter: `family_id=eq.${spaceId}`
    }, payload => {
      console.log('New story published:', payload);
      // Debounce to prevent rapid re-renders
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadActivities(spaceId);
      }, 1000);
    }).subscribe();
    
    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [spaceId]);
  // Debounced loading function
  const loadHomeData = useCallback(async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      setProfileId(user.id);

      // Get user's profile and family
      const [profileResult, memberResult] = await Promise.all([
        supabase.from('profiles').select('simple_mode').eq('id', user.id).single(),
        supabase.from('members').select('family_id').eq('profile_id', user.id).limit(1)
      ])
      if (profileResult.data) {
        setIsSimpleMode(profileResult.data.simple_mode ?? true)
      }
      const firstMembership = Array.isArray(memberResult.data) ? memberResult.data[0] : null
      if (!firstMembership) return
      setSpaceId(firstMembership.family_id)

      // Check if family has other members
      const {
        data: memberCount
      } = await supabase.from('members').select('id').eq('family_id', firstMembership.family_id)
      setHasOtherMembers((memberCount?.length || 0) > 1)
      await Promise.all([
        loadActivities(firstMembership.family_id),
        loadDrafts(user.id, firstMembership.family_id)
      ])
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  }, []) // Empty dependency array - only load once
  const loadActivities = async (familyId: string) => {
    try {
      const activities: ActivityItem[] = [];

      // Get recent stories
      const {
        data: stories
      } = await supabase.from('stories').select(`
            id,
            title,
            content,
            created_at,
            profile_id
          `).eq('family_id', familyId).order('created_at', {
        ascending: false
      }).limit(15);

      // Fetch author profiles separately
      if (stories?.length) {
        const authorIds = [...new Set(stories.map(story => story.profile_id))];
        const {
          data: allProfiles
        } = await supabase.rpc('get_family_member_safe_profiles');
        
        const profiles = allProfiles?.filter((p: any) => authorIds.includes(p.id)) || [];
        stories.forEach(story => {
          const profile = profiles?.find(p => p.id === story.profile_id);
          activities.push({
            id: `story-${story.id}`,
            type: 'story',
            actor: profile?.full_name || 'Someone',
            action: 'shared a story',
            target: story.title,
            snippet: story.content?.substring(0, 150) + '...',
            time: getRelativeTime(story.created_at),
            unread: isRecent(story.created_at)
          });
        });
      }

      // Sort activities by creation time (most recent first)
      activities.sort((a, b) => parseTimeAgo(a.time) - parseTimeAgo(b.time));
      setActivities(activities);

      // Get recent comments
      const {
        data: comments
      } = await supabase.from('comments').select(`
          id,
          content,
          created_at,
          story_id,
          family_member_profiles:profile_id (full_name),
          stories:story_id (title)
        `).eq('family_id', familyId).order('created_at', {
        ascending: false
      }).limit(10);
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
          });
        });
      }

      // Sort by time
      activities.sort((a, b) => {
        const timeA = new Date(a.time.includes('ago') ? Date.now() - parseTimeAgo(a.time) : a.time).getTime();
        const timeB = new Date(b.time.includes('ago') ? Date.now() - parseTimeAgo(b.time) : b.time).getTime();
        return timeB - timeA;
      });

      // Only add sample activities on initial load to prevent layout shifts
      if (activities.length === 0) {
        const sampleActivities: ActivityItem[] = [{
          id: 'sample-1',
          type: 'photo',
          actor: 'Emma',
          action: 'uploaded photos from',
          target: 'Family Reunion 2024',
          snippet: '12 new photos added to the album',
          time: '3 hours ago',
          unread: true
        }, {
          id: 'sample-2',
          type: 'story',
          actor: 'Michael',
          action: 'shared memories about',
          target: 'Dad\'s Workshop',
          snippet: 'Remember how he taught us to build birdhouses every weekend...',
          time: '5 hours ago',
          unread: false
        }];
        activities.push(...sampleActivities);
      }
      setActivities(activities);
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities([]);
    }
  };
  const loadDrafts = async (userId: string, familyId: string) => {
    try {
      const drafts: DraftItem[] = [];

      // Get recent stories (as drafts)
      const {
        data: stories
      } = await supabase.from('stories').select('id, title, updated_at').eq('family_id', familyId).eq('profile_id', userId).order('updated_at', {
        ascending: false
      }).limit(3);
      if (stories) {
        stories.forEach(story => {
          drafts.push({
            id: story.id,
            type: 'story',
            title: story.title,
            progress: Math.floor(Math.random() * 40) + 60,
            lastEdited: getRelativeTime(story.updated_at)
          });
        });
      }
      setDrafts(drafts);
    } catch (error) {
      console.error('Error loading drafts:', error);
      setDrafts([]);
    }
  };
  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
    return formatForUser(dateString, 'relative', getCurrentUserRegion());
  };
  const isRecent = (dateString: string): boolean => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffInHours <= 24;
  };
  const parseTimeAgo = (timeStr: string): number => {
    if (timeStr.includes('hours ago')) {
      const hours = parseInt(timeStr);
      return hours * 60 * 60 * 1000;
    }
    if (timeStr.includes('days ago')) {
      const days = parseInt(timeStr);
      return days * 24 * 60 * 60 * 1000;
    }
    return 0;
  };
  const handleStoryCreated = (storyId: string) => {
    // Optimistically update the feed
    loadHomeData();
    track('voice_story_published', {
      storyId
    });
  };
  const handleResumeDraft = (draftId: string) => {
    track('draft_resumed', {
      draftId
    });
    // Navigate to edit the draft
  };
  const handleDeleteDraft = (draftId: string) => {
    track('draft_deleted', {
      draftId
    });
    setDrafts(prev => prev.filter(d => d.id !== draftId));
  };

  // Simple Mode Recording Integration
  const handlePromptSelected = async (prompt: ElderPrompt) => {
    setCurrentPrompt(prompt);

    // Check if online
    if (!isOnline()) {
      setShowOfflineQueue(true);
      track('recorder.offline_queue', {
        prompt_id: prompt.id,
        prompt_kind: prompt.kind
      });
      return;
    }

    // Check microphone permission
    const permission = await checkMicrophonePermission();
    if (permission === 'denied') {
      setShowPermissionDenied(true);
      track('recorder.permission_denied', {
        prompt_id: prompt.id,
        prompt_kind: prompt.kind
      });
      return;
    }

    // Start countdown if permission granted or will be prompted
    setShowCountdown(true);
  };
  const handleCountdownComplete = () => {
    if (!currentPrompt) return;
    setShowCountdown(false);

    // Open voice recording modal and start recording immediately
    setShowVoiceModal(true);
  };
  const handlePermissionRetry = async () => {
    if (!currentPrompt) return;
    const permission = await checkMicrophonePermission();
    if (permission !== 'denied') {
      setShowPermissionDenied(false);
      setShowCountdown(true);
    }
  };
  const handleTypeInstead = () => {
    if (!currentPrompt) return;
    setShowPermissionDenied(false);

    // Navigate to text story creation
    const title = getPromptTitle(currentPrompt);
    const searchParams = new URLSearchParams({
      type: 'text',
      promptTitle: title,
      prompt_id: currentPrompt.id,
      prompt_text: currentPrompt.text,
      ...(currentPrompt.context?.personId && {
        person_id: currentPrompt.context.personId
      })
    });
    navigate(`/stories/new?${searchParams.toString()}`);
  };
  const handleOfflineProceed = () => {
    if (!currentPrompt) return;
    setShowOfflineQueue(false);
    setShowCountdown(true);
  };
  const handleCancel = () => {
    setShowCountdown(false);
    setShowPermissionDenied(false);
    setShowOfflineQueue(false);
    setShowVoiceModal(false);
    setCurrentPrompt(null);
  };
  if (loading || modeLoading) {
    return <ImpersonationBoundary>
        <AuthGate>
          <div className="min-h-screen bg-background">
            <Header />
            <main id="main-content" className="container mx-auto px-4 py-6 space-y-6" tabIndex={-1}>
              <div role="status" aria-label="Loading home page">
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
                <span className="sr-only">Loading your family home page...</span>
              </div>
            </main>
          </div>
        </AuthGate>
      </ImpersonationBoundary>;
  }
  if (mode === 'simple') {
    return <AuthGate>
        <div className="min-h-screen bg-background">
          <Header />
          <main id="main-content" className="simple-mode container mx-auto px-4 py-6 space-y-6" tabIndex={-1}>
            {/* Progress Header for Simple Mode */}
            {flags['prompts.progressAndFilters'] && (
              <ProgressHeader familyId={spaceId || ''} variant="compact" />
            )}

            {/* Simple Mode: Unified Header */}
            <SimpleHeader profileId={profileId || 'default'} spaceId={spaceId || 'default'} onRecordPrompt={handlePromptSelected} />

            {/* Recording Controller Modals */}
            {currentPrompt && <CountdownModal isOpen={showCountdown} prompt={currentPrompt} onComplete={handleCountdownComplete} onCancel={handleCancel} />}

            {showPermissionDenied && currentPrompt && <div className="mb-6">
                <PermissionDeniedCard prompt={currentPrompt} onTryAgain={handlePermissionRetry} onTypeInstead={handleTypeInstead} onDismiss={handleCancel} />
              </div>}

            {showOfflineQueue && <div className="mb-6">
                <OfflineQueueCard onProceed={handleOfflineProceed} onCancel={handleCancel} />
              </div>}

            {/* Voice Recording Modal */}
            <VoiceCaptureModal open={showVoiceModal} onClose={() => {
            setShowVoiceModal(false);
            setCurrentPrompt(null);
          }} onStoryCreated={handleStoryCreated} prompt={currentPrompt || undefined} autoStart={true} />

            {/* Invite Banner */}
            {!hasOtherMembers && <InviteBanner />}

            {/* Continue Where You Left Off */}
            {flags['prompts.progressAndFilters'] && (
              <ContinueWhereYouLeftOff 
                familyId={spaceId || ''} 
                onContinue={(instanceId) => {
                  // Navigate to story creation for in-progress prompt
                  const searchParams = new URLSearchParams({
                    instance_id: instanceId,
                    type: 'text'
                  });
                  navigate(`/stories/new?${searchParams.toString()}`);
                }} 
              />
            )}
            {flags['prompts.birthdays'] && (
              <BirthdayRail 
                familyId={spaceId || ''} 
                onPromptClick={(instanceId) => {
                  // Navigate to story creation for birthday prompt
                  const searchParams = new URLSearchParams({
                    type: 'text',
                    prompt_id: instanceId
                  })
                  navigate(`/stories/new?${searchParams.toString()}`)
                }} 
              />
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Family Updates Feed */}
              <div className="lg:col-span-2">
                <div className="space-y-4 min-h-[600px]">
                  <Suspense fallback={<div className="h-32 w-full bg-muted animate-pulse rounded-lg" />}>
                    <FamilyUpdatesFeed 
                      activities={memoizedActivities} 
                      variant="simple" 
                      familyMembers={memoizedFamilyMembers} 
                      familyId={spaceId} 
                    />
                  </Suspense>
                </div>
              </div>

              {/* Right Rail */}
              <div className="space-y-6">
                <Upcoming />
                <WeeklyDigest />
              </div>
            </div>
          </main>
        </div>
      </AuthGate>;
  }

  // Studio Mode
  return <AuthGate>
      <div className="min-h-screen bg-background" data-discovery-mode={isDiscoveryMode}>
        <Header />
        <div className="container mx-auto px-4 py-2 flex justify-end">
          <DiscoveryModeToggle />
        </div>
        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Recording Controller */}
          {isSimpleMode && <SimpleRecordingController profileId={profileId || 'default'} spaceId={spaceId || 'default'} />}

          {/* Voice Hero + Segmented Controls */}
          <VoiceFirstHero mode="studio" onStoryCreated={handleStoryCreated} />

          {/* Invite Banner */}
          <InviteBanner />

          {/* Discovery Mode Banner */}
          {isUnder13 && <DiscoveryModeBanner isUnder13={isUnder13} />}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Primary Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Story Creator */}
                <QuickStoryCreator 
                  familyId={spaceId}
                  onStoryCreated={() => loadHomeData()}
                />

                {/* Pinned Drafts Row */}
                {drafts.length > 0 && <DraftsRow drafts={drafts} onResume={handleResumeDraft} onDelete={handleDeleteDraft} />}

                {/* Dense Feed */}
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">
                    What's New
                  </h2>
                  <FamilyUpdatesFeed activities={activities} variant="studio" familyMembers={familyMembers} familyId={spaceId} />
                </div>
              </div>

            {/* Right Rail */}
            <div className="space-y-6">
              <Upcoming />
              <WeeklyDigestPreview familyId={spaceId} />
            </div>
          </div>
        </main>
        
        {/* Onboarding Components */}
        <OnboardingProgress profileId={profileId} familyId={spaceId} />
        <FloatingCoachMark profileId={profileId} familyId={spaceId} />
      </div>
    </AuthGate>;
}