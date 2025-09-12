import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Check, X, Plus, Users, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Person {
  id: string
  full_name: string
  given_name?: string
  surname?: string
  birth_year?: number
  death_year?: number
}

interface SelectedPerson {
  id?: string // undefined for new people not yet in database
  name: string
  isExisting: boolean
}

interface PeoplePickerProps {
  selectedPeople: SelectedPerson[]
  onPeopleChange: (people: SelectedPerson[]) => void
  familyId: string | null
}

export default function PeoplePicker({ selectedPeople, onPeopleChange, familyId }: PeoplePickerProps) {
  const [open, setOpen] = useState(false)
  const [familyMembers, setFamilyMembers] = useState<Person[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (familyId) {
      fetchFamilyMembers()
    }
  }, [familyId])

  const fetchFamilyMembers = async () => {
    if (!familyId) return
    
    setIsLoading(true)
    try {
      const { data: people, error } = await supabase
        .from('people')
        .select('id, full_name, given_name, surname, birth_year, death_year')
        .eq('family_id', familyId)
        .order('full_name')

      if (error) throw error
      setFamilyMembers(people || [])
    } catch (error) {
      console.error('Error fetching family members:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPerson = (person: SelectedPerson) => {
    if (!selectedPeople.some(p => p.name === person.name)) {
      onPeopleChange([...selectedPeople, person])
    }
    setInputValue('')
    setOpen(false)
  }

  const handleRemovePerson = (personToRemove: SelectedPerson) => {
    onPeopleChange(selectedPeople.filter(p => p.name !== personToRemove.name))
  }

  const handleCreateNew = () => {
    if (inputValue.trim()) {
      const newPerson: SelectedPerson = {
        name: inputValue.trim(),
        isExisting: false
      }
      handleAddPerson(newPerson)
    }
  }

  const formatPersonDisplay = (person: Person) => {
    let display = person.full_name
    if (person.birth_year || person.death_year) {
      const birth = person.birth_year || '?'
      const death = person.death_year || (person.death_year === null ? '' : '?')
      display += ` (${birth}${death ? ` - ${death}` : ''})`
    }
    return display
  }

  const filteredMembers = familyMembers.filter(person => 
    person.full_name.toLowerCase().includes(inputValue.toLowerCase()) &&
    !selectedPeople.some(p => p.name === person.full_name)
  )

  const exactMatch = familyMembers.find(person => 
    person.full_name.toLowerCase() === inputValue.toLowerCase()
  )

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Users className="h-4 w-4" />
        Who's in this story?
      </Label>
      
      <div className="space-y-3">
        {/* Selected People */}
        {selectedPeople.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedPeople.map((person, index) => (
              <Badge key={index} variant={person.isExisting ? "default" : "secondary"} className="flex items-center gap-1 pr-1">
                <User className="h-3 w-3" />
                {person.name}
                {!person.isExisting && <span className="text-xs opacity-75">(new)</span>}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleRemovePerson(person)}
                  aria-label={`Remove ${person.name}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {/* People Picker */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between text-muted-foreground"
            >
              <div className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Search family members or add someone new...
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 bg-background border shadow-lg" align="start">
            <Command>
              <CommandInput 
                placeholder="Search family members or type a name..." 
                value={inputValue}
                onValueChange={setInputValue}
              />
              <CommandList>
                {filteredMembers.length === 0 && inputValue.trim() === '' && (
                  <CommandEmpty>
                    {isLoading ? 'Loading family members...' : 'No family members found. Start typing to add someone.'}
                  </CommandEmpty>
                )}

                {/* Existing Family Members */}
                {filteredMembers.length > 0 && (
                  <CommandGroup heading="Family Members">
                    {filteredMembers.map((person) => (
                      <CommandItem
                        key={person.id}
                        value={person.full_name}
                        onSelect={() => handleAddPerson({ 
                          id: person.id, 
                          name: person.full_name, 
                          isExisting: true 
                        })}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedPeople.some(p => p.name === person.full_name) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <User className="mr-2 h-3 w-3 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span>{person.full_name}</span>
                          {(person.birth_year || person.death_year) && (
                            <span className="text-xs text-muted-foreground">
                              {person.birth_year || '?'}{person.death_year ? ` - ${person.death_year}` : ''}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Add New Person */}
                {inputValue.trim() && !exactMatch && (
                  <CommandGroup heading="Add New Person">
                    <CommandItem
                      value={`create-${inputValue}`}
                      onSelect={handleCreateNew}
                      className="cursor-pointer"
                    >
                      <Plus className="mr-2 h-4 w-4 text-green-500" />
                      <User className="mr-2 h-3 w-3 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span>Add "{inputValue.trim()}"</span>
                        <span className="text-xs text-muted-foreground">Will be added to family tree</span>
                      </div>
                    </CommandItem>
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <p className="text-sm text-muted-foreground">
          Add family members, friends, or anyone mentioned in your story. Existing family members will be linked to their profiles.
        </p>
      </div>
    </div>
  )
}
