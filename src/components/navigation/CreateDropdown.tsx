import { useState } from 'react'
import { ChefHat, Package, Home, Heart, ChevronDown, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Link } from 'react-router-dom'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useLabs } from '@/hooks/useLabs'
import { useMode } from '@/contexts/ModeContext'

const createItems = [
  {
    icon: FileText,
    label: 'Full Story',
    description: 'Create a detailed story',
    href: '/stories/new',
    labsRequired: false,
  },
  {
    icon: ChefHat,
    label: 'Recipe',
    description: 'Add a family recipe',
    href: '/recipes/new',
    labsRequired: true,
    feature: 'collections' as const,
  },
  {
    icon: Package,
    label: 'Object',
    description: 'Catalog an heirloom',
    href: '/objects/new',
    labsRequired: true,
    feature: 'collections' as const,
  },
  {
    icon: Home,
    label: 'Property',
    description: 'Document a property',
    href: '/properties/new',
    labsRequired: true,
    feature: 'collections' as const,
  },
  {
    icon: Heart,
    label: 'Pet',
    description: 'Add a family pet',
    href: '/pets/new',
    labsRequired: true,
    feature: 'collections' as const,
  }
]

export default function CreateDropdown() {
  const [open, setOpen] = useState(false)
  const { track } = useAnalytics()
  const { labsEnabled, flags } = useLabs()
  const { flags: modeFlags } = useMode()

  const handleItemClick = (item: typeof createItems[0]) => {
    track('create_item_selected', { type: item.label.toLowerCase() })
    setOpen(false)
  }

  const visibleItems = createItems.filter(item => {
    if (!item.labsRequired) return true
    if (!labsEnabled) return false
    if (item.feature && !flags[item.feature]) return false
    return true
  })

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="hover:bg-accent hover:text-accent-foreground text-muted-foreground font-medium"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          Create New
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-64 p-2 bg-popover border border-border shadow-lg z-50"
        role="menu"
      >
        {visibleItems.map((item) => (
          <DropdownMenuItem key={item.label} className="p-0" role="none">
            <Link
              to={item.href}
              className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-accent hover:text-accent-foreground group"
              onClick={() => handleItemClick(item)}
              role="menuitem"
              title={item.description}
            >
              <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground" aria-hidden="true" />
              <div className="flex-1">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">
                  {item.description}
                </div>
              </div>
            </Link>
          </DropdownMenuItem>
        ))}
        
        {visibleItems.length === 0 && (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">
            No creation options available. Enable Labs in your profile to access more features.
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}