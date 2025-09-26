import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, Heart, Share, Eye, MoreHorizontal, Filter, Zap, ZapOff, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { FeedFilters, type FeedFilterOptions } from './FeedFilters'
import { InlineStoryViewer } from './InlineStoryViewer'
import { EnhancedFeedItem } from './EnhancedFeedItem'
import { SimpleModeReactionBar } from '../feed/SimpleModeReactionBar'
import { EnhancedMediaCommentField } from '../feed/EnhancedMediaCommentField'
import { LiveFeedAnimations } from '../feed/LiveFeedAnimations'
import { isAfter, isBefore, isWithinInterval } from 'date-fns'

interface ActivityItem {
  id: string
  type: 'story' | 'comment' | 'invite' | 'photo'
  actor: string
  action: string
  target: string
  snippet?: string
  time: string
  unread: boolean
  author_id?: string
  content_type?: 'text' | 'photo' | 'audio' | 'video'
  created_at?: string
  full_content?: string
  media_count?: number
  has_audio?: boolean
  reactions_count?: number
  comments_count?: number
}

interface FamilyMember {
  id: string
  name: string
}

interface FamilyUpdatesFeedProps {
  activities: ActivityItem[]
  variant?: 'simple' | 'studio'
  className?: string
  familyMembers?: FamilyMember[]
  familyId?: string
}

