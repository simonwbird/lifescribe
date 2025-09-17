import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, Heart, Share } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

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

interface FamilyUpdatesFeedProps {
  activities: ActivityItem[]
  variant?: 'simple' | 'studio'
  className?: string
}

export default function FamilyUpdatesFeed({ activities, variant = 'simple', className }: FamilyUpdatesFeedProps) {
  const { track } = useAnalytics()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [userProfile, setUserProfile] = useState<{ avatar_url?: string; full_name?: string } | null>(null)
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

  // Marquee animation using requestAnimationFrame (smooth and reliable)
  useEffect(() => {
    let raf = 0
    let pos = 0
    const speed = 0.8 // px per frame ~48px/s at 60fps

    const step = () => {
      const track = tickerRef.current
      if (track) {
        // Ensure we have 2 blocks for seamless looping
        const blocks = track.querySelectorAll(':scope > .ticker-block')
        if (blocks.length < 2 && blocks[0]) {
          const clone = (blocks[0] as HTMLElement).cloneNode(true) as HTMLElement
          clone.classList.add('ticker-block')
          clone.setAttribute('aria-hidden', 'true')
          track.appendChild(clone)
        }

        const first = track.querySelector(':scope > .ticker-block') as HTMLElement | null
        const width = first?.offsetWidth ?? 0

        pos -= speed
        if (width > 0 && Math.abs(pos) >= width) {
          pos += width
        }
        track.style.transform = `translateX(${pos}px)`
      }
      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [activities])

  const handleActivityClick = (activity: ActivityItem) => {
    track('activity_clicked', { activityId: activity.id, type: activity.type, variant })
    if (activity.id.startsWith('story-') || activity.type === 'story' || activity.type === 'comment') {
      const storyId = activity.id.replace('story-', '')
      navigate(`/stories/${storyId}`)
    }
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
    // Animated News Reel
    return (
      <div className={cn('relative', className)}>
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-2 rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-semibold">FAMILY UPDATES</span>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </div>
        </div>

        {/* Scrolling track container */}
        <div className="bg-card border-x border-b rounded-b-lg overflow-hidden relative">
          <div className="relative overflow-hidden">
            <div ref={tickerRef} className="flex whitespace-nowrap will-change-transform" style={{ transform: 'translateX(0px)' }}>
              {/* Block A */}
              <div className="ticker-block flex">
                {activities.map((activity, index) => (
                  <div
                    key={`a-${activity.id}-${index}`}
                    className="flex-shrink-0 flex items-center gap-4 px-8 py-4 cursor-pointer hover:bg-muted/30 transition-colors border-r border-muted/30 min-w-[400px]"
                    onClick={() => handleActivityClick(activity)}
                  >
                    {/* Live */}
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-xs font-mono text-muted-foreground">LIVE</span>
                    </div>

                    <Avatar className="h-8 w-8 border-2 border-primary/20">
                      <AvatarImage src={userProfile?.avatar_url ?? undefined} alt={userProfile?.full_name || activity.actor} className="object-cover" referrerPolicy="no-referrer" />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {activity.actor.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          <span className="text-primary font-semibold">{activity.actor}</span> {activity.action} {activity.target}
                        </p>
                        {activity.unread && (<Badge variant="destructive" className="text-xs animate-pulse">NEW</Badge>)}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{activity.time} • Breaking</p>
                      {activity.snippet && (<p className="text-xs text-foreground mt-1 truncate max-w-[200px]">{activity.snippet}</p>)}
                    </div>

                    <div className="flex items-center gap-1 opacity-60">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-primary/20" onClick={(e) => { e.stopPropagation(); handleReaction(activity.id, 'like') }}>
                        <Heart className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-primary/20" onClick={(e) => { e.stopPropagation(); handleReaction(activity.id, 'share') }}>
                        <Share className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Block B (duplicate for seamless loop) */}
              <div className="ticker-block flex" aria-hidden="true">
                {activities.map((activity, index) => (
                  <div
                    key={`b-${activity.id}-${index}`}
                    className="flex-shrink-0 flex items-center gap-4 px-8 py-4 cursor-pointer hover:bg-muted/30 transition-colors border-r border-muted/30 min-w-[400px]"
                    onClick={() => handleActivityClick(activity)}
                  >
                    {/* Live */}
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-xs font-mono text-muted-foreground">LIVE</span>
                    </div>

                    <Avatar className="h-8 w-8 border-2 border-primary/20">
                      <AvatarImage src={userProfile?.avatar_url ?? undefined} alt={userProfile?.full_name || activity.actor} className="object-cover" referrerPolicy="no-referrer" />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {activity.actor.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          <span className="text-primary font-semibold">{activity.actor}</span> {activity.action} {activity.target}
                        </p>
                        {activity.unread && (<Badge variant="destructive" className="text-xs animate-pulse">NEW</Badge>)}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{activity.time} • Breaking</p>
                      {activity.snippet && (<p className="text-xs text-foreground mt-1 truncate max-w-[200px]">{activity.snippet}</p>)}
                    </div>

                    <div className="flex items-center gap-1 opacity-60">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-primary/20" onClick={(e) => { e.stopPropagation(); handleReaction(activity.id, 'like') }}>
                        <Heart className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-primary/20" onClick={(e) => { e.stopPropagation(); handleReaction(activity.id, 'share') }}>
                        <Share className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gradient fades */}
            <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-card to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-card to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Breaking bar */}
        <div className="bg-red-600 text-white px-4 py-1 text-xs font-semibold animate-pulse rounded-b-lg">
          <div className="flex items-center justify-center gap-2">
            <span>🔴</span>
            <span>LIVE FAMILY UPDATES</span>
            <span>•</span>
            <span>{activities.length} NEW STORIES</span>
            <span>🔴</span>
          </div>
        </div>
      </div>
    )
  }

  // Dense list for Studio mode
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {activities.slice(0, 8).map((activity, index) => (
            <div
              key={activity.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50',
                activity.unread && 'bg-primary/5 border border-primary/20',
                index !== activities.length - 1 && 'border-b border-border/50'
              )}
              onClick={() => handleActivityClick(activity)}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {activity.actor.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{activity.actor}</span> {activity.action}{' '}
                    <span className="text-primary font-medium">{activity.target}</span>
                  </p>
                  {activity.unread && (<div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                {activity.snippet && (<p className="text-xs text-muted-foreground mt-1 line-clamp-2">{activity.snippet}</p>)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
