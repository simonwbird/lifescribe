import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePets } from '@/hooks/usePets'
import { supabase } from '@/integrations/supabase/client'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { 
  FileText, 
  Images, 
  Mic, 
  ChefHat, 
  Package, 
  Home, 
  Heart, 
  MessageSquare,
  Users,
  TreePine,
  Archive,
  User
} from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'

type CommandPaletteItem = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  group: string
}

const navigationItems: CommandPaletteItem[] = [
  { icon: Home, label: 'Go to Home', href: '/home', group: 'Navigation' },
  { icon: Users, label: 'Go to People', href: '/family/members', group: 'Navigation' },
  { icon: TreePine, label: 'Go to Tree', href: '/family/tree', group: 'Navigation' },
  { icon: Archive, label: 'Go to Collections', href: '/collections', group: 'Navigation' },
  { icon: MessageSquare, label: 'Go to Prompts', href: '/prompts', group: 'Navigation' },
  { icon: Heart, label: 'Open Pets', href: '/pets', group: 'Navigation' },
  { icon: User, label: 'Go to Profile', href: '/profile', group: 'Navigation' },
]

const createItems: CommandPaletteItem[] = [
  { icon: FileText, label: 'Create Story', href: '/stories/new', group: 'Create' },
  { icon: Images, label: 'Create Photo Album', href: '/photos/new', group: 'Create' },
  { icon: Mic, label: 'Create Voice Note', href: '/audio/new', group: 'Create' },
  { icon: ChefHat, label: 'Create Recipe', href: '/recipes/new', group: 'Create' },
  { icon: Package, label: 'Create Object', href: '/objects/new', group: 'Create' },
  { icon: Home, label: 'Create Property', href: '/properties/new', group: 'Create' },
  { icon: Heart, label: 'Add Pet', href: '/pets/new', group: 'Create' },
  { icon: MessageSquare, label: 'Answer Prompt', href: '/prompts/browse', group: 'Create' },
]

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { track } = useAnalytics()
  const [query, setQuery] = useState('')
  const [familyId, setFamilyId] = useState<string | null>(null)

  useEffect(() => {
    const loadFamily = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: member } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .single()

      if (member) {
        setFamilyId(member.family_id)
      }
    }

    loadFamily()
  }, [])

  const { data: pets } = usePets(familyId)

  useEffect(() => {
    if (open) {
      track('command_palette_open')
    }
  }, [open, track])

  const handleSelect = (href: string, label: string) => {
    track('search_result_click', { 
      query, 
      result: label.toLowerCase(),
      source: 'command_palette' 
    })
    navigate(href)
    onOpenChange(false)
    setQuery('')
  }

  // Add contextual actions based on current page
  const getContextualActions = (): CommandPaletteItem[] => {
    const contextual: CommandPaletteItem[] = []
    
    // Add memory/photo/object actions when on detail pages
    if (location.pathname.includes('/people/') || 
        location.pathname.includes('/properties/') ||
        location.pathname.includes('/pets/')) {
      contextual.push(
        { icon: FileText, label: 'Add memory here', href: '/stories/new', group: 'Context' },
        { icon: Images, label: 'Add photo here', href: '/photos/new', group: 'Context' },
        { icon: Package, label: 'Add object here', href: '/objects/new', group: 'Context' }
      )
    }
    
    return contextual
  }

  // Add pet-specific actions
  const getPetActions = (): CommandPaletteItem[] => {
    if (!pets || pets.length === 0) return []
    
    return pets.slice(0, 5).map(pet => ({
      icon: Heart,
      label: `Add memory for ${pet.name}`,
      href: `/stories/new?petId=${pet.id}`,
      group: 'Pets'
    }))
  }

  const allItems = [...navigationItems, ...createItems, ...getContextualActions(), ...getPetActions()]
  const groups = allItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {} as Record<string, CommandPaletteItem[]>)

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Type a command or search..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {Object.entries(groups).map(([groupName, items]) => (
          <CommandGroup key={groupName} heading={groupName}>
            {items.map((item) => (
              <CommandItem
                key={item.href}
                value={item.label}
                onSelect={() => handleSelect(item.href, item.label)}
                className="flex items-center gap-2"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}