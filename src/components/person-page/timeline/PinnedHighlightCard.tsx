import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pin, Calendar, Image, FileText, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { TimelineItemExtended } from '@/hooks/usePersonTimeline'
import { cn } from '@/lib/utils'

interface PinnedHighlightCardProps {
  item: TimelineItemExtended
  canEdit: boolean
  onUnpin: () => void
  onClick: () => void
}

export function PinnedHighlightCard({
  item,
  canEdit,
  onUnpin,
  onClick
}: PinnedHighlightCardProps) {
  const getTypeIcon = () => {
    switch (item.item_type) {
      case 'story':
        return <FileText className="h-5 w-5" />
      case 'answer':
        return <MessageSquare className="h-5 w-5" />
      case 'media':
        return <Image className="h-5 w-5" />
      default:
        return <Calendar className="h-5 w-5" />
    }
  }

  const getTypeBadge = () => {
    switch (item.item_type) {
      case 'story':
        return 'Story'
      case 'answer':
        return 'Memory'
      case 'media':
        return 'Photo'
      default:
        return 'Event'
    }
  }

  return (
    <Card 
      className={cn(
        "group relative cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1",
        "border-2 border-primary/20 bg-gradient-to-br from-background to-muted/20"
      )}
      onClick={onClick}
    >
      {canEdit && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            onUnpin()
          }}
        >
          <Pin className="h-4 w-4 fill-primary" />
        </Button>
      )}

      <CardContent className="p-6 space-y-4">
        {/* Type indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            {getTypeIcon()}
            <Badge variant="secondary">{getTypeBadge()}</Badge>
          </div>
          {item.happened_on && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(item.happened_on), 'MMM d, yyyy')}
            </div>
          )}
        </div>

        {/* Media preview if available */}
        {item.media_url && item.item_type === 'media' && (
          <div className="relative aspect-video rounded-md overflow-hidden bg-muted">
            <img
              src={item.media_url}
              alt={item.title}
              className="object-cover w-full h-full"
            />
          </div>
        )}

        {/* Title */}
        <h4 className="text-lg font-semibold leading-tight line-clamp-2">
          {item.title}
        </h4>

        {/* Excerpt */}
        {item.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {item.excerpt}
          </p>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{item.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
