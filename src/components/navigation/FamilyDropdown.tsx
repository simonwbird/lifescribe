import { useState } from 'react'
import { ChevronDown, Users, TreePine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Link } from 'react-router-dom'
import { useAnalytics } from '@/hooks/useAnalytics'

const familyItems = [
  {
    icon: Users,
    label: 'People',
    description: 'View family members',
    href: '/family/members'
  },
  {
    icon: TreePine,
    label: 'Tree',
    description: 'Explore family tree',
    href: '/family/tree'
  }
]

export default function FamilyDropdown() {
  const [open, setOpen] = useState(false)
  const { track } = useAnalytics()

  const handleItemClick = (item: typeof familyItems[0]) => {
    track('family_menu_selected', { type: item.label.toLowerCase() })
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="gap-1 hover:bg-accent hover:text-accent-foreground"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          Family
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-48 p-2 bg-popover border border-border shadow-lg"
        role="menu"
      >
        {familyItems.map((item) => (
          <DropdownMenuItem key={item.label} className="p-0" role="none">
            <Link
              to={item.href}
              className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-accent hover:text-accent-foreground group"
              onClick={() => handleItemClick(item)}
              role="menuitem"
              title={item.description}
            >
              <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground" aria-hidden="true" />
              <span className="font-medium">{item.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}