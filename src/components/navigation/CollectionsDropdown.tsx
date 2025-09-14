import { useState } from 'react'
import { ChevronDown, FileText, ChefHat, Package, Heart, Home, Archive, Images, Video, Mic, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Link } from 'react-router-dom'
import { useAnalytics } from '@/hooks/useAnalytics'

const mediaItems = [
  {
    icon: FolderOpen,
    label: 'All Media',
    href: '/media'
  },
  {
    icon: Images,
    label: 'Photos',
    href: '/media?tab=photos'
  },
  {
    icon: Video,
    label: 'Videos',
    href: '/media?tab=videos'
  },
  {
    icon: Mic,
    label: 'Voice',
    href: '/media?tab=voice'
  },
  {
    icon: Archive,
    label: 'Albums',
    href: '/media/albums'
  }
]

const collectionItems = [
  {
    icon: FileText,
    label: 'Stories',
    href: '/collections?tab=story'
  },
  {
    icon: ChefHat,
    label: 'Recipes',
    href: '/collections?tab=recipe'
  },
  {
    icon: Package,
    label: 'Objects',
    href: '/collections?tab=object'
  },
  {
    icon: Heart,
    label: 'Pets',
    href: '/collections?tab=pet'
  },
  {
    icon: Home,
    label: 'Properties',
    href: '/collections?tab=property'
  }
]

export default function CollectionsDropdown() {
  const [open, setOpen] = useState(false)
  const { track } = useAnalytics()

  const handleItemClick = (item: typeof collectionItems[0]) => {
    track('collections_open', { type: item.label.toLowerCase() })
    setOpen(false)
  }

  const handleMediaClick = (item: typeof mediaItems[0]) => {
    track('collections_open', { type: item.label.toLowerCase() })
    setOpen(false)
  }

  const handleAllCollectionsClick = () => {
    track('collections_open', { type: 'all' })
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
          Collections
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-48 p-2 bg-popover border border-border shadow-lg z-50"
        role="menu"
      >
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
          Collections
        </DropdownMenuLabel>
        {collectionItems.map((item) => (
          <DropdownMenuItem key={item.label} className="p-0" role="none">
            <Link
              to={item.href}
              className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-accent hover:text-accent-foreground group"
              onClick={() => handleItemClick(item)}
              role="menuitem"
            >
              <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground" aria-hidden="true" />
              <span className="font-medium">{item.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="p-0" role="none">
          <Link
            to="/collections"
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-accent hover:text-accent-foreground group"
            onClick={handleAllCollectionsClick}
            role="menuitem"
          >
            <Archive className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground" aria-hidden="true" />
            <span className="font-medium">All Collections</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
          Media
        </DropdownMenuLabel>
        {mediaItems.map((item) => (
          <DropdownMenuItem key={item.label} className="p-0" role="none">
            <Link
              to={item.href}
              className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-accent hover:text-accent-foreground group"
              onClick={() => handleMediaClick(item)}
              role="menuitem"
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