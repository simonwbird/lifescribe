import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { getCurrentSpaceId } from '@/lib/spaceUtils'
import { updatePersonBirthDate } from '@/lib/eventsService'

interface Person {
  id: string
  full_name: string
  birth_date?: string
}

interface AddBirthdayModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function AddBirthdayModal({ open, onOpenChange, onSuccess }: AddBirthdayModalProps) {
  const [people, setPeople] = useState<Person[]>([])
  const [selectedPersonId, setSelectedPersonId] = useState<string>('')
  const [newPersonName, setNewPersonName] = useState('')
  const [createNewPerson, setCreateNewPerson] = useState(false)
  const [birthDate, setBirthDate] = useState('')
  const [unknownYear, setUnknownYear] = useState(false)
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')
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
        .select('id, full_name, birth_date')
        .eq('family_id', spaceId)
        .order('full_name')

      setPeople(data || [])
    } catch (error) {
      console.error('Error loading people:', error)
    }
  }

  const resetForm = () => {
    setSelectedPersonId('')
    setNewPersonName('')
    setCreateNewPerson(false)
    setBirthDate('')
    setUnknownYear(false)
    setBirthMonth('')
    setBirthDay('')
  }

  const handleSave = async () => {
    if (!createNewPerson && !selectedPersonId) {
      toast({
        title: "Please select a person",
        variant: "destructive"
      })
      return
    }

    if (createNewPerson && !newPersonName.trim()) {
      toast({
        title: "Please enter a name",
        variant: "destructive"
      })
      return
    }

    if (!unknownYear && !birthDate) {
      toast({
        title: "Please enter a birth date",
        variant: "destructive"
      })
      return
    }

    if (unknownYear && (!birthMonth || !birthDay)) {
      toast({
        title: "Please enter birth month and day",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      const spaceId = await getCurrentSpaceId()
      if (!spaceId) throw new Error('No active space found')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let personId = selectedPersonId
      let finalBirthDate = birthDate

      // Create new person if needed
      if (createNewPerson) {
        const { data: newPerson, error: personError } = await supabase
          .from('people')
          .insert({
            full_name: newPersonName.trim(),
            family_id: spaceId,
            created_by: user.id
          })
          .select('id')
          .single()

        if (personError) throw personError
        personId = newPerson.id
      }

      // Handle unknown year dates
      if (unknownYear) {
        // Use a default year (1900) to store month/day
        finalBirthDate = `1900-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`
      }

      // Update person's birth date
      const success = await updatePersonBirthDate(personId, finalBirthDate)
      if (!success) throw new Error('Failed to update birth date')

      onSuccess()
      
    } catch (error) {
      console.error('Error saving birthday:', error)
      toast({
        title: "Error saving birthday",
        description: "Please try again",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ]

  const days = Array.from({ length: 31 }, (_, i) => ({
    value: (i + 1).toString(),
    label: (i + 1).toString()
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Birthday</DialogTitle>
          <DialogDescription>
            Add a birthday for a family member
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Person Selection */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="create-new"
                checked={createNewPerson}
                onCheckedChange={(checked) => setCreateNewPerson(checked === true)}
              />
              <Label htmlFor="create-new" className="text-sm">
                Create new person
              </Label>
            </div>

            {createNewPerson ? (
              <div>
                <Label htmlFor="new-person-name">Name</Label>
                <Input
                  id="new-person-name"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="Enter person's name"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="person-select">Person</Label>
                <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a person" />
                  </SelectTrigger>
                  <SelectContent>
                    {people.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.full_name}
                        {person.birth_date && ' (birthday set)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Date Selection */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="unknown-year"
                checked={unknownYear}
                onCheckedChange={(checked) => setUnknownYear(checked === true)}
              />
              <Label htmlFor="unknown-year" className="text-sm">
                Year unknown (only month & day)
              </Label>
            </div>

            {unknownYear ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="birth-month">Month</Label>
                  <Select value={birthMonth} onValueChange={setBirthMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="birth-day">Day</Label>
                  <Select value={birthDay} onValueChange={setBirthDay}>
                    <SelectTrigger>
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="birth-date">Birth Date</Label>
                <Input
                  id="birth-date"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Birthday'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}