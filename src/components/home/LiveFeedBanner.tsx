import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { X, Eye, Heart, MessageCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAnalytics } from '@/hooks/useAnalytics'

interface NewStoryBanner {
  id: string
  title: string
  author_name: string
  author_avatar?: string
  time_ago: string
  story_id: string
  type: 'story' | 'comment' | 'reaction'
}

interface LiveFeedBannerProps {
  newItems: NewStoryBanner[]
  onDismiss: (id: string) => void
  onViewStory: (storyId: string) => void
  className?: string
}

export default function LiveFeedBanner({ 
  newItems, 
  onDismiss, 
  onViewStory,
  className 
}: LiveFeedBannerProps) {
  const [visibleItems, setVisibleItems] = useState<NewStoryBanner[]>([])
  const { track } = useAnalytics()

  useEffect(() => {
    if (newItems.length > 0) {
      // Show new items with staggered animation
      newItems.forEach((item, index) => {
        setTimeout(() => {
          setVisibleItems(prev => {
            if (!prev.find(i => i.id === item.id)) {
              return [...prev, item]
            }
            return prev
          })
        }, index * 300) // Stagger animations
      })
    }
  }, [newItems])

  const handleDismiss = (item: NewStoryBanner) => {
    setVisibleItems(prev => prev.filter(i => i.id !== item.id))
    onDismiss(item.id)
    
    track('feed_interaction', { 
      action: 'banner_dismissed',
      itemId: item.id, 
      type: item.type,
      storyId: item.story_id 
    })
  }

  const handleViewStory = (item: NewStoryBanner) => {
    onViewStory(item.story_id)
    handleDismiss(item)
    
    track('feed_interaction', { 
      action: 'banner_clicked',
      itemId: item.id, 
      type: item.type,
      storyId: item.story_id 
    })
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'story':
        return <Sparkles className="w-4 h-4 text-primary" />
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />
      case 'reaction':
        return <Heart className="w-4 h-4 text-red-500" />
      default:
        return <Sparkles className="w-4 h-4 text-primary" />
    }
  }

  const getItemText = (item: NewStoryBanner) => {
    switch (item.type) {
      case 'story':
        return `shared "${item.title}"`
      case 'comment':
        return `commented on "${item.title}"`
      case 'reaction':
        return `reacted to "${item.title}"`
      default:
        return `updated "${item.title}"`
    }
  }

  if (visibleItems.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-2 mb-4', className)}>
      {visibleItems.map((item, index) => (
        <Card 
          key={item.id} 
          className={cn(
            "border-2 border-primary/50 shadow-lg animate-in slide-in-from-top-2 duration-500",
            "bg-gradient-to-r from-primary/5 to-primary/10"
          )}
          style={{ 
            animationDelay: `${index * 100}ms`,
            animationFillMode: 'both'
          }}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              {/* New badge with animation */}
              <div className="relative">
                <Badge 
                  variant="default" 
                  className="bg-primary text-primary-foreground font-semibold animate-pulse"
                >
                  NEW
                </Badge>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
              </div>

              {/* Author avatar */}
              <Avatar className="h-8 w-8 border-2 border-primary/30">
                <AvatarImage src={item.author_avatar} alt={item.author_name} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                  {item.author_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {getItemIcon(item.type)}
                  <p className="text-sm font-medium text-foreground truncate">
                    <span className="text-primary font-semibold">{item.author_name}</span>{' '}
                    {getItemText(item)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{item.time_ago}</p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewStory(item)}
                  className="h-8 px-3 bg-primary/10 hover:bg-primary/20 text-primary font-medium"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss(item)}
                  className="h-8 w-8 p-0 hover:bg-muted"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}