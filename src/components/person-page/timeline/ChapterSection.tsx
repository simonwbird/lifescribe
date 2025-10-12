import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Droppable, Draggable } from '@hello-pangea/dnd'
import { 
  ChevronDown, 
  ChevronRight, 
  Calendar, 
  Image, 
  FileText, 
  MessageSquare,
  Pin,
  Pencil,
  Check,
  X
} from 'lucide-react'
import { format } from 'date-fns'
import { TimelineItemExtended } from '@/hooks/usePersonTimeline'
import { cn } from '@/lib/utils'

interface Chapter {
  id: string
  title: string
  description?: string
  startYear?: number
  endYear?: number
  order: number
}

interface ChapterSectionProps {
  chapter: Chapter
  items: TimelineItemExtended[]
  canEdit: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onRename: (newTitle: string) => void
  onItemClick: (item: TimelineItemExtended) => void
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
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(chapter.title)

  const handleSaveTitle = () => {
    if (editedTitle.trim() && editedTitle !== chapter.title) {
      onRename(editedTitle.trim())
    }
    setIsEditingTitle(false)
  }

  const handleCancelEdit = () => {
    setEditedTitle(chapter.title)
    setIsEditingTitle(false)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'story':
        return <FileText className="h-4 w-4" />
      case 'answer':
        return <MessageSquare className="h-4 w-4" />
      case 'media':
        return <Image className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const yearRange = chapter.startYear && chapter.endYear 
    ? `${chapter.startYear}–${chapter.endYear}`
    : null

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpand()
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            {isEditingTitle ? (
              <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle()
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                  className="h-8"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleSaveTitle}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleCancelEdit}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold">{chapter.title}</h3>
                {yearRange && (
                  <Badge variant="secondary" className="ml-2">
                    {yearRange}
                  </Badge>
                )}
                {canEdit && chapter.id !== 'unorganized' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsEditingTitle(true)
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </>
            )}
          </div>

          <Badge variant="outline">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </Badge>
        </div>
      </CardHeader>

      {isExpanded && (
        <Droppable droppableId={chapter.id}>
          {(provided, snapshot) => (
            <CardContent
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                "space-y-2 min-h-[100px]",
                snapshot.isDraggingOver && "bg-primary/5"
              )}
            >
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {canEdit ? "Drag items here to organize" : "No items in this chapter"}
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
                        className={cn(
                          "group relative p-4 rounded-lg border bg-card hover:bg-muted/50 transition-all cursor-pointer",
                          snapshot.isDragging && "shadow-lg opacity-90"
                        )}
                        onClick={() => onItemClick(item)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-muted-foreground mt-1">
                            {getTypeIcon(item.item_type)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-medium line-clamp-1">{item.title}</h4>
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onPinToggle(item.item_id, item.item_type, item.is_pinned)
                                  }}
                                >
                                  <Pin className={cn(
                                    "h-3 w-3",
                                    item.is_pinned && "fill-primary"
                                  )} />
                                </Button>
                              )}
                            </div>

                            {item.excerpt && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {item.excerpt}
                              </p>
                            )}

                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              {item.happened_on && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(item.happened_on), 'MMM d, yyyy')}
                                </div>
                              )}
                              {item.tags && item.tags.length > 0 && (
                                <div className="flex gap-1">
                                  {item.tags.slice(0, 2).map((tag, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs h-5">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </CardContent>
          )}
        </Droppable>
      )}
    </Card>
  )
}
