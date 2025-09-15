import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageCircle, Heart, Share, MoreHorizontal, Copy, EyeOff, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAnalytics } from '@/hooks/useAnalytics'

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

  const handleActivityClick = (activity: ActivityItem) => {
    track('activity_clicked', { 
      activityId: activity.id,
      type: activity.type,
      variant
    })
  }

  const handleReaction = (activityId: string, reaction: string) => {
    track('activity_reaction', { activityId, reaction })
    
    // Implement actual functionality based on reaction type
    switch (reaction) {
      case 'like':
        // TODO: Implement like functionality
        console.log('Liked story:', activityId)
        break
      case 'comment':
        // Navigate to story detail to add comment
        const storyId = activityId.replace('story-', '')
        window.location.href = `/story/${storyId}#comments`
        break
      case 'share':
        // Implement share functionality
        if (navigator.share) {
          navigator.share({
            title: 'Family Story',
            url: window.location.origin + `/story/${activityId.replace('story-', '')}`
          })
        } else {
          // Fallback: copy to clipboard
          navigator.clipboard.writeText(window.location.origin + `/story/${activityId.replace('story-', '')}`)
          console.log('Story link copied to clipboard')
        }
        break
    }
  }

  if (activities.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No family updates yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Be the first to share a memory!
          </p>
        </CardContent>
      </Card>
    )
  }

  if (variant === 'simple') {
    // Large card layout for Simple mode
    return (
      <div className={cn("space-y-4", className)}>
        {activities.slice(0, 5).map((activity) => (
          <Card 
            key={activity.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              activity.unread && "ring-2 ring-primary/20"
            )}
            onClick={() => handleActivityClick(activity)}
          >
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {activity.actor.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium text-foreground">
                        {activity.actor} {activity.action} <span className="text-primary">{activity.target}</span>
                      </p>
                      {activity.unread && (
                        <Badge variant="secondary" className="text-xs">New</Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {activity.time}
                    </p>
                    
                    {activity.snippet && (
                      <p className="text-sm text-foreground mt-3 line-clamp-3">
                        {activity.snippet}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-2 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReaction(activity.id, 'like')
                      }}
                    >
                      <Heart className="h-4 w-4" />
                      <span className="text-xs">Like</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-2 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReaction(activity.id, 'comment')
                      }}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-xs">Comment</span>
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReaction(activity.id, 'share')
                      }}
                    >
                      <Share className="h-4 w-4" />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          const storyId = activity.id.replace('story-', '')
                          navigator.clipboard.writeText(window.location.origin + `/story/${storyId}`)
                          console.log('Story link copied to clipboard')
                        }}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          console.log('Hide update:', activity.id)
                        }}>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Hide Update
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          console.log('Report update:', activity.id)
                        }}>
                          <Flag className="h-4 w-4 mr-2" />
                          Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Dense layout for Studio mode
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {activities.slice(0, 8).map((activity, index) => (
            <div 
              key={activity.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
                activity.unread && "bg-primary/5 border border-primary/20",
                index !== activities.length - 1 && "border-b border-border/50"
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
                  {activity.unread && (
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground mt-1">
                  {activity.time}
                </p>
                
                {activity.snippet && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {activity.snippet}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}