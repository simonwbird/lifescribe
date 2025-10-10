import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Pin, 
  MessageSquare, 
  Image as ImageIcon, 
  Clock,
  Filter,
  ChevronDown
} from 'lucide-react'
import { usePersonTimeline } from '@/hooks/usePersonTimeline'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNavigate } from 'react-router-dom'
import { formatWhen } from '@/lib/timelineBuckets'

interface TimelineBlockProps {
  personId: string
  familyId: string
  canEdit: boolean
}

export default function TimelineBlock({ personId, familyId, canEdit }: TimelineBlockProps) {
  const { items, isLoading, filters, setFilters, togglePin } = usePersonTimeline(personId, familyId)
  const navigate = useNavigate()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'story': return <MessageSquare className="h-4 w-4" />
      case 'media': return <ImageIcon className="h-4 w-4" />
      case 'answer': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getItemTypeLabel = (itemType: string) => {
    switch (itemType) {
      case 'story': return 'Story'
      case 'media': return 'Photo'
      case 'answer': return 'Memory'
      default: return itemType
    }
  }

  const handleItemClick = (item: typeof items[0]) => {
    if (item.item_type === 'story') {
      navigate(`/stories/${item.item_id}`)
    } else if (item.item_type === 'answer') {
      // Navigate to memory detail (if exists)
      navigate(`/memories/${item.item_id}`)
    } else if (item.item_type === 'media') {
      // Open media viewer
      navigate(`/media/${item.item_id}`)
    }
  }

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  // Get all unique tags from items
  const availableTags = Array.from(new Set(items.flatMap(item => item.tags || [])))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            variant={filters.stories ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilters(f => ({ ...f, stories: !f.stories }))}
          >
            Stories
          </Badge>
          <Badge
            variant={filters.answers ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilters(f => ({ ...f, answers: !f.answers }))}
          >
            Memories
          </Badge>
          <Badge
            variant={filters.photos ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilters(f => ({ ...f, photos: !f.photos }))}
          >
            Photos
          </Badge>
        </div>

        {availableTags.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Tags
                {filters.tags.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {filters.tags.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by tags</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableTags.map(tag => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={filters.tags.includes(tag)}
                  onCheckedChange={(checked) => {
                    setFilters(f => ({
                      ...f,
                      tags: checked 
                        ? [...f.tags, tag]
                        : f.tags.filter(t => t !== tag)
                    }))
                  }}
                >
                  {tag}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Timeline items */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No timeline items to display
            </CardContent>
          </Card>
        ) : (
          items.map(item => (
            <Card
              key={`${item.item_type}-${item.item_id}`}
              className={`relative transition-all hover:shadow-md ${
                item.is_pinned ? 'border-primary/50 bg-primary/5' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="mt-1">
                    {getItemIcon(item.item_type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 
                          className="font-medium cursor-pointer hover:text-primary transition-colors truncate"
                          onClick={() => handleItemClick(item)}
                        >
                          {item.title}
                        </h4>
                        
                        {item.excerpt && (
                          <p className={`text-sm text-muted-foreground mt-1 ${
                            expandedItems.has(item.item_id) ? '' : 'line-clamp-2'
                          }`}>
                            {item.excerpt}
                          </p>
                        )}

                        {item.excerpt && item.excerpt.length > 100 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 mt-1 text-xs"
                            onClick={() => toggleExpanded(item.item_id)}
                          >
                            {expandedItems.has(item.item_id) ? 'Show less' : 'Show more'}
                            <ChevronDown 
                              className={`h-3 w-3 ml-1 transition-transform ${
                                expandedItems.has(item.item_id) ? 'rotate-180' : ''
                              }`}
                            />
                          </Button>
                        )}

                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {getItemTypeLabel(item.item_type)}
                          </Badge>
                          
                          {item.happened_on && (
                            <span className="text-xs text-muted-foreground">
                              {formatWhen({
                                item_id: item.item_id,
                                item_type: item.item_type as 'story' | 'answer',
                                happened_on: item.happened_on,
                                occurred_precision: item.occurred_precision as any,
                                is_approx: item.is_approx,
                                title: item.title
                              })}
                            </span>
                          )}

                          {item.tags?.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Pin button */}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 w-8 p-0 ${item.is_pinned ? 'text-primary' : ''}`}
                          onClick={() => togglePin(item.item_id, item.item_type, item.is_pinned)}
                        >
                          <Pin className={`h-4 w-4 ${item.is_pinned ? 'fill-current' : ''}`} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Media preview */}
                {item.media_url && (
                  <div className="mt-3 ml-7">
                    <img
                      src={item.media_url}
                      alt={item.title}
                      className="rounded-lg max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handleItemClick(item)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary footer */}
      {items.length > 0 && (
        <div className="text-center text-sm text-muted-foreground pt-4 border-t">
          Showing {items.length} {items.length === 1 ? 'item' : 'items'}
          {items.filter(i => i.is_pinned).length > 0 && (
            <span className="ml-2">
              • {items.filter(i => i.is_pinned).length} pinned
            </span>
          )}
        </div>
      )}
    </div>
  )
}
