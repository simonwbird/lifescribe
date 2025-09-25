import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, Heart, Share, Eye, MoreHorizontal, Filter, Zap, ZapOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { FeedFilters, type FeedFilterOptions } from './FeedFilters'
import { InlineStoryViewer } from './InlineStoryViewer'
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
  const [expandedStory, setExpandedStory] = useState<string | null>(null)
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false)
  const [reactionStates, setReactionStates] = useState<Record<string, { liked: boolean; likeCount: number }>>({})
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

  // Real-time updates subscription
  useEffect(() => {
    if (!isRealTimeEnabled || !familyId) return

    const channel = supabase
      .channel('family-updates-live')
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
            title: "New story shared!",
            description: `${payload.new.title || 'A family member'} just shared something new.`,
          })
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
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isRealTimeEnabled, familyId, track, toast])

  const handleActivityClick = (activity: ActivityItem) => {
    track('activity_clicked', { activityId: activity.id, type: activity.type, variant })
    
    if (activity.id.startsWith('story-') || activity.type === 'story' || activity.type === 'comment') {
      const storyId = activity.id.replace('story-', '')
      
      // Show inline expansion for simple variant, navigate for studio
      if (variant === 'simple' && expandedStory !== storyId) {
        setExpandedStory(storyId)
        track('story_expanded_inline', { storyId })
      } else {
        navigate(`/stories/${storyId}`)
      }
    }
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
      title: newState ? 'Real-time updates enabled' : 'Real-time updates disabled',
      description: newState 
        ? 'You\'ll see new stories and comments as they happen' 
        : 'Updates will only refresh when you reload the page',
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
        {/* Controls */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Family Updates</h3>
            <Badge variant={isRealTimeEnabled ? "default" : "secondary"} className="flex items-center gap-1">
              {isRealTimeEnabled ? <Zap className="w-3 h-3" /> : <ZapOff className="w-3 h-3" />}
              {isRealTimeEnabled ? 'LIVE' : 'Static'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleRealTime}
              className="flex items-center gap-2"
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

        {/* Expanded Story Viewer */}
        {expandedStory && (
          <InlineStoryViewer
            storyId={expandedStory}
            familyId={familyId}
            onClose={() => setExpandedStory(null)}
            onOpenFull={() => setExpandedStory(null)}
          />
        )}

        {/* Feed Content */}
        <div className="relative h-full min-h-[400px]">
          {/* Scrollable content area */}
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="h-full max-h-[600px] overflow-y-auto scrollbar-thin">
              <div className="space-y-1">
                {filteredActivities.map((activity, index) => {
                  const activityReactions = reactionStates[activity.id] || { liked: false, likeCount: 0 }
                  
                  return (
                    <div
                      key={`${activity.id}-${index}`}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors border-b border-muted/30 last:border-b-0"
                      onClick={() => handleActivityClick(activity)}
                    >
                      <Avatar className="h-10 w-10 border-2 border-primary/20 flex-shrink-0">
                        <AvatarImage 
                          src={userProfile?.avatar_url ?? undefined} 
                          alt={userProfile?.full_name || activity.actor} 
                          className="object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {activity.actor.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            <span className="text-primary font-semibold">{activity.actor}</span> {activity.action} {activity.target}
                          </p>
                          {activity.unread && (
                            <Badge variant="destructive" className="text-xs animate-pulse">NEW</Badge>
                          )}
                          {activity.content_type && (
                            <Badge variant="outline" className="text-xs capitalize">{activity.content_type}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{activity.time}</p>
                        {activity.snippet && (
                          <p className="text-xs text-foreground mt-1 truncate">{activity.snippet}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-60 flex-shrink-0">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={cn(
                            "h-8 w-8 p-0 hover:bg-primary/20",
                            activityReactions.liked && "text-red-500"
                          )} 
                          onClick={(e) => handleLikeToggle(activity.id, e)}
                        >
                          <Heart className={cn("h-4 w-4", activityReactions.liked && "fill-current")} />
                          {activityReactions.likeCount > 0 && (
                            <span className="text-xs ml-1">{activityReactions.likeCount}</span>
                          )}
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-primary/20" 
                          onClick={(e) => { 
                            e.stopPropagation()
                            navigate(`/stories/${activity.id.replace('story-', '')}#comments`) 
                          }}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-primary/20" 
                          onClick={(e) => { 
                            e.stopPropagation()
                            handleReaction(activity.id, 'share') 
                          }}
                        >
                          <Share className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-primary/20" 
                          onClick={(e) => { 
                            e.stopPropagation()
                            setExpandedStory(activity.id.replace('story-', ''))
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Status bar */}
          <div className={cn(
            "mt-2 px-4 py-2 text-xs font-semibold rounded-lg text-center",
            isRealTimeEnabled 
              ? "bg-green-600 text-white animate-pulse" 
              : "bg-muted text-muted-foreground"
          )}>
            <div className="flex items-center justify-center gap-2">
              {isRealTimeEnabled ? (
                <>
                  <span>🟢</span>
                  <span>LIVE UPDATES ACTIVE</span>
                  <span>•</span>
                  <span>{filteredActivities.length} STORIES</span>
                  <span>🟢</span>
                </>
              ) : (
                <>
                  <span>⚪</span>
                  <span>STATIC VIEW</span>
                  <span>•</span>
                  <span>{filteredActivities.length} STORIES</span>
                  <span>⚪</span>
                </>
              )}
            </div>
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
