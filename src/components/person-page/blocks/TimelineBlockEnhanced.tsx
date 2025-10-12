import React, { useState, useMemo, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus,
  Filter,
  Sparkles,
  Layers,
  Volume2
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useNavigate } from 'react-router-dom'
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd'
import { PinnedHighlightCard } from './timeline/PinnedHighlightCard'
import { ChapterSection } from './timeline/ChapterSection'
import { AudioTimelineTile } from './timeline/AudioTimelineTile'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface TimelineBlockEnhancedProps {
  personId: string
  familyId: string
  canEdit: boolean
}

interface Chapter {
  id: string
  title: string
  description?: string
  startYear?: number
  endYear?: number
  order: number
}

export default function TimelineBlockEnhanced({ 
  personId, 
  familyId, 
  canEdit 
}: TimelineBlockEnhancedProps) {
  const { items, isLoading, filters, setFilters, togglePin } = usePersonTimeline(personId, familyId)
  const navigate = useNavigate()
  
  // Fetch audio recordings for this person
  const [audioRecordings, setAudioRecordings] = React.useState<any[]>([])
  
  React.useEffect(() => {
    const loadAudioRecordings = async () => {
      const { data, error } = await supabase
        .from('audio_recordings')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_draft', false)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        // Filter for this person by checking draft_data
        const personRecordings = data.filter(rec => {
          const draftData = rec.draft_data as any
          return draftData?.person_id === personId
        })
        setAudioRecordings(personRecordings)
      }
    }
    
    loadAudioRecordings()
    
    // Subscribe to changes
    const channel = supabase
      .channel('audio-changes')
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'audio_recordings'
        },
        () => loadAudioRecordings()
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [personId, familyId])
  
  // Chapter management
  const [chapters, setChapters] = useState<Chapter[]>([
    { id: 'unorganized', title: 'Unorganized', order: 999 }
  ])
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set(['unorganized'])
  )
  const [itemChapters, setItemChapters] = useState<Record<string, string>>({})
  const [showChapterDialog, setShowChapterDialog] = useState(false)
  const [newChapterTitle, setNewChapterTitle] = useState('')
  const [isLoadingChapters, setIsLoadingChapters] = useState(true)

  // Load chapters from database
  useEffect(() => {
    const loadChapters = async () => {
      try {
        const { data: dbChapters, error } = await supabase
          .from('timeline_chapters' as any)
          .select('*')
          .eq('person_id', personId)
          .order('display_order')

        if (error) throw error

        if (dbChapters && dbChapters.length > 0) {
          const loadedChapters: Chapter[] = (dbChapters as any[]).map((ch: any) => ({
            id: ch.id,
            title: ch.title,
            description: ch.description || undefined,
            startYear: ch.start_year || undefined,
            endYear: ch.end_year || undefined,
            order: ch.display_order
          }))

          setChapters([
            ...loadedChapters,
            { id: 'unorganized', title: 'Unorganized', order: 999 }
          ])

          // Load chapter assignments
          const { data: assignments } = await supabase
            .from('timeline_chapter_assignments' as any)
            .select('*')
            .eq('person_id', personId)

          if (assignments) {
            const assignmentMap: Record<string, string> = {}
            ;(assignments as any[]).forEach((a: any) => {
              assignmentMap[`${a.item_type}-${a.item_id}`] = a.chapter_id
            })
            setItemChapters(assignmentMap)
          }
        }
      } catch (error) {
        console.error('Error loading chapters:', error)
      } finally {
        setIsLoadingChapters(false)
      }
    }

    loadChapters()
  }, [personId])

  // Get pinned items (max 5)
  const pinnedItems = useMemo(() => 
    items.filter(item => item.is_pinned).slice(0, 5),
    [items]
  )

  // Get unpinned items
  const unpinnedItems = useMemo(() =>
    items.filter(item => !item.is_pinned),
    [items]
  )

  // Organize items by chapter
  const itemsByChapter = useMemo(() => {
    const organized: Record<string, typeof items> = {}
    chapters.forEach(chapter => {
      organized[chapter.id] = []
    })

    unpinnedItems.forEach(item => {
      const chapterId = itemChapters[`${item.item_type}-${item.item_id}`] || 'unorganized'
      if (organized[chapterId]) {
        organized[chapterId].push(item)
      } else {
        organized['unorganized'].push(item)
      }
    })

    return organized
  }, [unpinnedItems, chapters, itemChapters])

  // Auto-suggest chapters based on dates
  const suggestChapters = () => {
    const itemsWithDates = unpinnedItems.filter(item => item.happened_on)
    if (itemsWithDates.length === 0) {
      toast({
        title: 'No dates found',
        description: 'Add dates to timeline items to auto-suggest chapters',
      })
      return
    }

    const years = itemsWithDates
      .map(item => new Date(item.happened_on!).getFullYear())
      .sort((a, b) => a - b)

    const minYear = years[0]
    const maxYear = years[years.length - 1]
    const range = maxYear - minYear

    const suggested: Chapter[] = []
    
    if (range <= 20) {
      // Single chapter for short life span
      suggested.push({
        id: `chapter-${Date.now()}`,
        title: 'Life Journey',
        startYear: minYear,
        endYear: maxYear,
        order: 0
      })
    } else {
      // Break into life phases
      const phases = [
        { title: 'Early Years', endAge: 20 },
        { title: 'Young Adult', endAge: 35 },
        { title: 'Mid Life', endAge: 55 },
        { title: 'Later Years', endAge: 999 }
      ]

      let currentStart = minYear
      phases.forEach((phase, idx) => {
        const endYear = Math.min(minYear + phase.endAge, maxYear)
        if (currentStart <= maxYear) {
          suggested.push({
            id: `chapter-${Date.now()}-${idx}`,
            title: phase.title,
            startYear: currentStart,
            endYear: endYear === maxYear ? maxYear : endYear,
            order: idx
          })
          currentStart = endYear + 1
        }
      })
    }

    setChapters(prev => [
      ...suggested,
      ...prev.filter(c => c.id === 'unorganized')
    ])

    // Auto-assign items to chapters
    const newAssignments: Record<string, string> = {}
    itemsWithDates.forEach(item => {
      const itemYear = new Date(item.happened_on!).getFullYear()
      const chapter = suggested.find(c => 
        itemYear >= (c.startYear || 0) && itemYear <= (c.endYear || 9999)
      )
      if (chapter) {
        newAssignments[`${item.item_type}-${item.item_id}`] = chapter.id
      }
    })
    setItemChapters(prev => ({ ...prev, ...newAssignments }))

    toast({
      title: 'Chapters created',
      description: `Created ${suggested.length} chapters and organized ${Object.keys(newAssignments).length} items`,
    })
  }

  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) return

    try {
      const order = chapters.length - 1 // Before "Unorganized"
      
      const { data, error } = await supabase
        .from('timeline_chapters' as any)
        .insert({
          person_id: personId,
          family_id: familyId,
          title: newChapterTitle.trim(),
          display_order: order,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single() as any

      if (error) throw error

      const newChapter: Chapter = {
        id: data.id,
        title: data.title,
        order: data.display_order
      }

      setChapters(prev => {
        const sorted = [...prev.filter(c => c.id !== 'unorganized'), newChapter]
          .sort((a, b) => a.order - b.order)
        return [...sorted, prev.find(c => c.id === 'unorganized')!]
      })

      setExpandedChapters(prev => new Set([...prev, newChapter.id]))
      setNewChapterTitle('')
      setShowChapterDialog(false)

      toast({
        title: 'Chapter added',
        description: `"${newChapter.title}" chapter created`
      })
    } catch (error) {
      console.error('Error adding chapter:', error)
      toast({
        title: 'Error',
        description: 'Failed to create chapter',
        variant: 'destructive'
      })
    }
  }

  const handleRenameChapter = async (chapterId: string, newTitle: string) => {
    if (chapterId === 'unorganized') return

    try {
      const { error } = await supabase
        .from('timeline_chapters' as any)
        .update({ title: newTitle })
        .eq('id', chapterId)

      if (error) throw error

      setChapters(prev => prev.map(c =>
        c.id === chapterId ? { ...c, title: newTitle } : c
      ))

      toast({
        title: 'Chapter renamed',
        description: `Chapter renamed to "${newTitle}"`
      })
    } catch (error) {
      console.error('Error renaming chapter:', error)
      toast({
        title: 'Error',
        description: 'Failed to rename chapter',
        variant: 'destructive'
      })
    }
  }

  const toggleChapterExpand = (chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev)
      if (next.has(chapterId)) {
        next.delete(chapterId)
      } else {
        next.add(chapterId)
      }
      return next
    })
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result

    // Moving between chapters
    if (source.droppableId !== destination.droppableId) {
      const [itemType, itemId] = draggableId.split('-')
      
      try {
        // Delete old assignment if exists
        await supabase
          .from('timeline_chapter_assignments' as any)
          .delete()
          .eq('person_id', personId)
          .eq('item_id', itemId)
          .eq('item_type', itemType)

        // Create new assignment if not moving to unorganized
        if (destination.droppableId !== 'unorganized') {
          const { error } = await supabase
            .from('timeline_chapter_assignments' as any)
            .insert({
              person_id: personId,
              chapter_id: destination.droppableId,
              item_id: itemId,
              item_type: itemType
            })

          if (error) throw error
        }

        setItemChapters(prev => ({
          ...prev,
          [draggableId]: destination.droppableId
        }))

        toast({
          title: 'Item moved',
          description: 'Timeline item moved to new chapter'
        })
      } catch (error) {
        console.error('Error moving item:', error)
        toast({
          title: 'Error',
          description: 'Failed to move item',
          variant: 'destructive'
        })
      }
    }
  }

  const handleItemClick = (item: typeof items[0]) => {
    if (item.item_type === 'story') {
      navigate(`/stories/${item.item_id}`)
    } else if (item.item_type === 'answer') {
      navigate(`/memories/${item.item_id}`)
    } else if (item.item_type === 'media') {
      navigate(`/media/${item.item_id}`)
    }
  }

  const availableTags = Array.from(new Set(items.flatMap(item => item.tags || [])))

  if (isLoading || isLoadingChapters) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
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

        <div className="flex items-center gap-2">
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

          {canEdit && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={suggestChapters}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Auto-organize
              </Button>

              <Dialog open={showChapterDialog} onOpenChange={setShowChapterDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Chapter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Chapter</DialogTitle>
                    <DialogDescription>
                      Add a chapter to organize your timeline
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="chapter-title">Chapter Title</Label>
                      <Input
                        id="chapter-title"
                        placeholder="e.g., Early Years, Career, Family Life"
                        value={newChapterTitle}
                        onChange={(e) => setNewChapterTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddChapter()
                        }}
                      />
                    </div>
                    <Button onClick={handleAddChapter} className="w-full">
                      Create Chapter
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Pinned Highlights */}
      {pinnedItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Highlights</h3>
            <Badge variant="secondary">{pinnedItems.length}/5</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedItems.map(item => (
              <PinnedHighlightCard
                key={`${item.item_type}-${item.item_id}`}
                item={item}
                canEdit={canEdit}
                onUnpin={() => togglePin(item.item_id, item.item_type, true)}
                onClick={() => handleItemClick(item)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Voice Notes */}
      {audioRecordings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Voice Notes</h3>
            <Badge variant="secondary">{audioRecordings.length}</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {audioRecordings.map(recording => (
              <AudioTimelineTile
                key={recording.id}
                recording={recording}
                onClick={() => {
                  // Could open a modal or navigate to audio details
                  console.log('Audio clicked:', recording.id)
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Chapters */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-4">
          {chapters.map(chapter => (
            <ChapterSection
              key={chapter.id}
              chapter={chapter}
              items={itemsByChapter[chapter.id] || []}
              canEdit={canEdit}
              isExpanded={expandedChapters.has(chapter.id)}
              onToggleExpand={() => toggleChapterExpand(chapter.id)}
              onRename={(newTitle) => handleRenameChapter(chapter.id, newTitle)}
              onItemClick={handleItemClick}
              onPinToggle={togglePin}
            />
          ))}
        </div>
      </DragDropContext>

      {/* Summary footer */}
      {items.length > 0 && (
        <div className="text-center text-sm text-muted-foreground pt-4 border-t">
          {items.length} {items.length === 1 ? 'item' : 'items'} total
          {pinnedItems.length > 0 && (
            <span className="ml-2">• {pinnedItems.length} pinned</span>
          )}
          {chapters.length > 1 && (
            <span className="ml-2">• {chapters.length - 1} {chapters.length === 2 ? 'chapter' : 'chapters'}</span>
          )}
        </div>
      )}
    </div>
  )
}
