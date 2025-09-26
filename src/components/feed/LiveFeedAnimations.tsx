import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sparkles, Bell, X, Eye, ArrowUp, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAnalytics } from '@/hooks/useAnalytics'
import { formatForUser, getCurrentUserRegion } from '@/utils/date'

interface NewFeedItem {
  id: string
  type: 'story' | 'comment' | 'reaction'
  title: string
  author: string
  authorAvatar?: string
  time: string
  isNew: boolean
  previewContent?: string
}

interface LiveFeedAnimationsProps {
  newItems: NewFeedItem[]
  onItemClick: (item: NewFeedItem) => void
  onDismiss: (itemId: string) => void
  onViewAll: () => void
  isRealTimeEnabled: boolean
}

export function LiveFeedAnimations({
  newItems,
  onItemClick,
  onDismiss,
  onViewAll,
  isRealTimeEnabled
}: LiveFeedAnimationsProps) {
  const [visibleItems, setVisibleItems] = useState<string[]>([])
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set())
  const { track } = useAnalytics()

  // Animate new items in staggered fashion
  useEffect(() => {
    if (newItems.length === 0) {
      setVisibleItems([])
      return
    }

    const itemIds = newItems.map(item => item.id)
    
    // Clear previous items first
    setVisibleItems([])
    setAnimatingItems(new Set())
    
    // Add items with staggered animation
    itemIds.forEach((id, index) => {
      setTimeout(() => {
        setVisibleItems(prev => {
          if (!prev.includes(id)) {
            return [...prev, id]
          }
          return prev
        })
        
        // Add animation class
        setAnimatingItems(prev => new Set([...prev, id]))
        
        // Remove animation class after animation completes
        setTimeout(() => {
          setAnimatingItems(prev => {
            const newSet = new Set(prev)
            newSet.delete(id)
            return newSet
          })
        }, 600)
        
      }, index * 200) // Stagger by 200ms
    })
  }, [newItems])

  const handleItemClick = (item: NewFeedItem) => {
    track('activity_clicked', {
      itemId: item.id,
      itemType: item.type,
      author: item.author
    })
    onItemClick(item)
  }

  const handleDismiss = (itemId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    track('activity_clicked', {
      itemId,
      method: 'manual'
    })
    
    // Animate out
    setAnimatingItems(prev => new Set([...prev, itemId]))
    
    setTimeout(() => {
      onDismiss(itemId)
      setVisibleItems(prev => prev.filter(id => id !== itemId))
      setAnimatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }, 300)
  }

  if (!isRealTimeEnabled || visibleItems.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {/* Live indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <Zap className="w-4 h-4" />
            <span>Live Updates</span>
          </div>
          <Badge variant="secondary" className="text-xs animate-pulse">
            {visibleItems.length} new
          </Badge>
        </div>
        
        {visibleItems.length > 3 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onViewAll}
            className="text-xs h-7"
          >
            <Eye className="w-3 h-3 mr-1" />
            View All
          </Button>
        )}
      </div>

      {/* New items feed */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {newItems
          .filter(item => visibleItems.includes(item.id))
          .slice(0, 5) // Show max 5 items
          .map((item, index) => {
            const isAnimating = animatingItems.has(item.id)
            
            return (
              <Card
                key={item.id}
                className={cn(
                  "cursor-pointer transition-all duration-500 border-2",
                  isAnimating && "animate-slide-in-right scale-102",
                  "hover:shadow-lg hover:border-primary/50",
                  "bg-gradient-to-r from-green-50 to-blue-50 border-green-200",
                  item.type === 'story' && "border-l-4 border-l-blue-500",
                  item.type === 'comment' && "border-l-4 border-l-green-500",
                  item.type === 'reaction' && "border-l-4 border-l-yellow-500"
                )}
                onClick={() => handleItemClick(item)}
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm">
                      <AvatarImage src={item.authorAvatar} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                        {item.author.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1">
                          {item.type === 'story' && (
                            <Sparkles className="w-3 h-3 text-blue-500" />
                          )}
                          {item.type === 'comment' && (
                            <Bell className="w-3 h-3 text-green-500" />
                          )}
                          {item.type === 'reaction' && (
                            <span className="text-sm">❤️</span>
                          )}
                        </div>
                        
                        <p className="text-sm font-medium text-foreground truncate">
                          <span className="text-primary font-semibold">{item.author}</span>
                          {item.type === 'story' && " shared a new story"}
                          {item.type === 'comment' && " added a comment"}
                          {item.type === 'reaction' && " reacted to a story"}
                        </p>
                        
                        <Badge variant="secondary" className="text-xs animate-pulse ml-auto">
                          NEW
                        </Badge>
                      </div>
                      
                      <h4 className="text-sm font-medium text-foreground/90 truncate mb-1">
                        {item.title}
                      </h4>
                      
                      {item.previewContent && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {item.previewContent}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatForUser(item.time, 'relative', getCurrentUserRegion())}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleDismiss(item.id, e)}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          
                          <ArrowUp className="w-3 h-3 text-primary opacity-70" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
      </div>
      
      {/* Auto-dismiss timer for old items */}
      <div className="text-xs text-muted-foreground text-center">
        New items will auto-dismiss after 30 seconds
      </div>
    </div>
  )
}

// Auto-dismiss hook for live feed items
export function useAutoLiveFeedDismiss(
  items: NewFeedItem[],
  onDismiss: (itemId: string) => void,
  timeout: number = 30000 // 30 seconds
) {
  useEffect(() => {
    const timers = items.map(item => {
      return setTimeout(() => {
        onDismiss(item.id)
      }, timeout)
    })

    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [items, onDismiss, timeout])
}