import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { getCurrentSpaceId } from '@/lib/spaceUtils'
import { createLifeEvent } from '@/lib/eventsService'
import { Heart, X } from 'lucide-react'

interface Person {
  id: string
  full_name: string
  is_living: boolean
}

interface AddEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function AddEventModal({ open, onOpenChange, onSuccess }: AddEventModalProps) {
  const [people, setPeople] = useState<Person[]>([])
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
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
        .select('id, full_name, is_living')
        .eq('family_id', spaceId)
        .order('full_name')

      setPeople(data || [])
    } catch (error) {
      console.error('Error loading people:', error)
    }
  }

  const resetForm = () => {
    setSelectedPeople([])
    setEventType('anniversary')
    setTitle('')
    setEventDate('')
    setRecurrence('yearly')
    setNotes('')
  }

  const generateTitle = () => {
    if (eventType === 'custom') return
    
    const selectedPersonNames = people
      .filter(p => selectedPeople.includes(p.id))
      .map(p => p.full_name)
    
    if (eventType === 'anniversary') {
      if (selectedPersonNames.length === 2) {
        setTitle(`${selectedPersonNames[0]} & ${selectedPersonNames[1]}'s Anniversary`)
      } else if (selectedPersonNames.length === 1) {
        setTitle(`${selectedPersonNames[0]}'s Anniversary`)
      } else {
        setTitle('Anniversary')
      }
    } else if (eventType === 'memorial') {
      if (selectedPersonNames.length === 1) {
        setTitle(`Memorial for ${selectedPersonNames[0]}`)
      } else if (selectedPersonNames.length > 1) {
        setTitle(`Memorial for ${selectedPersonNames.join(', ')}`)
      } else {
        setTitle('Memorial')
      }
    }
  }

  useEffect(() => {
    generateTitle()
  }, [eventType, selectedPeople, people])

  const togglePersonSelection = (personId: string) => {
    setSelectedPeople(prev => 
      prev.includes(personId) 
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    )
  }

  const removePerson = (personId: string) => {
    setSelectedPeople(prev => prev.filter(id => id !== personId))
  }

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
        person_id: selectedPeople[0] || undefined,
        with_person_id: selectedPeople[1] || undefined,
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
            <div className="space-y-3">
              <Label>
                {eventType === 'memorial' ? 'People being remembered' : 'People involved'}
              </Label>
              
              {/* Selected People */}
              {selectedPeople.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-md">
                  {selectedPeople.map(personId => {
                    const person = people.find(p => p.id === personId)
                    return person ? (
                      <Badge key={personId} variant="secondary" className="gap-1">
                        {person.full_name}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-destructive" 
                          onClick={() => removePerson(personId)}
                        />
                      </Badge>
                    ) : null
                  })}
                </div>
              )}

              {/* People Selection Lists */}
              <ScrollArea className="h-48 border rounded-md p-2">
                {/* Active Family */}
                <div className="space-y-2">
                  <div className="font-medium text-sm flex items-center gap-1 text-primary">
                    <Heart className="h-4 w-4" />
                    Active Family
                  </div>
                  {people.filter(p => p.is_living !== false).map(person => (
                    <div key={person.id} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={`active-${person.id}`}
                        checked={selectedPeople.includes(person.id)}
                        onCheckedChange={() => togglePersonSelection(person.id)}
                      />
                      <Label 
                        htmlFor={`active-${person.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {person.full_name}
                      </Label>
                    </div>
                  ))}
                </div>

                {/* In Memorium */}
                {people.some(p => p.is_living === false) && (
                  <>
                    <div className="my-4 border-t" />
                    <div className="space-y-2">
                      <div className="font-medium text-sm text-muted-foreground">
                        In Memorium
                      </div>
                      {people.filter(p => p.is_living === false).map(person => (
                        <div key={person.id} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`memorium-${person.id}`}
                            checked={selectedPeople.includes(person.id)}
                            onCheckedChange={() => togglePersonSelection(person.id)}
                          />
                          <Label 
                            htmlFor={`memorium-${person.id}`}
                            className="text-sm cursor-pointer flex-1 text-muted-foreground"
                          >
                            {person.full_name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </ScrollArea>
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