import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { TimelineToolbar } from '@/components/TimelineToolbar'
import { TimelineCanvas } from '@/components/TimelineCanvas'
import { InlineComposer } from '@/components/InlineComposer'
import { LinkExistingDialog } from '@/components/LinkExistingDialog'
import { TimelineItem, ZoomLevel } from '@/lib/timelineBuckets'

interface Person {
  id: string
  full_name: string
  avatar_url: string | null
  family_id: string
}

export function PersonTimeline() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [person, setPerson] = useState<Person | null>(null)
  const [items, setItems] = useState<TimelineItem[]>([])
  const [zoom, setZoom] = useState<ZoomLevel>('year')
  const [filters, setFilters] = useState({
    stories: true,
    answers: true,
    photos: true
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showComposer, setShowComposer] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [composerDefaultDate, setComposerDefaultDate] = useState<Date | undefined>()

  useEffect(() => {
    if (id) {
      loadPersonAndTimeline()
    }
  }, [id])

  const loadPersonAndTimeline = async () => {
    setIsLoading(true)
    try {
      // Load person details
      const { data: personData, error: personError } = await supabase
        .from('people')
        .select('id, full_name, avatar_url, family_id')
        .eq('id', id)
        .single()

      if (personError || !personData) {
        throw new Error('Person not found')
      }

      setPerson(personData)

      // Load timeline items
      const { data: timelineData, error: timelineError } = await supabase
        .from('person_timeline_items')
        .select('*')
        .eq('person_id', id)
        .order('happened_on', { ascending: true })

      if (timelineError) {
        throw new Error(timelineError.message)
      }

      const timelineItems: TimelineItem[] = (timelineData || []).map(item => ({
        item_id: item.item_id,
        item_type: item.item_type as 'story' | 'answer',
        happened_on: item.happened_on,
        occurred_precision: item.occurred_precision as 'day' | 'month' | 'year' | null,
        is_approx: item.is_approx,
        title: item.title,
        excerpt: item.excerpt
      }))

      setItems(timelineItems)

    } catch (error) {
      console.error('Error loading timeline:', error)
      toast({
        title: "Failed to load timeline",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddMemory = () => {
    setComposerDefaultDate(undefined)
    setShowComposer(true)
  }

  const handleAddMemoryAt = (date: Date) => {
    setComposerDefaultDate(date)
    setShowComposer(true)
  }

  const handleItemClick = (item: TimelineItem) => {
    if (item.item_type === 'story') {
      navigate(`/story/${item.item_id}`)
    } else {
      // Navigate to answer detail or show in modal
      toast({ title: "Answer details coming soon!" })
    }
  }

  const handleSuccess = () => {
    loadPersonAndTimeline()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!person) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Person not found</h1>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          {person.avatar_url && (
            <img
              src={person.avatar_url}
              alt={person.full_name}
              className="h-10 w-10 rounded-full object-cover"
            />
          )}
          <div>
            <h1 className="text-xl font-bold">{person.full_name}</h1>
            <p className="text-sm text-muted-foreground">Timeline • {items.length} memories</p>
          </div>
        </div>
      </div>

      {/* Timeline Toolbar */}
      <TimelineToolbar
        zoom={zoom}
        onZoomChange={setZoom}
        filters={filters}
        onFilterChange={setFilters}
        onAddMemory={handleAddMemory}
        onLinkExisting={() => setShowLinkDialog(true)}
      />

      {/* Timeline Canvas */}
      <TimelineCanvas
        items={items}
        zoom={zoom}
        filters={filters}
        onAddMemoryAt={handleAddMemoryAt}
        onItemClick={handleItemClick}
      />

      {/* Inline Composer */}
      <InlineComposer
        open={showComposer}
        onOpenChange={setShowComposer}
        personId={person.id}
        familyId={person.family_id}
        defaultDate={composerDefaultDate}
        onSuccess={handleSuccess}
      />

      {/* Link Existing Dialog */}
      <LinkExistingDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        personId={person.id}
        familyId={person.family_id}
        onSuccess={handleSuccess}
      />
    </div>
  )
}