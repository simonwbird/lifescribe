import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  Clock, 
  Users, 
  Heart, 
  Share, 
  Download, 
  ChevronDown,
  ExternalLink,
  Camera,
  MessageCircle
} from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useToast } from '@/hooks/use-toast'
import type { UpcomingEvent } from '@/lib/eventsService'
import { formatForUser, getCurrentUserRegion } from '@/utils/date'
import { EventContributionModal } from './EventContributionModal'
import { EventInviteModal } from './EventInviteModal'
import { EventRolesSection } from '@/components/events/EventRolesSection'
import { supabase } from '@/integrations/supabase/client'

interface EventDetailsModalProps {
  event: UpcomingEvent | null
  isOpen: boolean
  onClose: () => void
}

export const EventDetailsModal = ({ event, isOpen, onClose }: EventDetailsModalProps) => {
  const [timeUntil, setTimeUntil] = useState<string>('')
  const [showContributeModal, setShowContributeModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showCalendarOptions, setShowCalendarOptions] = useState(false)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const { track } = useAnalytics()
  const { toast } = useToast()

  // Load family ID when modal opens
  useEffect(() => {
    if (isOpen && event) {
      loadFamilyId()
    }
  }, [isOpen, event])

  const loadFamilyId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: membership } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .limit(1)
        .maybeSingle()

      if (membership) {
        setFamilyId(membership.family_id)
      }
    } catch (error) {
      console.error('Error loading family ID:', error)
    }
  }

  useEffect(() => {
    if (!event || event.days_until < 0) return

    const updateCountdown = () => {
      const now = new Date()
      const eventDate = new Date(event.date)
      
      // Set event time to 9 AM
      eventDate.setHours(9, 0, 0, 0)
      
      const timeDiff = eventDate.getTime() - now.getTime()
      
      if (timeDiff <= 0) {
        setTimeUntil("It's today!")
        return
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeUntil(`${days}d ${hours}h ${minutes}m`)
      } else if (hours > 0) {
        setTimeUntil(`${hours}h ${minutes}m`)
      } else {
        setTimeUntil(`${minutes}m`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [event])

  if (!event) return null

  const formatEventDate = () => {
    return formatForUser(event.date, 'dateOnly', getCurrentUserRegion())
  }

  const getEventTypeLabel = () => {
    if (event.type === 'birthday') {
      return event.is_deceased ? 'Birthday (In Memoriam)' : 'Birthday'
    }
    if (event.type === 'death_anniversary') {
      return 'Memorial Anniversary'
    }
    return 'Event'
  }

  const getAgeLabel = () => {
    if (event.type === 'birthday') {
      if (event.is_deceased && event.would_be_age !== undefined) {
        return `Would be ${event.would_be_age} years old`
      } else if (event.age !== undefined) {
        return `Turning ${event.age} years old`
      }
    } else if (event.type === 'death_anniversary' && event.age !== undefined) {
      return `${event.age} years since passing`
    }
    return null
  }

  const generateCalendarUrl = (type: 'google' | 'outlook' | 'ical') => {
    const title = `${event.person_name}'s ${getEventTypeLabel()}`
    const startDate = new Date(event.date)
    startDate.setHours(9, 0, 0, 0)
    const endDate = new Date(startDate)
    endDate.setHours(10, 0, 0, 0)
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    const details = `${getEventTypeLabel()} for ${event.person_name}${getAgeLabel() ? ` - ${getAgeLabel()}` : ''}`

    switch (type) {
      case 'google':
        const googleParams = new URLSearchParams({
          action: 'TEMPLATE',
          text: title,
          dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
          details: details,
          ctz: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
        return `https://calendar.google.com/calendar/render?${googleParams}`
        
      case 'outlook':
        const outlookParams = new URLSearchParams({
          subject: title,
          startdt: startDate.toISOString(),
          enddt: endDate.toISOString(),
          body: details,
          allday: 'false'
        })
        return `https://outlook.live.com/calendar/0/deeplink/compose?${outlookParams}`
        
      case 'ical':
        const icalContent = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//Family App//Event//EN',
          'BEGIN:VEVENT',
          `DTSTART:${formatDate(startDate)}`,
          `DTEND:${formatDate(endDate)}`,
          `SUMMARY:${title}`,
          `DESCRIPTION:${details}`,
          'END:VEVENT',
          'END:VCALENDAR'
        ].join('\n')
        
        const blob = new Blob([icalContent], { type: 'text/calendar' })
        return URL.createObjectURL(blob)
    }
  }

  const handleAddToCalendar = (type: 'google' | 'outlook' | 'ical') => {
    const url = generateCalendarUrl(type)
    
    if (type === 'ical') {
      const link = document.createElement('a')
      link.href = url
      link.download = `${event.person_name}-${getEventTypeLabel().replace(/\s+/g, '-').toLowerCase()}.ics`
      link.click()
      URL.revokeObjectURL(url)
    } else {
      window.open(url, '_blank')
    }
    
    track('event_added_to_calendar', { 
      eventType: event.type, 
      calendarType: type,
      eventId: event.id 
    })
    
    toast({
      title: 'Calendar Event',
      description: `Opening ${type === 'google' ? 'Google Calendar' : type === 'outlook' ? 'Outlook' : 'calendar file download'}`
    })
  }

  const handleContribute = () => {
    setShowContributeModal(true)
    track('event_contribute_clicked', { eventType: event.type, eventId: event.id })
  }

  const handleInviteFamily = () => {
    setShowInviteModal(true)
    track('event_invite_clicked', { eventType: event.type, eventId: event.id })
  }

  const handleShare = async () => {
    const shareText = `${event.person_name}'s ${getEventTypeLabel().toLowerCase()} is coming up on ${formatEventDate()}!`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${event.person_name}'s ${getEventTypeLabel()}`,
          text: shareText
        })
        track('event_shared_native', { eventType: event.type })
      } catch (error) {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(shareText)
      toast({
        title: 'Copied!',
        description: 'Event details copied to clipboard'
      })
      track('event_shared_clipboard', { eventType: event.type })
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {event.person_name}'s {getEventTypeLabel()}
            </DialogTitle>
            <DialogDescription>
              {formatEventDate()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Countdown */}
            {event.days_until >= 0 && (
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground mb-1">Time remaining</p>
                  <p className="text-2xl font-bold text-primary">{timeUntil}</p>
                  {getAgeLabel() && (
                    <p className="text-sm text-muted-foreground mt-1">{getAgeLabel()}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Event Details */}
            <div className="space-y-3">
              <h3 className="font-semibold">Event Details</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <Badge variant={event.is_deceased ? "secondary" : "default"}>
                    {getEventTypeLabel()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Date</span>
                  <span className="text-sm">{formatEventDate()}</span>
                </div>
                {event.days_until >= 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Days until</span>
                    <Badge variant="outline">{event.days_until === 0 ? 'Today' : `${event.days_until} days`}</Badge>
                  </div>
                )}
                {event.notes && (
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-muted-foreground">Notes</span>
                    <span className="text-sm max-w-48 text-right">{event.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Roles & Permissions Section */}
            {familyId && event?.id && (
              <>
                <Separator />
                <EventRolesSection eventId={event.id} familyId={familyId} />
              </>
            )}

            <Separator />

            {/* Actions */}
            <div className="space-y-3">
              <h3 className="font-semibold">Actions</h3>
              
              {/* Calendar Integration */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setShowCalendarOptions(!showCalendarOptions)}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Add to Calendar
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showCalendarOptions ? 'rotate-180' : ''}`} />
                </Button>
                
                {showCalendarOptions && (
                  <div className="grid grid-cols-3 gap-2 pl-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex flex-col gap-1 h-auto p-2"
                      onClick={() => handleAddToCalendar('google')}
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="text-xs">Google</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex flex-col gap-1 h-auto p-2"
                      onClick={() => handleAddToCalendar('outlook')}
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="text-xs">Outlook</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex flex-col gap-1 h-auto p-2"
                      onClick={() => handleAddToCalendar('ical')}
                    >
                      <Download className="h-3 w-3" />
                      <span className="text-xs">iCal</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Contribution Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleContribute}
                  className="flex items-center gap-2"
                >
                  <Heart className="h-4 w-4" />
                  Contribute
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleInviteFamily}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Invite Family
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="w-full flex items-center gap-2"
              >
                <Share className="h-4 w-4" />
                Share Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contribution Modal */}
      <EventContributionModal
        event={event}
        isOpen={showContributeModal}
        onClose={() => setShowContributeModal(false)}
      />

      {/* Invite Modal */}
      <EventInviteModal
        event={event}
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </>
  )
}