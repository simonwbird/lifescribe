import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertTriangle, Settings, Plus, ArrowLeft } from 'lucide-react'
import Header from '@/components/Header'
import PersonPageBlock from '@/components/person-page/PersonPageBlock'
import BlockLibraryDialog from '@/components/person-page/BlockLibraryDialog'
import { usePersonPageData } from '@/hooks/usePersonPageData'
import { PersonPageBlock as BlockData } from '@/types/personPage'
import { toast } from '@/components/ui/use-toast'

export default function PersonPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showBlockLibrary, setShowBlockLibrary] = useState(false)
  
  const {
    data,
    loading,
    error,
    updateBlockOrder,
    updateBlockVisibility,
    addBlock,
    removeBlock
  } = usePersonPageData(id!, currentUserId)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    fetchUser()
  }, [])

  const canEdit = data?.permission?.role && 
    ['owner', 'co_curator', 'steward'].includes(data.permission.role)

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !data) return

    const blocks = Array.from(data.blocks)
    const [removed] = blocks.splice(result.source.index, 1)
    blocks.splice(result.destination.index, 0, removed)

    try {
      await updateBlockOrder(blocks)
      toast({
        title: 'Order updated',
        description: 'Block order has been saved'
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update block order',
        variant: 'destructive'
      })
    }
  }

  const handleAddBlock = async (type: BlockData['type']) => {
    try {
      await addBlock(type)
      setShowBlockLibrary(false)
      toast({
        title: 'Block added',
        description: `${type} block has been added`
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to add block',
        variant: 'destructive'
      })
    }
  }

  const handleVisibilityChange = async (blockId: string, visibility: BlockData['visibility']) => {
    try {
      await updateBlockVisibility(blockId, visibility)
      toast({
        title: 'Visibility updated',
        description: 'Block visibility has been changed'
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update visibility',
        variant: 'destructive'
      })
    }
  }

  const handleRemoveBlock = async (blockId: string) => {
    try {
      await removeBlock(blockId)
      toast({
        title: 'Block removed',
        description: 'Block has been hidden from the page'
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to remove block',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Page not found'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const { person, blocks } = data
  const isLiving = person.status === 'living'

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/people')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to People
          </Button>
          
          {canEdit && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowBlockLibrary(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Block
              </Button>
              <Button 
                variant="outline" 
                size="sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Customize
              </Button>
            </div>
          )}
        </div>

        {/* Person Header */}
        <div className="flex items-start gap-6 p-6 rounded-lg border bg-card">
          <Avatar className="h-24 w-24">
            <AvatarImage src={person.avatar_url || ''} alt={person.full_name} />
            <AvatarFallback className="text-2xl">
              {person.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'P'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{person.full_name}</h1>
              <Badge variant={isLiving ? 'default' : 'secondary'}>
                {isLiving ? 'Living' : 'In Tribute'}
              </Badge>
            </div>
            
            {person.preferred_name && person.preferred_name !== person.full_name && (
              <p className="text-muted-foreground">
                Known as {person.preferred_name}
              </p>
            )}
            
            {person.pronouns && (
              <p className="text-sm text-muted-foreground mt-1">
                {person.pronouns}
              </p>
            )}
          </div>
        </div>

        {/* Blocks */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="blocks">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {blocks.map((block, index) => (
                  <Draggable 
                    key={block.id} 
                    draggableId={block.id} 
                    index={index}
                    isDragDisabled={!canEdit}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={snapshot.isDragging ? 'opacity-50' : ''}
                      >
                        <PersonPageBlock
                          block={block}
                          canEdit={!!canEdit}
                          onVisibilityChange={(visibility) => 
                            handleVisibilityChange(block.id, visibility)
                          }
                          onRemove={() => handleRemoveBlock(block.id)}
                          dragHandleProps={provided.dragHandleProps}
                        >
                          <div className="text-muted-foreground">
                            Block content for {block.type} will be rendered here
                          </div>
                        </PersonPageBlock>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                
                {blocks.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground mb-4">
                      No blocks added yet
                    </p>
                    {canEdit && (
                      <Button onClick={() => setShowBlockLibrary(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Block
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <BlockLibraryDialog
          open={showBlockLibrary}
          onOpenChange={setShowBlockLibrary}
          onAddBlock={handleAddBlock}
          existingBlocks={blocks.map(b => b.type)}
        />
      </div>
    </div>
  )
}