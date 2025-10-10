import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  GripVertical,
  Edit2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Image as ImageIcon,
  Clock
} from 'lucide-react'
import { Draggable, Droppable } from '@hello-pangea/dnd'
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
  is_pinned?: boolean
}

interface ChapterSectionProps {
  chapter: {
    id: string
    title: string
    description?: string
    startYear?: number
    endYear?: number
  }
  items: TimelineItem[]
  canEdit: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onRename: (newTitle: string) => void
  onItemClick: (item: TimelineItem) => void
  onPinToggle: (itemId: string, itemType: string, isPinned: boolean) => void
}

export function ChapterSection({
  chapter,
  items,
  canEdit,
  isExpanded,
  onToggleExpand,
  onRename,
  onItemClick,
  onPinToggle
}: ChapterSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(chapter.title)

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      onRename(editTitle.trim())
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditTitle(chapter.title)
    setIsEditing(false)
  }

  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'story': return <MessageSquare className="h-4 w-4" />
      case 'media': return <ImageIcon className="h-4 w-4" />
      case 'answer': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const yearRange = chapter.startYear && chapter.endYear
    ? `${chapter.startYear}–${chapter.endYear}`
    : chapter.startYear
    ? `${chapter.startYear}+`
    : null

  return (
    <Card className="border-l-4 border-l-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {canEdit && (
              <div className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            
            <div className="flex-1">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-8"
                    placeholder="Chapter title"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle()
                      if (e.key === 'Escape') handleCancelEdit()
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={handleSaveTitle}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{chapter.title}</CardTitle>
                  {yearRange && (
                    <Badge variant="outline" className="text-xs">
                      {yearRange}
                    </Badge>
                  )}
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
              {chapter.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {chapter.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onToggleExpand}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <Droppable droppableId={chapter.id} type="timeline-item">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-2 min-h-[100px] rounded-lg p-2 transition-colors ${
                  snapshot.isDraggingOver ? 'bg-primary/5 border-2 border-dashed border-primary' : ''
                }`}
              >
                {items.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Drag items here to add to this chapter
                  </div>
                ) : (
                  items.map((item, index) => (
                    <Draggable
                      key={`${item.item_type}-${item.item_id}`}
                      draggableId={`${item.item_type}-${item.item_id}`}
                      index={index}
                      isDragDisabled={!canEdit}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`${snapshot.isDragging ? 'opacity-50' : ''}`}
                        >
                          <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-3">
                              <div className="flex items-start gap-2">
                                <div className="mt-1">
                                  {getItemIcon(item.item_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 
                                    className="font-medium text-sm cursor-pointer hover:text-primary transition-colors line-clamp-1"
                                    onClick={() => onItemClick(item)}
                                  >
                                    {item.title}
                                  </h4>
                                  {item.happened_on && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
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
                                  {item.tags && item.tags.length > 0 && (
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                      {item.tags.map(tag => (
                                        <Badge key={tag} variant="secondary" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </CardContent>
      )}
    </Card>
  )
}
