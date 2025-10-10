import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface TimelineItemExtended {
  item_id: string
  item_type: 'story' | 'answer' | 'media' | 'event'
  happened_on: string | null
  occurred_precision?: string | null
  is_approx?: boolean | null
  title: string
  excerpt?: string | null
  media_url?: string | null
  tags?: string[]
  visibility?: string
  is_pinned: boolean
  pin_order: number
}

export interface TimelineFilters {
  stories: boolean
  answers: boolean
  photos: boolean
  tags: string[]
  mediaType: 'all' | 'photo' | 'video'
}

export function usePersonTimeline(personId: string, familyId: string) {
  const [items, setItems] = useState<TimelineItemExtended[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<TimelineFilters>({
    stories: true,
    answers: true,
    photos: true,
    tags: [],
    mediaType: 'all'
  })
  const { toast } = useToast()

  const loadTimeline = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .rpc('get_person_timeline_items', { p_person_id: personId })

      if (error) throw error

      const timelineItems: TimelineItemExtended[] = (data || []).map((item: any) => ({
        item_id: item.item_id,
        item_type: item.item_type as 'story' | 'answer' | 'media' | 'event',
        happened_on: item.happened_on,
        occurred_precision: item.occurred_precision,
        is_approx: item.is_approx,
        title: item.title,
        excerpt: item.excerpt,
        media_url: item.media_url,
        tags: item.tags || [],
        visibility: item.visibility,
        is_pinned: item.is_pinned || false,
        pin_order: item.pin_order || 0
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

  useEffect(() => {
    loadTimeline()

    // Real-time subscription for timeline updates
    const channel = supabase
      .channel('timeline-changes')
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'stories'
        },
        () => loadTimeline()
      )
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'answers'
        },
        () => loadTimeline()
      )
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'media'
        },
        () => loadTimeline()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [personId])

  const togglePin = async (itemId: string, itemType: string, isPinned: boolean) => {
    try {
      if (isPinned) {
        // Unpin
        const { error } = await supabase
          .from('timeline_pins' as any)
          .delete()
          .eq('person_id', personId)
          .eq('item_id', itemId)
          .eq('item_type', itemType)

        if (error) throw error
      } else {
        // Pin
        const user = await supabase.auth.getUser()
        const { error } = await supabase
          .from('timeline_pins' as any)
          .insert({
            person_id: personId,
            family_id: familyId,
            item_id: itemId,
            item_type: itemType,
            pinned_by: user.data.user?.id
          })

        if (error) throw error
      }

      toast({
        title: isPinned ? "Item unpinned" : "Item pinned",
        description: isPinned ? "Removed from pinned items" : "Added to pinned items"
      })

      await loadTimeline()
    } catch (error) {
      console.error('Error toggling pin:', error)
      toast({
        title: "Failed to update pin",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      })
    }
  }

  const filteredItems = items.filter(item => {
    // Type filters
    if (item.item_type === 'story' && !filters.stories) return false
    if (item.item_type === 'answer' && !filters.answers) return false
    if (item.item_type === 'media' && !filters.photos) return false

    // Tag filters
    if (filters.tags.length > 0 && item.tags) {
      const hasMatchingTag = filters.tags.some(tag => item.tags?.includes(tag))
      if (!hasMatchingTag) return false
    }

    // Media type filters
    if (filters.mediaType !== 'all' && item.item_type === 'media') {
      // Would need to check mime_type from media table for full implementation
      return true // Simplified for now
    }

    // Visibility check (simplified - should check user permissions)
    return true
  })

  return {
    items: filteredItems,
    isLoading,
    filters,
    setFilters,
    togglePin,
    refresh: loadTimeline
  }
}
