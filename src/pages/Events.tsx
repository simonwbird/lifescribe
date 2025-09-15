import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Plus, Camera, PenTool, Heart, ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useToast } from '@/hooks/use-toast'
import { getAllFamilyEvents, type UpcomingEvent } from '@/lib/eventsService'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import AddBirthdayModal from '@/components/home/AddBirthdayModal'
import AddEventModal from '@/components/home/AddEventModal'

export default function Events() {
  const [events, setEvents] = useState<UpcomingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showBirthdayModal, setShowBirthdayModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [searchParams] = useSearchParams()
  const { track } = useAnalytics()
  const { toast } = useToast()
  const navigate = useNavigate()

  const range = searchParams.get('range') || '30d'
  const days = range === '90d' ? 90 : 30

  useEffect(() => {
    loadEvents()
  }, [days])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const allEvents = await getAllFamilyEvents()
      setEvents(allEvents)
    } catch (error) {
      console.error('Error loading events:', error)
      toast({
        title: "Error loading events",
        description: "Failed to load family events",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDateLabel = (event: UpcomingEvent): string => {
    const date = new Date(event.date)
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    }
    return date.toLocaleDateString('en-US', options)
  }

  const formatDaysUntil = (daysUntil: number): string => {
    if (daysUntil === 0) return 'Today'
    if (daysUntil === 1) return 'Tomorrow'
    if (daysUntil <= 7) return `${daysUntil} days away`
    if (daysUntil <= 14) return '1 week away'
    if (daysUntil <= 21) return '2 weeks away'
    if (daysUntil <= 28) return '3 weeks away'
    const weeks = Math.floor(daysUntil / 7)
    return `${weeks} weeks away`
  }

  const getEventLabel = (event: UpcomingEvent): string => {
    if (event.type === 'birthday') {
      if (event.is_deceased && event.would_be_age !== undefined) {
        return `would be ${event.would_be_age} years old`
      } else if (event.age !== undefined) {
        return `turns ${event.age} years old`
      } else {
        return 'Birthday'
      }
    } else if (event.type === 'death_anniversary') {
      return `${event.age} year memorial`
    } else if (event.type === 'life_event') {
      if (event.age !== undefined && event.recurrence === 'yearly') {
        return `${event.age} year ${event.event_type}`
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
    track('events_write_note_clicked' as any, { eventType: event.type, eventId: event.id })
  }

  const handleAddPhoto = (event: UpcomingEvent) => {
    const eventParam = event.type === 'birthday' 
      ? `birthday-${event.person_id}`
      : event.type === 'death_anniversary'
      ? `memorial-${event.person_id}`
      : event.id

    navigate(`/stories/new?eventId=${eventParam}&mode=photo`)
    track('events_add_photo_clicked' as any, { eventType: event.type, eventId: event.id })
  }

  const handleAddSuccess = () => {
    setShowBirthdayModal(false)
    setShowEventModal(false)
    loadEvents()
    toast({
      title: "Event added",
      description: "The event has been added to your family calendar"
    })
  }

  const upcomingEvents = events.filter(e => e.days_until >= 0)
  const pastEvents = events.filter(e => e.days_until < 0)

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/home" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Calendar className="h-8 w-8" />
                  Family Events
                </h1>
                <p className="text-muted-foreground mt-2">
                  Birthdays and memorable dates for your family (past 12 months and next 12 months)
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowBirthdayModal(true)}
                  className="gap-2"
                >
                  <Heart className="h-4 w-4" />
                  Add Birthday
                </Button>
                
                <Button
                  onClick={() => setShowEventModal(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Event
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList>
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingEvents.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({pastEvents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4 mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : upcomingEvents.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No upcoming events</h3>
                    <p className="text-muted-foreground mb-6">
                      Add birthdays and memorable dates to see them here
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowBirthdayModal(true)}
                        className="gap-2"
                      >
                        <Heart className="h-4 w-4" />
                        Add Birthday
                      </Button>
                      <Button
                        onClick={() => setShowEventModal(true)}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Event
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {upcomingEvents.map((event) => (
                    <Card key={event.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">
                                {event.person_name}
                              </h3>
                              {event.is_deceased && (
                                <Badge variant="secondary">
                                  In memoriam
                                </Badge>
                              )}
                              <Badge variant="outline">
                                {formatDaysUntil(event.days_until)}
                              </Badge>
                            </div>
                            
                            <p className="text-muted-foreground mb-2">
                              {getEventLabel(event)}
                            </p>
                            
                            <p className="text-sm text-muted-foreground">
                              {formatDateLabel(event)}
                            </p>
                            
                            {event.notes && (
                              <p className="text-sm text-muted-foreground mt-2 italic">
                                {event.notes}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleWriteNote(event)}
                              className="gap-2"
                            >
                              <PenTool className="h-4 w-4" />
                              Write note
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddPhoto(event)}
                              className="gap-2"
                            >
                              <Camera className="h-4 w-4" />
                              Add photo
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4 mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : pastEvents.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No recent events</h3>
                    <p className="text-muted-foreground">
                      Events from the past 12 months will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pastEvents.map((event) => (
                    <Card key={event.id} className="opacity-75">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">
                                {event.person_name}
                              </h3>
                              {event.is_deceased && (
                                <Badge variant="secondary">
                                  In memoriam
                                </Badge>
                              )}
                              <Badge variant="outline">
                                {Math.abs(event.days_until)} days ago
                              </Badge>
                            </div>
                            
                            <p className="text-muted-foreground mb-2">
                              {getEventLabel(event)}
                            </p>
                            
                            <p className="text-sm text-muted-foreground">
                              {formatDateLabel(event)}
                            </p>
                            
                            {event.notes && (
                              <p className="text-sm text-muted-foreground mt-2 italic">
                                {event.notes}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleWriteNote(event)}
                              className="gap-2"
                            >
                              <PenTool className="h-4 w-4" />
                              Write note
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddPhoto(event)}
                              className="gap-2"
                            >
                              <Camera className="h-4 w-4" />
                              Add photo
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>

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
    </AuthGate>
  )
}