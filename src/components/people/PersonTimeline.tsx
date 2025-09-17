import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Filter, 
  MessageSquare, 
  Camera, 
  Mic, 
  Calendar,
  Pin,
  Heart,
  User
} from 'lucide-react'
import { Person, UserRole, canAddContent } from '@/utils/personUtils'
import { format, parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase'

interface TimelineItem {
  id: string
  type: 'story' | 'life_event' | 'media'
  title: string
  content?: string
  excerpt?: string
  date: string
  date_precision?: string
  is_approx?: boolean
  media_type?: string
  story_id?: string
  event_id?: string
  media_id?: string
}

interface PersonTimelineProps {
  person: Person
  userRole: UserRole
  onRefresh: () => void
}

type TimelineFilter = 'all' | 'stories' | 'voice' | 'photos' | 'events'

export function PersonTimeline({ person, userRole, onRefresh }: PersonTimelineProps) {
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>('all')
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const canUserAddContent = canAddContent(userRole)

  const filters: { key: TimelineFilter; label: string; icon: any }[] = [
    { key: 'all', label: 'All', icon: Filter },
    { key: 'stories', label: 'Stories', icon: MessageSquare },
    { key: 'voice', label: 'Voice', icon: Mic },
    { key: 'photos', label: 'Photos', icon: Camera },
    { key: 'events', label: 'Life Events', icon: Calendar }
  ]

  useEffect(() => {
    fetchTimelineData()
  }, [person.id, onRefresh])

  async function fetchTimelineData() {
    setLoading(true)
    try {
      const items: TimelineItem[] = []

      // Fetch stories linked to this person
      const { data: stories } = await supabase
        .from('stories')
        .select(`
          id, title, content, occurred_on,
          person_story_links!inner(person_id)
        `)
        .eq('person_story_links.person_id', person.id)
        .eq('family_id', (person as any).family_id)
        .order('occurred_on', { ascending: false })

      if (stories) {
        stories.forEach(story => {
          items.push({
            id: story.id,
            type: 'story',
            title: story.title,
            content: story.content,
            excerpt: story.content?.substring(0, 150) + (story.content?.length > 150 ? '...' : ''),
            date: story.occurred_on || new Date().toISOString(),
            story_id: story.id
          })
        })
      }

      // Fetch life events for this person
      const { data: lifeEvents } = await supabase
        .from('life_events')
        .select('*')
        .eq('person_id', person.id)
        .eq('family_id', (person as any).family_id)
        .order('event_date', { ascending: false })

      if (lifeEvents) {
        lifeEvents.forEach(event => {
          items.push({
            id: event.id,
            type: 'life_event',
            title: event.title,
            content: event.notes,
            date: event.event_date || new Date().toISOString(),
            date_precision: event.date_precision,
            event_id: event.id
          })
        })
      }

      // Fetch media linked to this person through stories
      const { data: media } = await supabase
        .from('media')
        .select(`
          id, file_name, mime_type, created_at, story_id, individual_story_id,
          stories!media_story_id_fkey(
            person_story_links!inner(person_id)
          )
        `)
        .eq('family_id', (person as any).family_id)
        .not('stories.person_story_links', 'is', null)
        .order('created_at', { ascending: false })

      if (media) {
        media.forEach(mediaItem => {
          const isPhoto = mediaItem.mime_type?.startsWith('image/')
          const isAudio = mediaItem.mime_type?.startsWith('audio/')
          
          items.push({
            id: mediaItem.id,
            type: 'media',
            title: mediaItem.file_name,
            date: mediaItem.created_at,
            media_type: isPhoto ? 'photo' : isAudio ? 'voice' : 'other',
            media_id: mediaItem.id
          })
        })
      }

      // Sort all items by date (newest first)
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      setTimelineItems(items)
    } catch (error) {
      console.error('Failed to fetch timeline data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter timeline items based on active filter
  const filteredItems = timelineItems.filter(item => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'stories' && item.type === 'story') return true
    if (activeFilter === 'events' && item.type === 'life_event') return true
    if (activeFilter === 'photos' && item.type === 'media' && item.media_type === 'photo') return true
    if (activeFilter === 'voice' && item.type === 'media' && item.media_type === 'voice') return true
    return false
  })

  function getItemIcon(item: TimelineItem) {
    switch (item.type) {
      case 'story':
        return MessageSquare
      case 'life_event':
        return Calendar
      case 'media':
        if (item.media_type === 'photo') return Camera
        if (item.media_type === 'voice') return Mic
        return Camera
      default:
        return MessageSquare
    }
  }

  function formatDate(dateString: string, precision?: string) {
    const date = parseISO(dateString)
    if (precision === 'year') {
      return format(date, 'yyyy')
    }
    if (precision === 'month') {
      return format(date, 'MMM yyyy')
    }
    return format(date, 'MMM d, yyyy')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
        <div className="flex flex-wrap gap-2">
          {filters.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={activeFilter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(key)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading timeline...</p>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="space-y-4">
              {filteredItems.map((item) => {
                const Icon = getItemIcon(item)
                return (
                  <div key={item.id} className="flex gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.title}</h4>
                          {item.excerpt && (
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                              {item.excerpt}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {item.type === 'story' ? 'Story' : 
                               item.type === 'life_event' ? 'Life Event' :
                               item.media_type === 'photo' ? 'Photo' :
                               item.media_type === 'voice' ? 'Voice Note' : 'Media'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(item.date, item.date_precision)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {activeFilter === 'all' ? 'No memories yet' : `No ${activeFilter} found`}
              </h3>
              <p className="text-muted-foreground mb-4">
                {activeFilter === 'all' 
                  ? `Start this ${person.is_living === false ? 'Tribute' : 'Life'} Page with a quick note.`
                  : `No ${activeFilter} have been added yet.`
                }
              </p>
              {canUserAddContent && activeFilter === 'all' && (
                <Button>
                  Record a memory {person.is_living === false ? 'of' : 'for'} {person.given_name}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}