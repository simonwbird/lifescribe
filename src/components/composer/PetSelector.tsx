import { useState, useEffect } from 'react'
import { Check, X, PawPrint } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { usePets } from '@/hooks/usePets'

interface PetSelectorProps {
  familyId: string
  selectedPetIds: string[]
  onChange: (petIds: string[]) => void
  preselectedPetId?: string
}

export function PetSelector({ 
  familyId, 
  selectedPetIds, 
  onChange,
  preselectedPetId 
}: PetSelectorProps) {
  const [open, setOpen] = useState(false)
  const { data: pets = [] } = usePets(familyId)

  // Auto-select preselected pet on mount
  useEffect(() => {
    if (preselectedPetId && !selectedPetIds.includes(preselectedPetId)) {
      onChange([...selectedPetIds, preselectedPetId])
    }
  }, [preselectedPetId])

  const handleSelect = (petId: string) => {
    if (selectedPetIds.includes(petId)) {
      onChange(selectedPetIds.filter(id => id !== petId))
    } else {
      onChange([...selectedPetIds, petId])
    }
  }

  const handleRemove = (petId: string) => {
    onChange(selectedPetIds.filter(id => id !== petId))
  }

  const selectedPets = pets.filter(p => selectedPetIds.includes(p.id))

  return (
    <div className="space-y-2">
      <label className="text-body-sm font-medium text-foreground">
        Attach Pets
      </label>
      
      <div className="flex flex-wrap gap-2">
        {/* Selected pets as chips */}
        {selectedPets.map(pet => (
          <Badge 
            key={pet.id} 
            variant="secondary"
            className="gap-1 pl-2 pr-1 py-1"
          >
            <PawPrint className="w-3 h-3" />
            <span>{pet.name}</span>
            <button
              type="button"
              onClick={() => handleRemove(pet.id)}
              className="ml-1 rounded-full hover:bg-muted p-0.5"
            >
              <X className="w-3 h-3" />
              <span className="sr-only">Remove {pet.name}</span>
            </button>
          </Badge>
        ))}

        {/* Add pet button */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="h-7 px-2 text-xs"
            >
              <PawPrint className="w-3 h-3 mr-1" />
              {selectedPets.length === 0 ? 'Add Pet' : 'Add More'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search pets..." />
              <CommandList>
                <CommandEmpty>No pets found.</CommandEmpty>
                <CommandGroup>
                  {pets.map(pet => {
                    const isSelected = selectedPetIds.includes(pet.id)
                    return (
                      <CommandItem
                        key={pet.id}
                        value={pet.name}
                        onSelect={() => handleSelect(pet.id)}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                            isSelected ? 'bg-primary border-primary' : 'border-input'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                          <PawPrint className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{pet.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {typeof pet.species === 'string' 
                                ? pet.species.charAt(0).toUpperCase() + pet.species.slice(1).replace(/-/g, ' ')
                                : 'Pet'
                              }
                            </div>
                          </div>
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {selectedPets.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Tag pets to show this story in their timeline
        </p>
      )}
    </div>
  )
}
