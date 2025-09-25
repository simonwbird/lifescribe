import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, Plus, Camera, PenTool, Heart, Users, Info } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useToast } from '@/hooks/use-toast'
import { getUpcomingEvents, type UpcomingEvent } from '@/lib/eventsService'
import { formatForUser, getCurrentUserRegion } from '@/utils/date'
import AddBirthdayModal from './AddBirthdayModal'
import AddEventModal from './AddEventModal'
import { EventDetailsModal } from './EventDetailsModal'

export default function Upcoming() {
  const [events, setEvents] = useState<UpcomingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showBirthdayModal, setShowBirthdayModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<UpcomingEvent | null>(null)
  const [showEventDetails, setShowEventDetails] = useState(false)
  const { track } = useAnalytics()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const upcomingEvents = await getUpcomingEvents(30)
      setEvents(upcomingEvents.slice(0, 10)) // Limit to 10 for widget
    } catch (error) {
      console.error('Error loading events:', error)
      toast({
        title: "Error loading events",
        description: "Failed to load upcoming events",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDateLabel = (event: UpcomingEvent): string => {
    return formatForUser(event.date, 'dateOnly', getCurrentUserRegion())
  }

  const formatDaysUntil = (daysUntil: number): string => {
    if (daysUntil === 0) return 'Today'
    if (daysUntil === 1) return 'Tomorrow'
    if (daysUntil <= 7) return `${daysUntil} days`
    if (daysUntil <= 14) return '1 week'
    if (daysUntil <= 21) return '2 weeks'
    if (daysUntil <= 28) return '3 weeks'
    return '4 weeks'
  }

  const getEventLabel = (event: UpcomingEvent): string => {
    if (event.type === 'birthday') {
      if (event.is_deceased && event.would_be_age !== undefined) {
        return `would be ${event.would_be_age}`
      } else if (event.age !== undefined) {
        return `turns ${event.age}`
      } else {
        return 'Birthday'
      }
    } else if (event.type === 'death_anniversary') {
      return `${event.age} years ago`
    } else if (event.type === 'life_event') {
      if (event.age !== undefined && event.recurrence === 'yearly') {
        return `${event.age} years ago`
      } else {
        return event.event_type === 'anniversary' ? 'Anniversary' : 
               event.event_type === 'memorial' ? 'Memorial' : 'Event'
      }
    }
    return ''
  }

  const handleWriteNote = (event: UpcomingEvent) => {
    const eventParam = event.type === 'birthday' 
      ? `birthday-${event.person_id}`
      : event.type === 'death_anniversary'
      ? `memorial-${event.person_id}`
      : event.id

    const title = event.type === 'birthday' 
      ? `Birthday note for ${event.person_name}`
      : event.type === 'death_anniversary'
      ? `Memorial for ${event.person_name}`
      : `Note about ${event.title}`

    navigate(`/stories/new?eventId=${eventParam}&title=${encodeURIComponent(title)}`)
    track('upcoming_write_note_clicked' as any, { eventType: event.type, eventId: event.id })
  }

  const handleAddPhoto = (event: UpcomingEvent) => {
    const eventParam = event.type === 'birthday' 
      ? `birthday-${event.person_id}`
      : event.type === 'death_anniversary'
      ? `memorial-${event.person_id}`
      : event.id

    navigate(`/stories/new?eventId=${eventParam}&mode=photo`)
    track('upcoming_add_photo_clicked' as any, { eventType: event.type, eventId: event.id })
  }

  const handleAddSuccess = () => {
    setShowBirthdayModal(false)
    setShowEventModal(false)
    setShowAddMenu(false)
    loadEvents()
    toast({
      title: "Event added",
      description: "The event has been added to your family calendar"
    })
  }

  const handleEventClick = (event: UpcomingEvent) => {
    setSelectedEvent(event)
    setShowEventDetails(true)
    track('event_details_opened', { 
      eventType: event.type, 
      daysUntil: event.days_until,
      eventId: event.id 
    })
  }

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-serif flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming
            </CardTitle>
            
            <Dialog open={showAddMenu} onOpenChange={setShowAddMenu}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddMenu(true)}
                className="text-primary hover:text-primary"
              >
                <Plus className="h-4 w-4" />
              </Button>
              
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Add Important Date</DialogTitle>
                  <DialogDescription>
                    Add birthdays and memorable dates for your family
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={() => {
                      setShowAddMenu(false)
                      setShowBirthdayModal(true)
                    }}
                  >
                    <Heart className="h-4 w-4" />
                    Add Birthday
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={() => {
                      setShowAddMenu(false)
                      setShowEventModal(true)
                    }}
                  >
                    <Calendar className="h-4 w-4" />
                    Add Memorable Date
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                No upcoming events in the next 30 days
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAddMenu(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </div>
          ) : (
            <>
              {events.map((event) => (
                <div 
                  key={event.id} 
                  className="flex items-center justify-between p-3 rounded-lg border bg-card cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleEventClick(event)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">
                        {event.person_name}
                      </p>
                      {event.is_deceased && (
                        <Badge variant="secondary" className="text-xs">
                          In memoriam
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-1">
                      {getEventLabel(event)}
                    </p>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatDateLabel(event)}</span>
                      <Badge variant="outline" className="text-xs">
                        {formatDaysUntil(event.days_until)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleWriteNote(event)
                      }}
                      title="Write note"
                    >
                      <PenTool className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddPhoto(event)
                      }}
                      title="Add photo"
                    >
                      <Camera className="h-3 w-3" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEventClick(event)
                      }}
                      title="View details"
                    >
                      <Info className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  asChild
                >
                  <Link to="/events?range=90d">
                    <Users className="h-4 w-4 mr-2" />
                    View all events
                  </Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Birthday Modal */}
      <AddBirthdayModal
        open={showBirthdayModal}
        onOpenChange={setShowBirthdayModal}
        onSuccess={handleAddSuccess}
      />

      {/* Add Event Modal */}
      <AddEventModal
        open={showEventModal}
        onOpenChange={setShowEventModal}
        onSuccess={handleAddSuccess}
      />

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        isOpen={showEventDetails}
        onClose={() => {
          setShowEventDetails(false)
          setSelectedEvent(null)
        }}
      />
    </>
  )
}