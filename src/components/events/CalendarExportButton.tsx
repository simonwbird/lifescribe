import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Download, Calendar, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CalendarEvent {
  id: string
  title: string
  date: string
  type: 'birthday' | 'anniversary' | 'memorial' | 'custom'
  person_name?: string
  notes?: string
  location?: string
}

interface CalendarExportButtonProps {
  events: CalendarEvent[]
  className?: string
}

export default function CalendarExportButton({ events, className }: CalendarExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const formatEventForCalendar = (event: CalendarEvent) => {
    const eventDate = new Date(event.date)
    const year = eventDate.getFullYear() === 1900 ? new Date().getFullYear() : eventDate.getFullYear()
    const month = eventDate.getMonth() + 1
    const day = eventDate.getDate()
    
    // For recurring birthday/anniversary events, use current year
    const adjustedDate = new Date(year, eventDate.getMonth(), eventDate.getDate())
    
    return {
      title: event.title,
      date: adjustedDate,
      description: event.notes || '',
      recurring: event.type === 'birthday' || event.type === 'anniversary',
      allDay: true
    }
  }

  const generateICAL = () => {
    const icalEvents = events.map(event => {
      const calEvent = formatEventForCalendar(event)
      const startDate = calEvent.date.toISOString().split('T')[0].replace(/-/g, '')
      const endDate = startDate // All-day events
      const uid = `family-event-${event.id}@familyapp.com`
      
      let icalString = [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTART;VALUE=DATE:${startDate}`,
        `DTEND;VALUE=DATE:${endDate}`,
        `SUMMARY:${calEvent.title}`,
        `DESCRIPTION:${calEvent.description}`
      ]

      // Add recurrence for birthdays/anniversaries
      if (calEvent.recurring) {
        icalString.push('RRULE:FREQ=YEARLY')
      }

      icalString.push('END:VEVENT')
      return icalString.join('\r\n')
    }).join('\r\n')

    const icalFile = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Family App//Family Events//EN',
      'CALSCALE:GREGORIAN',
      icalEvents,
      'END:VCALENDAR'
    ].join('\r\n')

    return icalFile
  }

  const downloadICAL = () => {
    try {
      setIsExporting(true)
      const icalContent = generateICAL()
      const blob = new Blob([icalContent], { type: 'text/calendar' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'family-events.ics'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Calendar exported!",
        description: "Family events have been downloaded as an .ics file"
      })
    } catch (error) {
      console.error('Error exporting calendar:', error)
      toast({
        title: "Export failed",
        description: "Could not export calendar events",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  const exportToGoogleCalendar = () => {
    try {
      // Create a single event URL for the most upcoming event
      const upcomingEvent = events.find(e => new Date(e.date) >= new Date())
      if (!upcomingEvent) {
        toast({
          title: "No upcoming events",
          description: "Add some events first to export to Google Calendar"
        })
        return
      }

      const calEvent = formatEventForCalendar(upcomingEvent)
      const startDate = calEvent.date.toISOString().split('T')[0].replace(/-/g, '')
      
      const googleUrl = new URL('https://calendar.google.com/calendar/render')
      googleUrl.searchParams.set('action', 'TEMPLATE')
      googleUrl.searchParams.set('text', calEvent.title)
      googleUrl.searchParams.set('dates', `${startDate}/${startDate}`)
      googleUrl.searchParams.set('details', calEvent.description)
      googleUrl.searchParams.set('recur', calEvent.recurring ? 'RRULE:FREQ=YEARLY' : '')

      window.open(googleUrl.toString(), '_blank')
      
      toast({
        title: "Opening Google Calendar...",
        description: "Add events one by one for the best experience"
      })
    } catch (error) {
      console.error('Error opening Google Calendar:', error)
      toast({
        title: "Could not open Google Calendar",
        description: "Please try downloading the .ics file instead",
        variant: "destructive"
      })
    }
  }

  const exportToOutlook = () => {
    try {
      // Outlook Web uses similar URL scheme to Google Calendar
      const upcomingEvent = events.find(e => new Date(e.date) >= new Date())
      if (!upcomingEvent) {
        toast({
          title: "No upcoming events",
          description: "Add some events first to export to Outlook"
        })
        return
      }

      const calEvent = formatEventForCalendar(upcomingEvent)
      const startDate = calEvent.date.toISOString()
      
      const outlookUrl = new URL('https://outlook.live.com/calendar/0/deeplink/compose')
      outlookUrl.searchParams.set('subject', calEvent.title)
      outlookUrl.searchParams.set('startdt', startDate)
      outlookUrl.searchParams.set('body', calEvent.description)
      outlookUrl.searchParams.set('allday', 'true')

      window.open(outlookUrl.toString(), '_blank')
      
      toast({
        title: "Opening Outlook...",
        description: "Complete the event setup in Outlook"
      })
    } catch (error) {
      console.error('Error opening Outlook:', error)
      toast({
        title: "Could not open Outlook",
        description: "Please try downloading the .ics file instead",
        variant: "destructive"
      })
    }
  }

  if (events.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={className}
          disabled={isExporting}
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export Calendar'}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 bg-background border shadow-md">
        <DropdownMenuItem onClick={downloadICAL} className="cursor-pointer hover:bg-muted">
          <Calendar className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span className="font-medium">Download .ics file</span>
            <span className="text-xs text-muted-foreground">Works with all calendar apps</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={exportToGoogleCalendar} className="cursor-pointer hover:bg-muted">
          <ExternalLink className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span className="font-medium">Google Calendar</span>
            <span className="text-xs text-muted-foreground">Add to your Google account</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={exportToOutlook} className="cursor-pointer hover:bg-muted">
          <ExternalLink className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span className="font-medium">Outlook Calendar</span>
            <span className="text-xs text-muted-foreground">Add to Outlook.com</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}