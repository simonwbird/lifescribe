import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Pin, 
  MessageSquare, 
  Image as ImageIcon, 
  Clock,
  Eye,
  EyeOff
} from 'lucide-react'
import { formatWhen } from '@/lib/timelineBuckets'

interface TimelineItem {
  item_id: string
  item_type: string
  title: string
  excerpt?: string
  happened_on?: string
  occurred_precision?: string
  is_approx?: boolean
  media_url?: string
  tags?: string[]
  visibility?: string
}

interface PinnedHighlightCardProps {
  item: TimelineItem
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
  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'story': return <MessageSquare className="h-5 w-5" />
      case 'media': return <ImageIcon className="h-5 w-5" />
      case 'answer': return <Clock className="h-5 w-5" />
      default: return <Clock className="h-5 w-5" />
    }
  }

  const getVisibilityIcon = (visibility?: string) => {
    if (visibility === 'only_me' || visibility === 'inner_circle') {
      return <EyeOff className="h-4 w-4" />
    }
    return <Eye className="h-4 w-4" />
  }

  return (
    <Card 
      className="group relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
    >
      {/* Pinned indicator ribbon */}
      <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
        <div className="absolute top-3 right-[-32px] w-24 text-center bg-primary text-primary-foreground text-xs font-semibold py-1 rotate-45 shadow-md">
          PINNED
        </div>
      </div>

      <CardContent className="p-6">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {getItemIcon(item.item_type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 
                  className="text-xl font-semibold cursor-pointer hover:text-primary transition-colors line-clamp-2"
                  onClick={onClick}
                >
                  {item.title}
                </h3>
                {item.happened_on && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatWhen({
                      item_id: item.item_id,
                      item_type: item.item_type as 'story' | 'answer',
                      happened_on: item.happened_on,
                      occurred_precision: item.occurred_precision as any,
                      is_approx: item.is_approx,
                      title: item.title
                    })}
                  </p>
                )}
              </div>
            </div>

            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-primary"
                onClick={onUnpin}
                title="Unpin this highlight"
              >
                <Pin className="h-4 w-4 fill-current" />
              </Button>
            )}
          </div>

          {/* Media preview (large) */}
          {item.media_url && (
            <div className="mb-4 rounded-lg overflow-hidden cursor-pointer" onClick={onClick}>
              <img
                src={item.media_url}
                alt={item.title}
                className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}

          {/* Excerpt */}
          {item.excerpt && (
            <p className="text-base text-foreground/80 line-clamp-4 mb-4">
              {item.excerpt}
            </p>
          )}

          {/* Tags and visibility */}
          <div className="flex items-center gap-2 flex-wrap mt-auto">
            {item.visibility && (
              <Badge variant="outline" className="gap-1">
                {getVisibilityIcon(item.visibility)}
                <span className="text-xs capitalize">{item.visibility.replace('_', ' ')}</span>
              </Badge>
            )}
            
            {item.tags?.map(tag => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
