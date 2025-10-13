import { useState, useEffect } from 'react'
import { X, Plus, User, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export interface PersonTag {
  personId: string
  personName: string
  role: 'subject' | 'appears' | 'mentioned' | 'author' | 'photographer' | 'videographer'
}

interface PeopleTaggerProps {
  familyId: string
  tags: PersonTag[]
  onChange: (tags: PersonTag[]) => void
  currentUserId?: string
}

interface Person {
  id: string
  given_name: string
  surname: string | null
}

export function PeopleTagger({ familyId, tags, onChange, currentUserId }: PeopleTaggerProps) {
  const { toast } = useToast()
  const [people, setPeople] = useState<Person[]>([])
  const [open, setOpen] = useState(false)
  const [showAddNew, setShowAddNew] = useState(false)
  const [newPersonName, setNewPersonName] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    loadPeople()
    
    // Add current user as author by default if not already tagged
    if (currentUserId && tags.length === 0) {
      loadCurrentUserPerson()
    }
  }, [familyId])

  async function loadPeople() {
    try {
      const { data, error } = await supabase
        .from('people')
        .select('id, given_name, surname')
        .eq('family_id', familyId)
        .order('given_name')

      if (error) throw error
      setPeople(data || [])
    } catch (error) {
      console.error('Failed to load people:', error)
    }
  }

  async function loadCurrentUserPerson() {
    try {
      const { data, error } = await supabase
        .from('person_user_links')
        .select('person_id, people:person_id(id, given_name, surname)')
        .eq('user_id', currentUserId)
        .eq('family_id', familyId)
        .single()

      if (!error && data?.people) {
        const person = data.people as any
        onChange([{
          personId: person.id,
          personName: `${person.given_name} ${person.surname || ''}`.trim(),
          role: 'author'
        }])
      }
    } catch (error) {
      console.error('Failed to load current user person:', error)
    }
  }

  async function handleAddNewPerson() {
    if (!newPersonName.trim()) return

    setIsAdding(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Parse name (simple: everything before last space = given_name, last word = surname)
      const nameParts = newPersonName.trim().split(' ')
      const surname = nameParts.length > 1 ? nameParts.pop() : null
      const given_name = nameParts.join(' ') || newPersonName.trim()

      const { data: person, error } = await supabase
        .from('people')
        .insert({
          family_id: familyId,
          given_name,
          surname,
          status: 'draft'
        } as any)
        .select()
        .single()

      if (error) throw error

      // Add to tags
      onChange([...tags, {
        personId: person.id,
        personName: newPersonName.trim(),
        role: 'subject'
      }])

      // Refresh people list
      setPeople([...people, person])
      setNewPersonName('')
      setShowAddNew(false)

      toast({
        title: 'Person added',
        description: `${newPersonName} has been added as a draft person.`
      })
    } catch (error: any) {
      console.error('Failed to add person:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to add person',
        variant: 'destructive'
      })
    } finally {
      setIsAdding(false)
    }
  }

  function handleAddTag(person: Person) {
    if (tags.some(t => t.personId === person.id)) return

    onChange([...tags, {
      personId: person.id,
      personName: `${person.given_name} ${person.surname || ''}`.trim(),
      role: 'subject'
    }])
    setOpen(false)
  }

  function handleRemoveTag(personId: string) {
    onChange(tags.filter(t => t.personId !== personId))
  }

  function handleRoleChange(personId: string, role: PersonTag['role']) {
    onChange(tags.map(t => t.personId === personId ? { ...t, role } : t))
  }

  const availablePeople = people.filter(p => !tags.some(t => t.personId === p.id))

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <div key={tag.personId} className="flex items-center gap-2 bg-secondary rounded-lg p-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{tag.personName}</span>
            <Select
              value={tag.role}
              onValueChange={(value) => handleRoleChange(tag.personId, value as PersonTag['role'])}
            >
              <SelectTrigger className="h-7 w-auto text-xs border-0 bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="subject">Subject</SelectItem>
                <SelectItem value="appears">Appears</SelectItem>
                <SelectItem value="mentioned">Mentioned</SelectItem>
                <SelectItem value="author">Author</SelectItem>
                <SelectItem value="photographer">Photographer</SelectItem>
                <SelectItem value="videographer">Videographer</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleRemoveTag(tag.personId)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Person
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0 bg-popover z-50" align="start">
            <Command>
              <CommandInput placeholder="Search people..." />
              <CommandList>
                <CommandEmpty>No people found.</CommandEmpty>
                <CommandGroup>
                  {availablePeople.map(person => (
                    <CommandItem
                      key={person.id}
                      onSelect={() => handleAddTag(person)}
                      className="cursor-pointer"
                    >
                      <User className="h-4 w-4 mr-2" />
                      {person.given_name} {person.surname || ''}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setShowAddNew(true)
                  setOpen(false)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add new person
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {showAddNew && (
        <div className="flex gap-2">
          <Input
            placeholder="Enter name..."
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddNewPerson()}
          />
          <Button
            size="sm"
            onClick={handleAddNewPerson}
            disabled={isAdding || !newPersonName.trim()}
          >
            Add
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowAddNew(false)
              setNewPersonName('')
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {tags.length === 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Consider tagging who this story is about
          </p>
        </div>
      )}
    </div>
  )
}