export default function FamilyUpdatesFeed({ 
  activities, 
  variant = 'simple', 
  className,
  familyMembers = [],
  familyId = ''
}: FamilyUpdatesFeedProps) {
  const { track } = useAnalytics()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [userProfile, setUserProfile] = useState<{ avatar_url?: string; full_name?: string } | null>(null)
  const [filters, setFilters] = useState<FeedFilterOptions>({})
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set())
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true) // Enable by default for Simple mode
  const [reactionStates, setReactionStates] = useState<Record<string, { liked: boolean; likeCount: number }>>({})
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [newFeedItems, setNewFeedItems] = useState<any[]>([])
  const tickerRef = useRef<HTMLDivElement | null>(null)

  // Load current user's profile (for avatar)
  useEffect(() => {
    const getUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const meta = user.user_metadata as any
        const metaAvatar = meta?.avatar_url || meta?.picture
        const metaName = meta?.full_name || meta?.name
        if (metaAvatar || metaName) {
          setUserProfile({ avatar_url: metaAvatar, full_name: metaName })
          return
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, full_name')
          .eq('id', user.id)
          .maybeSingle()
        if (profile) setUserProfile(profile)
      }
    }
    getUserProfile()
  }, [])

  // Filter activities based on current filters
  const filteredActivities = activities.filter((activity) => {
    // Filter by family member
    if (filters.member && activity.author_id !== filters.member) {
      return false
    }

    // Filter by content type
    if (filters.contentType && filters.contentType !== 'all') {
      if (activity.content_type !== filters.contentType) {
        return false
      }
    }

    // Filter by date range
    if (filters.dateRange) {
      const activityDate = new Date(activity.created_at || activity.time)
      if (filters.dateRange.from && isBefore(activityDate, filters.dateRange.from)) {
        return false
      }
      if (filters.dateRange.to && isAfter(activityDate, filters.dateRange.to)) {
        return false
      }
    }

    return true
  })

  // Real-time updates subscription with better error handling
  useEffect(() => {
    if (!isRealTimeEnabled || !familyId) return

    const channel = supabase
      .channel(`family-updates-${familyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stories',
          filter: `family_id=eq.${familyId}`
        },
        (payload) => {
          track('realtime_update_received', { 
            type: 'story',
            storyId: payload.new.id 
          })
          
          toast({
            title: "✨ New story shared!",
            description: `${payload.new.title || 'A family member'} just shared something new.`,
            duration: 5000,
          })
          
          // Auto-refresh activities after short delay
          setTimeout(() => {
            window.location.reload() // Simple refresh for demo
          }, 1000)
        }
      )
      .on(
        'postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `family_id=eq.${familyId}`
        },
        (payload) => {
          track('realtime_update_received', { 
            type: 'comment',
            commentId: payload.new.id 
          })
          
          toast({
            title: "💬 New comment",
            description: "Someone just added a comment!",
            duration: 3000,
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT', 
          schema: 'public',
          table: 'reactions',
          filter: `family_id=eq.${familyId}`
        },
        (payload) => {
          track('realtime_update_received', { 
            type: 'reaction',
            reactionId: payload.new.id 
          })
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time feed updates active')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time connection failed')
          toast({
            title: "Connection issue",
            description: "Real-time updates may not work properly.",
            variant: "destructive"
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isRealTimeEnabled, familyId, track, toast])

  const handleActivityClick = (activity: ActivityItem) => {
    track('activity_clicked', { activityId: activity.id, type: activity.type, variant })
    
    if (activity.id.startsWith('story-') || activity.type === 'story' || activity.type === 'comment') {
      const storyId = activity.id.replace('story-', '')
      
      // Toggle expansion for simple variant
      if (variant === 'simple') {
        const newExpanded = new Set(expandedStories)
        if (expandedStories.has(storyId)) {
          newExpanded.delete(storyId)
        } else {
          newExpanded.add(storyId)
        }
        setExpandedStories(newExpanded)
        track('story_expanded_inline', { storyId, expanded: !expandedStories.has(storyId) })
      } else {
        navigate(`/stories/${storyId}`)
      }
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    track('activity_clicked')
    
    toast({
      title: "🔄 Refreshing feed...",
      description: "Getting the latest family updates"
    })
    
    // Simple refresh for demo - in real app would refetch data
    setTimeout(() => {
      setIsRefreshing(false)
      window.location.reload()
    }, 1500)
  }

  const handleLikeToggle = async (activityId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    const currentState = reactionStates[activityId] || { liked: false, likeCount: 0 }
    const newLiked = !currentState.liked
    const newCount = newLiked ? currentState.likeCount + 1 : Math.max(0, currentState.likeCount - 1)
    
    // Optimistic update
    setReactionStates(prev => ({
      ...prev,
      [activityId]: { liked: newLiked, likeCount: newCount }
    }))

    track('activity_reaction', { 
      activityId, 
      reaction: 'like',
      action: newLiked ? 'add' : 'remove'
    })

    toast({ 
      title: newLiked ? 'Story liked!' : 'Like removed',
      description: newLiked ? 'Thanks for the feedback' : '',
    })
  }

  const toggleRealTime = () => {
    const newState = !isRealTimeEnabled
    setIsRealTimeEnabled(newState)
    
    track('realtime_toggled', { enabled: newState })
    
    toast({
      title: newState ? '🟢 Live updates enabled' : '⚪ Live updates disabled',
      description: newState 
        ? 'You\'ll see new stories and comments as they happen!' 
        : 'Feed will only update when you refresh manually',
    })
  }

  const handleReaction = async (activityId: string, reaction: string) => {
    track('activity_reaction', { activityId, reaction })
    switch (reaction) {
      case 'like':
        toast({ title: 'Story liked!', description: 'Thanks for the feedback' })
        break
      case 'comment':
        navigate(`/stories/${activityId.replace('story-', '')}#comments`)
        break
      case 'share': {
        const shareUrl = window.location.origin + `/stories/${activityId.replace('story-', '')}`
        try {
          if (navigator.share && /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)) {
            await navigator.share({ title: 'Family Story', url: shareUrl })
            toast({ title: 'Story shared!', description: 'Thanks for sharing with others' })
          } else if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(shareUrl)
            toast({ title: 'Link copied!', description: 'Story link copied to clipboard' })
          } else {
            const ta = document.createElement('textarea')
            ta.value = shareUrl
            ta.style.position = 'fixed'
            ta.style.left = '-9999px'
            document.body.appendChild(ta)
            ta.focus()
            ta.select()
            document.execCommand('copy')
            ta.remove()
            toast({ title: 'Link copied!', description: 'Story link copied to clipboard' })
          }
        } catch (e) {
          console.error('Share error:', e)
          toast({ title: 'Share failed', description: 'Unable to share right now.', variant: 'destructive' })
        }
        break
      }
    }
  }

  if (filteredActivities.length === 0 && activities.length > 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center space-y-4">
          <p className="text-muted-foreground">No updates match your current filters</p>
          <FeedFilters 
            filters={filters}
            onFiltersChange={setFilters}
            familyMembers={familyMembers}
          />
          <Button 
            variant="outline" 
            onClick={() => setFilters({})}
          >
            Clear all filters
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No family updates yet</p>
          <p className="text-sm text-muted-foreground mt-1">Be the first to share a memory!</p>
        </CardContent>
      </Card>
    )
  }

  if (variant === 'simple') {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Enhanced Controls */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Family Updates</h3>
            <Badge 
              variant={isRealTimeEnabled ? "default" : "secondary"} 
              className={cn(
                "flex items-center gap-1 transition-all",
                isRealTimeEnabled && "bg-green-600 text-white animate-pulse"
              )}
            >
              {isRealTimeEnabled ? <Zap className="w-3 h-3" /> : <ZapOff className="w-3 h-3" />}
              {isRealTimeEnabled ? 'LIVE' : 'Static'}
            </Badge>
            {filteredActivities.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {filteredActivities.length} updates
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleRealTime}
              className={cn(
                "flex items-center gap-2",
                isRealTimeEnabled && "bg-green-50 border-green-200 text-green-700"
              )}
            >
              {isRealTimeEnabled ? <ZapOff className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
              {isRealTimeEnabled ? 'Disable Live' : 'Enable Live'}
            </Button>
            
            <FeedFilters 
              filters={filters}
              onFiltersChange={setFilters}
              familyMembers={familyMembers}
            />
          </div>
        </div>

        {/* Live Feed Updates */}
        {newFeedItems.length > 0 && (
          <LiveFeedAnimations
            newItems={newFeedItems}
            onItemClick={(item) => handleActivityClick(filteredActivities.find(a => a.id === item.id)!)}
            onDismiss={(itemId) => setNewFeedItems(prev => prev.filter(item => item.id !== itemId))}
            onViewAll={() => window.location.reload()}
            isRealTimeEnabled={isRealTimeEnabled}
          />
        )}

        {/* Enhanced Feed Content */}
        <div className="space-y-3">
          {filteredActivities.map((activity, index) => (
            <EnhancedFeedItem
              key={`${activity.id}-${index}`}
              activity={activity}
              familyId={familyId}
              userProfile={userProfile}
              isExpanded={expandedStories.has(activity.id.replace('story-', ''))}
              onToggleExpand={() => handleActivityClick(activity)}
              onNavigate={() => navigate(`/stories/${activity.id.replace('story-', '')}`)}
              showAdminActions={true}
              compact={true}
            />
          ))}
        </div>

        {/* Enhanced Status bar */}
        <div className={cn(
          "px-4 py-3 text-sm font-semibold rounded-lg text-center border-2 transition-all",
          isRealTimeEnabled 
            ? "bg-green-50 border-green-200 text-green-800" 
            : "bg-muted border-muted-foreground/20 text-muted-foreground"
        )}>
          <div className="flex items-center justify-center gap-3">
            {isRealTimeEnabled ? (
              <>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>LIVE UPDATES ACTIVE</span>
                <span>•</span>
                <span>{filteredActivities.length} STORIES</span>
                <span>•</span>
                <span>REAL-TIME SYNC</span>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                <span>STATIC VIEW</span>
                <span>•</span>
                <span>{filteredActivities.length} STORIES</span>
                <span>•</span>
                <span>MANUAL REFRESH ONLY</span>
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Studio mode with enhanced social features
  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters */}
      <FeedFilters 
        filters={filters}
        onFiltersChange={setFilters}
        familyMembers={familyMembers}
      />
      
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {filteredActivities.slice(0, 8).map((activity, index) => {
              const activityReactions = reactionStates[activity.id] || { liked: false, likeCount: 0 }
              
              return (
                <div
                  key={activity.id}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 border',
                    activity.unread && 'bg-primary/5 border-primary/20',
                    index !== filteredActivities.length - 1 && 'border-b border-border/50'
                  )}
                  onClick={() => handleActivityClick(activity)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {activity.actor.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{activity.actor}</span> {activity.action}{' '}
                        <span className="text-primary font-medium">{activity.target}</span>
                      </p>
                      {activity.unread && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                      )}
                      {activity.content_type && (
                        <Badge variant="outline" className="text-xs capitalize">{activity.content_type}</Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                    
                    {activity.snippet && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{activity.snippet}</p>
                    )}

                    {/* Social Actions */}
                    <div className="flex items-center gap-4 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 px-3 text-xs",
                          activityReactions.liked && "text-red-500"
                        )}
                        onClick={(e) => handleLikeToggle(activity.id, e)}
                      >
                        <Heart className={cn("h-4 w-4 mr-1", activityReactions.liked && "fill-current")} />
                        {activityReactions.likeCount > 0 ? activityReactions.likeCount : 'Like'}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/stories/${activity.id.replace('story-', '')}#comments`)
                        }}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Comment
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReaction(activity.id, 'share')
                        }}
                      >
                        <Share className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
