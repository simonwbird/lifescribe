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
      // Fetch stories count
      const { count: storiesCount } = await supabase
        .from('stories')
        .select('*', { count: 'exact', head: true })
        .contains('linked_people', [personId])
        .eq('family_id', familyId)

      // Fetch photos count (media with image mime types)
      const { count: photosCount } = await supabase
        .from('media')
        .select('*', { count: 'exact', head: true })
        .contains('linked_people', [personId])
        .eq('family_id', familyId)
        .like('mime_type', 'image/%')

      // Fetch audio count
      const { count: audioCount } = await supabase
        .from('audio_recordings')
        .select('*', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .eq('status', 'completed')
        .not('story_id', 'is', null)

      // Fetch relationships count (both directions)
      const { count: relationsFromCount } = await supabase
        .from('relationships')
        .select('*', { count: 'exact', head: true })
        .eq('from_person_id', personId)

      const { count: relationsToCount } = await supabase
        .from('relationships')
        .select('*', { count: 'exact', head: true })
        .eq('to_person_id', personId)

      setCounts({
        stories: storiesCount || 0,
        photos: photosCount || 0,
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
      label: counts.audio === 0 ? 'Record first tribute' : 'Audio',
      count: counts.audio === 0 ? null : counts.audio,
      icon: Mic,
      anchor: 'audio',
      color: 'text-primary',
      isSpecial: counts.audio === 0
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
          
          if (counter.isSpecial) {
            return (
              <Button
                key={counter.anchor}
                variant="ghost"
                className="h-auto flex flex-col items-center justify-center p-3 hover:bg-accent"
                onClick={() => handleCountClick(counter.anchor)}
              >
                <Icon className={cn('h-4 w-4 mb-2', counter.color)} />
                <div className="text-xs text-muted-foreground text-center leading-tight">
                  {counter.label}
                </div>
              </Button>
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
