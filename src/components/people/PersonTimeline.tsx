import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { 
  Filter, 
  MessageSquare, 
  Camera, 
  Mic, 
  Calendar,
  Pin,
  Heart,
  User,
  X
} from 'lucide-react'
import { Person, UserRole, canAddContent } from '@/utils/personUtils'
import { format, parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { getSignedMediaUrl } from '@/lib/media'

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
  file_path?: string
  signed_url?: string
}

interface PersonTimelineProps {
  person: Person
  userRole: UserRole
  onRefresh: () => void
}

type TimelineFilter = 'all' | 'stories' | 'voice' | 'photos' | 'events'

export function PersonTimeline({ person, userRole, onRefresh }: PersonTimelineProps) {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>('all')
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [displayCount, setDisplayCount] = useState(10) // Show 10 items initially
  const [hasMore, setHasMore] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<TimelineItem | null>(null)
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
          id, file_name, mime_type, created_at, story_id, individual_story_id, file_path,
          stories!media_story_id_fkey(
            person_story_links!inner(person_id)
          )
        `)
        .eq('family_id', (person as any).family_id)
        .not('stories.person_story_links', 'is', null)
        .order('created_at', { ascending: false })

      if (media) {
        for (const mediaItem of media) {
          const isPhoto = mediaItem.mime_type?.startsWith('image/')
          const isAudio = mediaItem.mime_type?.startsWith('audio/')
          
          let signedUrl = undefined
          if (isPhoto && mediaItem.file_path) {
            try {
              signedUrl = await getSignedMediaUrl(mediaItem.file_path, (person as any).family_id)
            } catch (error) {
              console.error('Failed to get signed URL for media:', mediaItem.id, error)
            }
          }
          
          items.push({
            id: mediaItem.id,
            type: 'media',
            title: mediaItem.file_name,
            date: mediaItem.created_at,
            media_type: isPhoto ? 'photo' : isAudio ? 'voice' : 'other',
            media_id: mediaItem.id,
            file_path: mediaItem.file_path,
            signed_url: signedUrl || undefined
          })
        }
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

  // Display limited items with pagination
  const displayedItems = filteredItems.slice(0, displayCount)
  const remainingItems = filteredItems.length - displayCount

  // Reset display count when filter changes
  useEffect(() => {
    setDisplayCount(10)
  }, [activeFilter])

  // Update hasMore when items change
  useEffect(() => {
    setHasMore(filteredItems.length > displayCount)
  }, [filteredItems.length, displayCount])

  function loadMore() {
    setDisplayCount(prev => prev + 10)
  }

  function handleFilterChange(filter: TimelineFilter) {
    setActiveFilter(filter)
    setDisplayCount(10) // Reset to show first 10 items when filter changes
  }

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

  function handleItemClick(item: TimelineItem) {
    // Navigate to the appropriate content based on item type
    if (item.type === 'story' && item.story_id) {
      navigate(`/stories/${item.story_id}`)
    } else if (item.type === 'life_event' && item.event_id) {
      // For now, stay on the same page - could implement event modal later
      console.log('Life event clicked:', item.event_id)
    } else if (item.type === 'media' && item.media_type === 'photo') {
      // Open photo in lightbox
      setSelectedPhoto(item)
    } else if (item.type === 'media' && item.media_id) {
      // For now, stay on the same page - could implement media lightbox later
      console.log('Media clicked:', item.media_id)
    }
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
              onClick={() => handleFilterChange(key)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {label}
              {key !== 'all' && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {timelineItems.filter(item => {
                    if (key === 'stories' && item.type === 'story') return true
                    if (key === 'events' && item.type === 'life_event') return true
                    if (key === 'photos' && item.type === 'media' && item.media_type === 'photo') return true
                    if (key === 'voice' && item.type === 'media' && item.media_type === 'voice') return true
                    return false
                  }).length}
                </Badge>
              )}
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
              {/* Photo Gallery Wall */}
              {activeFilter === 'photos' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {displayedItems.map((item) => (
                    <div 
                      key={item.id}
                      className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity group"
                      onClick={() => handleItemClick(item)}
                    >
                      {item.signed_url ? (
                        <img 
                          src={item.signed_url} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
                          <Camera className="h-8 w-8 text-primary/60" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          <div className="absolute bottom-1 left-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-xs text-white bg-black/60 px-1 py-0.5 rounded truncate">
                              {item.title}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Regular Timeline List */
                <>
                  {displayedItems.map((item) => {
                    const Icon = getItemIcon(item)
                    return (
                      <div 
                        key={item.id} 
                        className="flex gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-all cursor-pointer hover:shadow-sm active:scale-[0.98]"
                        onClick={() => handleItemClick(item)}
                      >
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm leading-tight">{item.title}</h4>
                              {item.excerpt && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                  {item.excerpt}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs px-2 py-0.5 h-5">
                                  {item.type === 'story' ? 'Story' : 
                                   item.type === 'life_event' ? 'Event' :
                                   item.media_type === 'photo' ? 'Photo' :
                                   item.media_type === 'voice' ? 'Voice' : 'Media'}
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
                </>
              )}
              
              {/* Show more button */}
              {hasMore && (
                <div className="text-center pt-4">
                  <Button 
                    variant="outline" 
                    onClick={loadMore}
                    className="gap-2"
                  >
                    Show {Math.min(remainingItems, 10)} more
                    {remainingItems > 10 && ` (${remainingItems} remaining)`}
                  </Button>
                </div>
              )}
              
              {/* Items counter */}
              {filteredItems.length > 10 && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Showing {displayedItems.length} of {filteredItems.length} items
                  </p>
                </div>
              )}
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

      {/* Photo Lightbox */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          {selectedPhoto && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-black/20 hover:bg-black/40 text-white"
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              {selectedPhoto.signed_url ? (
                <img 
                  src={selectedPhoto.signed_url} 
                  alt={selectedPhoto.title}
                  className="w-full h-auto max-h-[90vh] object-contain"
                />
              ) : (
                <div className="w-full h-96 bg-muted flex items-center justify-center">
                  <Camera className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <h3 className="text-white font-medium">{selectedPhoto.title}</h3>
                <p className="text-white/80 text-sm">
                  {formatDate(selectedPhoto.date, selectedPhoto.date_precision)}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}