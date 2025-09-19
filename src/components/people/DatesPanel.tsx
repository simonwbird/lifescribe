import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Plus, Edit2, Trash2 } from 'lucide-react'
import { Person, UserRole, canEdit, computeAge, nextBirthdayOccurrence } from '@/utils/personUtils'
import { format, differenceInDays } from 'date-fns'
import { formatForUser, getCurrentUserRegion } from '@/utils/date'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { DatePrecisionPicker, DatePrecisionValue } from '@/components/DatePrecisionPicker'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface LifeEvent {
  id: string
  title: string
  type: string
  event_date: string | null
  event_date_text: string | null
  date_precision: string | null
  notes: string | null
  person_id: string
  with_person_id: string | null
}

interface DatesPanelProps {
  person: Person
  userRole: UserRole
  onPersonUpdated: () => void
}

export function DatesPanel({ person, userRole, onPersonUpdated }: DatesPanelProps) {
  const canUserEdit = canEdit(userRole)
  const { toast } = useToast()

  const [editType, setEditType] = useState<'birth' | 'death' | null>(null)
  const [dp, setDp] = useState<DatePrecisionValue>({ date: null, yearOnly: false })
  const [saving, setSaving] = useState(false)
  
  // Life events state
  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([])
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState<LifeEvent | null>(null)
  const [eventTitle, setEventTitle] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventDate, setEventDate] = useState<DatePrecisionValue>({ date: null, yearOnly: false })
  const [eventNotes, setEventNotes] = useState('')
  
  const age = computeAge(person.birth_date, person.death_date)
  const nextBirthday = nextBirthdayOccurrence(person.birth_date)
  const daysUntilBirthday = nextBirthday ? differenceInDays(nextBirthday, new Date()) : null

  // Event types for the dropdown
  const eventTypes = [
    'graduation',
    'marriage',
    'divorce', 
    'retirement',
    'anniversary',
    'achievement',
    'move',
    'career_start',
    'military_service',
    'baptism',
    'confirmation',
    'bar_mitzvah',
    'bat_mitzvah',
    'engagement',
    'other'
  ]

  const eventTypeLabels: Record<string, string> = {
    graduation: 'Graduation',
    marriage: 'Marriage',
    divorce: 'Divorce',
    retirement: 'Retirement', 
    anniversary: 'Anniversary',
    achievement: 'Achievement',
    move: 'Moved',
    career_start: 'Started Career',
    military_service: 'Military Service',
    baptism: 'Baptism',
    confirmation: 'Confirmation',
    bar_mitzvah: 'Bar Mitzvah',
    bat_mitzvah: 'Bat Mitzvah',
    engagement: 'Engagement',
    other: 'Other'
  }

  // Fetch life events on component mount
  useEffect(() => {
    fetchLifeEvents()
  }, [person.id])

  async function fetchLifeEvents() {
    try {
      const { data, error } = await supabase
        .from('life_events')
        .select('*')
        .eq('person_id', person.id)
        .eq('family_id', (person as any).family_id)
        .order('event_date', { ascending: true })

      if (error) throw error
      setLifeEvents(data || [])
    } catch (error) {
      console.error('Failed to fetch life events:', error)
    }
  }

  function openAddEvent() {
    setEditingEvent(null)
    setEventTitle('')
    setEventType('')
    setEventDate({ date: null, yearOnly: false })
    setEventNotes('')
    setShowEventDialog(true)
  }

  function openEditEvent(event: LifeEvent) {
    setEditingEvent(event)
    setEventTitle(event.title)
    setEventType(event.type)
    const yearOnly = event.date_precision === 'year' || event.date_precision === 'y'
    setEventDate({ 
      date: event.event_date ? new Date(event.event_date) : null, 
      yearOnly 
    })
    setEventNotes(event.notes || '')
    setShowEventDialog(true)
  }

  async function saveLifeEvent() {
    if (!eventTitle.trim() || !eventType) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const eventData = {
        title: eventTitle.trim(),
        type: eventType,
        event_date: eventDate.date ? format(eventDate.date, 'yyyy-MM-dd') : null,
        date_precision: eventDate.yearOnly ? 'year' : 'day',
        notes: eventNotes.trim() || null,
        person_id: person.id,
        family_id: (person as any).family_id
      }

      if (editingEvent) {
        const { error } = await supabase
          .from('life_events')
          .update(eventData)
          .eq('id', editingEvent.id)
        if (error) throw error
        toast({ title: 'Event updated' })
      } else {
        const { error } = await supabase
          .from('life_events')
          .insert({
            ...eventData,
            created_by: (await supabase.auth.getUser()).data.user?.id
          })
        if (error) throw error
        toast({ title: 'Event added' })
      }

      setShowEventDialog(false)
      fetchLifeEvents()
      onPersonUpdated()
    } catch (error: any) {
      toast({ 
        title: 'Failed to save event', 
        description: error.message, 
        variant: 'destructive' 
      })
    } finally {
      setSaving(false)
    }
  }

  async function deleteLifeEvent(eventId: string) {
    try {
      const { error } = await supabase
        .from('life_events')
        .delete()
        .eq('id', eventId)
      
      if (error) throw error
      toast({ title: 'Event deleted' })
      fetchLifeEvents()
      onPersonUpdated()
    } catch (error: any) {
      toast({ 
        title: 'Failed to delete event', 
        description: error.message, 
        variant: 'destructive' 
      })
    }
  }

  function openEdit(type: 'birth' | 'death') {
    setEditType(type)
    const d = type === 'birth' ? person.birth_date : person.death_date
    // Check if we only have year data
    const precRaw = (type === 'birth' ? (person as any).birth_date_precision : (person as any).death_date_precision) as string | undefined
    const yearOnly = precRaw === 'year' || precRaw === 'y'
    setDp({ date: d ? new Date(d) : null, yearOnly })
  }

  async function saveDate() {
    if (!editType) return
    setSaving(true)
    try {
      const updates: any = {}
      if (editType === 'birth') {
        updates.birth_date = dp.date ? format(dp.date, 'yyyy-MM-dd') : null
        updates.birth_date_precision = dp.yearOnly ? 'year' : 'day'
      } else {
        updates.death_date = dp.date ? format(dp.date, 'yyyy-MM-dd') : null
        updates.death_date_precision = dp.yearOnly ? 'year' : 'day'
      }
      const { error } = await supabase
        .from('people')
        .update(updates)
        .eq('id', person.id)
        .eq('family_id', (person as any).family_id)
      if (error) throw error
      toast({ title: 'Saved' })
      setEditType(null)
      onPersonUpdated()
    } catch (e: any) {
      toast({ title: 'Failed to save', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Important Dates
          </CardTitle>
          {canUserEdit && (
            <Button variant="outline" size="sm" onClick={openAddEvent}>
              <Plus className="h-4 w-4 mr-2" />
              Add date
            </Button>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Birthday */}
          {person.birth_date && (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Birthday</p>
                <p className="text-sm text-muted-foreground">
                  {formatForUser(person.birth_date, 'dateOnly', getCurrentUserRegion())}
                  {age && <span> • Age {age}</span>}
                </p>
                {daysUntilBirthday !== null && person.is_living !== false && (
                  <Badge variant="outline" className="mt-1">
                    {daysUntilBirthday === 0 ? 'Today!' : `${daysUntilBirthday} days`}
                  </Badge>
                )}
              </div>
              {canUserEdit && (
                <Button variant="ghost" size="sm" onClick={() => openEdit('birth')}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Death Date */}
          {person.death_date && (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Passed Away</p>
                <p className="text-sm text-muted-foreground">
                  {formatForUser(person.death_date, 'dateOnly', getCurrentUserRegion())}
                </p>
              </div>
              {canUserEdit && (
                <Button variant="ghost" size="sm" onClick={() => openEdit('death')}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Life Events */}
          {lifeEvents.map((event) => (
            <div key={event.id} className="flex items-start justify-between">
              <div>
                <p className="font-medium">{eventTypeLabels[event.type] || event.type}</p>
                <p className="text-sm font-medium">{event.title}</p>
                {event.event_date && (
                  <p className="text-sm text-muted-foreground">
                    {event.date_precision === 'year' 
                      ? new Date(event.event_date).getFullYear()
                      : formatForUser(event.event_date, 'dateOnly', getCurrentUserRegion())
                    }
                  </p>
                )}
                {event.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{event.notes}</p>
                )}
              </div>
              {canUserEdit && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEditEvent(event)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteLifeEvent(event.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
          
          {!person.birth_date && !person.death_date && lifeEvents.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No dates added yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit Date Dialog */}
      <Dialog open={!!editType} onOpenChange={(o) => setEditType(o ? editType : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editType === 'birth' ? 'Edit Birthday' : 'Edit Death Date'}</DialogTitle>
            <DialogDescription>Select a date and precision.</DialogDescription>
          </DialogHeader>
          <DatePrecisionPicker value={dp} onChange={setDp} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditType(null)}>Cancel</Button>
            <Button onClick={saveDate} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Life Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Edit Life Event' : 'Add Life Event'}
            </DialogTitle>
            <DialogDescription>
              Add an important milestone or event in this person's life.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="event-type">Event Type</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {eventTypeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="event-title">Event Title</Label>
              <Input
                id="event-title"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g., Harvard University, Married Sarah"
              />
            </div>

            <div>
              <Label>Date</Label>
              <DatePrecisionPicker value={eventDate} onChange={setEventDate} />
            </div>

            <div>
              <Label htmlFor="event-notes">Notes (optional)</Label>
              <Textarea
                id="event-notes"
                value={eventNotes}
                onChange={(e) => setEventNotes(e.target.value)}
                placeholder="Additional details about this event"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveLifeEvent} disabled={saving}>
              {saving ? 'Saving...' : (editingEvent ? 'Update' : 'Add Event')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}