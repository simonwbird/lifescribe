import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Image, FileText, Mic, Users } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'

interface MediaCountersProps {
  personId: string
  familyId: string
  className?: string
}

interface Counts {
  stories: number
  photos: number
  audio: number
  relations: number
}

export function MediaCounters({ personId, familyId, className }: MediaCountersProps) {
  const [counts, setCounts] = useState<Counts>({
    stories: 0,
    photos: 0,
    audio: 0,
    relations: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchCounts = async () => {
    try {
      // 1) Get all story links for this person
      const { data: storyLinks, error: storyLinksError } = await supabase
        .from('person_story_links')
        .select('story_id')
        .eq('person_id', personId)
        .eq('family_id', familyId)

      if (storyLinksError) {
        console.error('Story links error:', storyLinksError)
      }

      const storyIds = Array.from(new Set((storyLinks || []).map((l: any) => l.story_id)))
      const storiesCount = storyIds.length

      // 2) Photos: media tied to those stories only (images)
      let photosCount = 0
      if (storyIds.length > 0) {
        const { count, error: photosError } = await supabase
          .from('media')
          .select('*', { count: 'exact', head: true })
          .eq('family_id', familyId)
          .in('story_id', storyIds)
          .like('mime_type', 'image/%')

        if (photosError) {
          console.error('Photos count error:', photosError)
        }
        photosCount = count || 0
      }

      // 3) Audio: all completed audio remembrances for the family
      const { count: audioCount, error: audioError } = await supabase
        .from('audio_recordings')
        .select('*', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .eq('status', 'completed')
        .eq('is_draft', false)

      if (audioError) {
        console.error('Audio count error:', audioError)
      }


      // Fetch relationships count (both directions)
      const { count: relationsFromCount, error: relFromError } = await supabase
        .from('relationships')
        .select('*', { count: 'exact', head: true })
        .eq('from_person_id', personId)

      if (relFromError) {
        console.error('Relations from error:', relFromError)
      }

      const { count: relationsToCount, error: relToError } = await supabase
        .from('relationships')
        .select('*', { count: 'exact', head: true })
        .eq('to_person_id', personId)

      if (relToError) {
        console.error('Relations to error:', relToError)
      }

      console.log('📊 Media Stats:', {
        stories: storiesCount,
        photos: photosCount,
        audio: audioCount || 0,
        relations: (relationsFromCount || 0) + (relationsToCount || 0),
        personId,
        familyId
      })

      setCounts({
        stories: storiesCount,
        photos: photosCount,
        audio: audioCount || 0,
        relations: (relationsFromCount || 0) + (relationsToCount || 0)
      })
    } catch (error) {
      console.error('Error fetching media counts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCounts()

    // Set up realtime subscriptions for live updates
    const storiesChannel = supabase
      .channel('stories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories',
          filter: `family_id=eq.${familyId}`
        },
        () => fetchCounts()
      )
      .subscribe()

    const mediaChannel = supabase
      .channel('media-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'media',
          filter: `family_id=eq.${familyId}`
        },
        () => fetchCounts()
      )
      .subscribe()

    const audioChannel = supabase
      .channel('audio-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audio_recordings',
          filter: `family_id=eq.${familyId}`
        },
        () => fetchCounts()
      )
      .subscribe()

    const relationshipsChannel = supabase
      .channel('relationships-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'relationships'
        },
        () => fetchCounts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(storiesChannel)
      supabase.removeChannel(mediaChannel)
      supabase.removeChannel(audioChannel)
      supabase.removeChannel(relationshipsChannel)
    }
  }, [personId, familyId])

  const handleCountClick = (anchor: string) => {
    const element = document.getElementById(anchor)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const counters = [
    {
      label: 'Stories',
      count: counts.stories,
      icon: FileText,
      anchor: 'stories',
      color: 'text-primary'
    },
    {
      label: 'Photos',
      count: counts.photos,
      icon: Image,
      anchor: 'photos',
      color: 'text-primary'
    },
    {
      label: 'Audio',
      count: counts.audio,
      icon: Mic,
      anchor: 'audio',
      color: 'text-primary',
      isEmpty: counts.audio === 0,
      emptyText: 'No audio yet — record a 60–120s tribute.'
    },
    {
      label: 'Relations',
      count: counts.relations,
      icon: Users,
      anchor: 'relationships',
      color: 'text-primary'
    }
  ]

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Image className="h-4 w-4" />
            Media Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center animate-pulse">
              <div className="h-8 bg-muted rounded mb-2" />
              <div className="h-4 bg-muted rounded w-16 mx-auto" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Image className="h-4 w-4" />
          Media Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {counters.map((counter) => {
          const Icon = counter.icon
          
          if (counter.isEmpty) {
            return (
              <button
                key={counter.anchor}
                onClick={() => handleCountClick(counter.anchor)}
                className="col-span-2 text-left hover:bg-accent rounded-md p-3 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <Icon className={cn('h-4 w-4 mt-0.5', counter.color)} />
                  <div className="text-xs text-muted-foreground leading-tight">
                    {counter.emptyText}
                  </div>
                </div>
              </button>
            )
          }

          return (
            <button
              key={counter.anchor}
              onClick={() => handleCountClick(counter.anchor)}
              className="text-center hover:bg-accent rounded-md p-3 transition-colors group"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <Icon className={cn('h-4 w-4 group-hover:scale-110 transition-transform', counter.color)} />
                <div className="text-2xl font-bold">{counter.count}</div>
              </div>
              <div className="text-xs text-muted-foreground">{counter.label}</div>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
