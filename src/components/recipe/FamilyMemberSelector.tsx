import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Badge } from '@/components/ui/badge'
import { Check, ChevronDown, Users, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface FamilyMember {
  id: string
  full_name: string
  given_name?: string
  surname?: string
}

interface FamilyMemberSelectorProps {
  value?: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  allowCustom?: boolean
}

export default function FamilyMemberSelector({
  value = '',
  onChange,
  label = 'Recipe Source',
  placeholder = 'Search family members or type custom...',
  allowCustom = true
}: FamilyMemberSelectorProps) {
  const [open, setOpen] = useState(false)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const { toast } = useToast()

  // Check if current value matches a family member
  const selectedMember = familyMembers.find(member => 
    member.full_name === value || `From ${member.full_name}` === value
  )

  useEffect(() => {
    loadFamilyMembers()
  }, [])

  const loadFamilyMembers = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's family ID
      const { data: member } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .single()

      if (!member) return

      // Get all family members
      const { data: people, error } = await supabase
        .from('people')
        .select('id, full_name, given_name, surname')
        .eq('family_id', member.family_id)
        .order('full_name')

      if (error) throw error

      setFamilyMembers(people || [])
    } catch (error) {
      console.error('Error loading family members:', error)
      toast({
        title: "Error loading family members",
        description: "Could not load your family members.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectMember = (member: FamilyMember) => {
    const sourceText = `From ${member.full_name}`
    onChange(sourceText)
    setOpen(false)
    setCustomInput('')
  }

  const handleCustomInput = (inputValue: string) => {
    setCustomInput(inputValue)
    onChange(inputValue)
  }

  const displayValue = selectedMember 
    ? `From ${selectedMember.full_name}`
    : value || ''

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between"
            >
              {displayValue ? (
                <div className="flex items-center gap-2">
                  {selectedMember && <Badge variant="secondary" className="text-xs">Family</Badge>}
                  <span className="truncate">{displayValue}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0">
            <Command>
              <CommandInput placeholder="Search family members..." />
              <CommandList>
                <CommandEmpty>
                  <div className="py-6 text-center text-sm">
                    <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p>No family members found</p>
                    <p className="text-muted-foreground text-xs">
                      Add family members in the Family Tree
                    </p>
                  </div>
                </CommandEmpty>
                <CommandGroup heading="Family Members">
                  {familyMembers.map((member) => (
                    <CommandItem
                      key={member.id}
                      onSelect={() => handleSelectMember(member)}
                      className="flex items-center gap-2"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          selectedMember?.id === member.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <Badge variant="outline" className="text-xs">
                          Family
                        </Badge>
                        <span>{member.full_name}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {allowCustom && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setOpen(false)
              // Focus would go to a custom input modal or inline input
            }}
            title="Add custom source"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Custom input mode */}
      {allowCustom && !selectedMember && (
        <div className="space-y-2">
          <Input
            placeholder="Or type a custom source (e.g., 'From Great Aunt Mary', 'Family cookbook')"
            value={!selectedMember ? value : ''}
            onChange={(e) => handleCustomInput(e.target.value)}
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            💡 Tip: Add family members to your Family Tree to select them easily
          </p>
        </div>
      )}

      {selectedMember && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary" className="text-xs">
            Connected to {selectedMember.full_name}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange('')
              setCustomInput('')
            }}
            className="h-auto p-0 text-xs hover:bg-transparent"
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  )
}