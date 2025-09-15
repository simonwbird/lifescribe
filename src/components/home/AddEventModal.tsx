import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { getCurrentSpaceId } from '@/lib/spaceUtils'
import { createLifeEvent } from '@/lib/eventsService'

interface Person {
  id: string
  full_name: string
}

interface AddEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function AddEventModal({ open, onOpenChange, onSuccess }: AddEventModalProps) {
  const [people, setPeople] = useState<Person[]>([])
  const [selectedPersonId, setSelectedPersonId] = useState<string>('')
  const [withPersonId, setWithPersonId] = useState<string>('')
  const [eventType, setEventType] = useState<'anniversary' | 'memorial' | 'custom'>('anniversary')
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [recurrence, setRecurrence] = useState<'yearly' | 'none'>('yearly')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadPeople()
      resetForm()
    }
  }, [open])

  const loadPeople = async () => {
    try {
      const spaceId = await getCurrentSpaceId()
      if (!spaceId) return

      const { data } = await supabase
        .from('people')
        .select('id, full_name')
        .eq('family_id', spaceId)
        .order('full_name')

      setPeople(data || [])
    } catch (error) {
      console.error('Error loading people:', error)
    }
  }

  const resetForm = () => {
    setSelectedPersonId('')
    setWithPersonId('')
    setEventType('anniversary')
    setTitle('')
    setEventDate('')
    setRecurrence('yearly')
    setNotes('')
  }

  const generateTitle = () => {
    if (eventType === 'custom') return

    const person = people.find(p => p.id === selectedPersonId)
    const withPerson = people.find(p => p.id === withPersonId)
    
    if (eventType === 'anniversary') {
      if (person && withPerson) {
        setTitle(`${person.full_name} & ${withPerson.full_name}'s Anniversary`)
      } else if (person) {
        setTitle(`${person.full_name}'s Anniversary`)
      } else {
        setTitle('Anniversary')
      }
    } else if (eventType === 'memorial') {
      if (person) {
        setTitle(`Memorial for ${person.full_name}`)
      } else {
        setTitle('Memorial')
      }
    }
  }

  useEffect(() => {
    generateTitle()
  }, [eventType, selectedPersonId, withPersonId, people])

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Please enter a title",
        variant: "destructive"
      })
      return
    }

    if (!eventDate) {
      toast({
        title: "Please enter an event date",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)

      const eventId = await createLifeEvent({
        title: title.trim(),
        type: eventType,
        event_date: eventDate,
        person_id: selectedPersonId === 'none' || !selectedPersonId ? undefined : selectedPersonId,
        with_person_id: withPersonId === 'none' || !withPersonId ? undefined : withPersonId,
        recurrence,
        notes: notes.trim() || undefined
      })

      if (!eventId) throw new Error('Failed to create event')

      onSuccess()
      
    } catch (error) {
      console.error('Error saving event:', error)
      toast({
        title: "Error saving event",
        description: "Please try again",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Memorable Date</DialogTitle>
          <DialogDescription>
            Add an anniversary, memorial, or custom event
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Event Type */}
          <div>
            <Label htmlFor="event-type">Event Type</Label>
            <Select value={eventType} onValueChange={(value: 'anniversary' | 'memorial' | 'custom') => setEventType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anniversary">Anniversary</SelectItem>
                <SelectItem value="memorial">Memorial</SelectItem>
                <SelectItem value="custom">Custom Event</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Person Selection */}
          {eventType !== 'custom' && (
            <div>
              <Label htmlFor="person-select">
                {eventType === 'memorial' ? 'Person being remembered' : 'Person'}
              </Label>
              <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a person (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {people.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* With Person (for anniversaries) */}
          {eventType === 'anniversary' && selectedPersonId && (
            <div>
              <Label htmlFor="with-person-select">With</Label>
              <Select value={withPersonId} onValueChange={setWithPersonId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select partner (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {people.filter(p => p.id !== selectedPersonId).map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title */}
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event title"
            />
          </div>

          {/* Event Date */}
          <div>
            <Label htmlFor="event-date">Date</Label>
            <Input
              id="event-date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>

          {/* Recurrence */}
          <div>
            <Label htmlFor="recurrence">Recurrence</Label>
            <Select value={recurrence} onValueChange={(value: 'yearly' | 'none') => setRecurrence(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yearly">Yearly (appears every year)</SelectItem>
                <SelectItem value="none">One-time event</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional details..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}