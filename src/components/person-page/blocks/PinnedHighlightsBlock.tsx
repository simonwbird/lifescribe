import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Pin, Edit, GripVertical, Image as ImageIcon, 
  FileText, Calendar, X
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface PinnedItem {
  id: string
  type: 'story' | 'photo' | 'timeline'
  title: string
  thumbnail_url?: string
  date?: string
  order_index: number
}

interface PinnedHighlightsBlockProps {
  personId: string
  familyId: string
  blockContent: {
    pinned_items?: PinnedItem[]
  }
  canEdit: boolean
  onUpdate?: () => void
}

export default function PinnedHighlightsBlock({
  personId,
  familyId,
  blockContent,
  canEdit,
  onUpdate
}: PinnedHighlightsBlockProps) {
  const [items, setItems] = useState<PinnedItem[]>(blockContent.pinned_items || [])
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (blockContent.pinned_items) {
      setItems(blockContent.pinned_items)
    }
  }, [blockContent.pinned_items])

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !canEdit) return

    const reordered = Array.from(items)
    const [removed] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, removed)

    // Update order_index
    const updatedItems = reordered.map((item, index) => ({
      ...item,
      order_index: index
    }))

    setItems(updatedItems)

    try {
      await saveItems(updatedItems)
      toast({
        title: 'Order updated',
        description: 'Pinned highlights have been reordered'
      })
    } catch (error) {
      console.error('Error updating order:', error)
      toast({
        title: 'Error',
        description: 'Failed to update order',
        variant: 'destructive'
      })
      // Revert on error
      setItems(items)
    }
  }

  const saveItems = async (updatedItems: PinnedItem[]) => {
    const { error } = await supabase
      .from('person_page_blocks')
      .update({
        content_json: { pinned_items: updatedItems } as any,
        updated_at: new Date().toISOString()
      })
      .eq('person_id', personId)
      .eq('type', 'pinned_highlights')

    if (error) throw error
    onUpdate?.()
  }

  const handleRemoveItem = async (itemId: string) => {
    const updatedItems = items.filter(item => item.id !== itemId)
    setItems(updatedItems)

    try {
      await saveItems(updatedItems)
      toast({
        title: 'Item removed',
        description: 'Highlight has been unpinned'
      })
    } catch (error) {
      console.error('Error removing item:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove item',
        variant: 'destructive'
      })
      setItems(items)
    }
  }

  const handleItemClick = (item: PinnedItem) => {
    if (isEditing) return

    switch (item.type) {
      case 'story':
        navigate(`/stories/${item.id}`)
        break
      case 'photo':
        // Navigate to photo/media page when implemented
        toast({
          title: 'Coming soon',
          description: 'Photo detail pages are not yet implemented'
        })
        break
      case 'timeline':
        // Navigate to timeline entry when implemented
        toast({
          title: 'Coming soon',
          description: 'Timeline detail pages are not yet implemented'
        })
        break
    }
  }

  const getItemIcon = (type: PinnedItem['type']) => {
    switch (type) {
      case 'story':
        return FileText
      case 'photo':
        return ImageIcon
      case 'timeline':
        return Calendar
    }
  }

  const getItemBadgeVariant = (type: PinnedItem['type']) => {
    switch (type) {
      case 'story':
        return 'default'
      case 'photo':
        return 'secondary'
      case 'timeline':
        return 'outline'
    }
  }

  if (items.length === 0 && !canEdit) {
    return null
  }

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Pin className="h-4 w-4" />
            Pinned Highlights
          </CardTitle>
          {canEdit && (
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-6 px-4">
            <p className="text-sm text-muted-foreground mb-3">
              Pin your favorite moments to keep them at the top
            </p>
            {canEdit && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onUpdate}
              >
                <Pin className="h-4 w-4 mr-2" />
                Pin Highlights
              </Button>
            )}
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="pinned-highlights">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {items.map((item, index) => {
                    const ItemIcon = getItemIcon(item.type)
                    
                    return (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={index}
                        isDragDisabled={!canEdit || !isEditing}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "group relative flex items-center gap-3 p-2 rounded-lg border border-border/50 bg-card/50 transition-all",
                              !isEditing && "hover:bg-accent cursor-pointer",
                              snapshot.isDragging && "shadow-lg bg-card"
                            )}
                            onClick={() => handleItemClick(item)}
                          >
                            {/* Drag Handle */}
                            {canEdit && isEditing && (
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>
                            )}

                            {/* Thumbnail or Icon */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                              {item.thumbnail_url ? (
                                <img 
                                  src={item.thumbnail_url} 
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ItemIcon className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {item.title}
                              </p>
                              {item.date && (
                                <p className="text-xs text-muted-foreground">
                                  {new Date(item.date).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    year: 'numeric' 
                                  })}
                                </p>
                              )}
                            </div>

                            {/* Type Badge */}
                            <Badge 
                              variant={getItemBadgeVariant(item.type)}
                              className="text-xs capitalize"
                            >
                              {item.type}
                            </Badge>

                            {/* Remove Button */}
                            {canEdit && isEditing && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemoveItem(item.id)
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </Draggable>
                    )
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {/* Add more button */}
        {canEdit && items.length > 0 && items.length < 5 && (
          <Button 
            variant="outline" 
            size="sm"
            className="w-full mt-3"
            onClick={onUpdate}
          >
            <Pin className="h-4 w-4 mr-2" />
            Add Highlight ({items.length}/5)
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
