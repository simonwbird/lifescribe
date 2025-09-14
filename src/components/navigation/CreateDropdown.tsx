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

const createItems = [
  {
    icon: FileText,
    label: 'Full Story',
    description: 'Create a detailed story',
    href: '/stories/new',
  },
  {
    icon: ChefHat,
    label: 'Recipe',
    description: 'Add a family recipe',
    href: '/recipes/new',
  },
  {
    icon: Package,
    label: 'Object',
    description: 'Catalog an heirloom',
    href: '/objects/new',
  },
  {
    icon: Home,
    label: 'Property',
    description: 'Document a property',
    href: '/properties/new',
  },
  {
    icon: Heart,
    label: 'Pet',
    description: 'Add a family pet',
    href: '/pets/new',
  }
]

export default function CreateDropdown() {
  const [open, setOpen] = useState(false)
  const { track } = useAnalytics()

  const handleItemClick = (item: typeof createItems[0]) => {
    track('create_item_selected', { type: item.label.toLowerCase() })
    setOpen(false)
  }

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
        {createItems.map((item) => (
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}