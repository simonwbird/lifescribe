import { useState } from 'react'
import { ChefHat, Package, Home, Heart, ChevronDown, FileText, Mic, Video, Camera, Plus } from 'lucide-react'
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

const contentTypes = [
  {
    icon: FileText,
    label: 'Text Story',
    description: 'Write a detailed story or memory',
    href: '/stories/new?type=text',
    category: 'content',
  },
  {
    icon: Mic,
    label: 'Voice Recording',
    description: 'Record an audio story or memory',
    href: '/stories/new?type=voice',
    category: 'content',
  },
  {
    icon: Video,
    label: 'Video Story',
    description: 'Record or upload a video memory',
    href: '/stories/new?type=video',
    category: 'content',
  },
  {
    icon: Camera,
    label: 'Photo Story',
    description: 'Share photos with descriptions',
    href: '/stories/new?type=photo',
    category: 'content',
  }
]

const collectionItems = [
  {
    icon: ChefHat,
    label: 'Recipe',
    description: 'Add a family recipe',
    href: '/recipes/new',
    labsRequired: true,
    feature: 'collections' as const,
    category: 'collection',
  },
  {
    icon: Package,
    label: 'Object',
    description: 'Catalog an heirloom',
    href: '/objects/new',
    labsRequired: true,
    feature: 'collections' as const,
    category: 'collection',
  },
  {
    icon: Home,
    label: 'Property',
    description: 'Document a property',
    href: '/properties/new',
    labsRequired: true,
    feature: 'collections' as const,
    category: 'collection',
  },
  {
    icon: Heart,
    label: 'Pet',
    description: 'Add a family pet',
    href: '/pets/new',
    labsRequired: true,
    feature: 'collections' as const,
    category: 'collection',
  }
]

const allCreateItems = [...contentTypes, ...collectionItems]

export default function CreateDropdown() {
  const [open, setOpen] = useState(false)
  const { track } = useAnalytics()
  const { labsEnabled, flags } = useLabs()
  const { flags: modeFlags } = useMode()

  const handleItemClick = (item: typeof allCreateItems[0]) => {
    track('create_item_selected', { type: item.label.toLowerCase(), category: item.category })
    setOpen(false)
  }

  const visibleContentTypes = contentTypes
  const visibleCollectionItems = collectionItems.filter(item => {
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
        className="w-72 p-2 bg-popover border border-border shadow-lg z-50"
        role="menu"
      >
        {/* Content Creation Section */}
        <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Create Content
        </div>
        {visibleContentTypes.map((item) => (
          <DropdownMenuItem key={item.label} className="p-0" role="none">
            <Link
              to={item.href}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md hover:bg-accent hover:text-accent-foreground group transition-colors"
              onClick={() => handleItemClick(item)}
              role="menuitem"
              title={item.description}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted group-hover:bg-accent-foreground/10">
                <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{item.label}</div>
                <div className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">
                  {item.description}
                </div>
              </div>
            </Link>
          </DropdownMenuItem>
        ))}

        {/* Collections Section - only show if labs enabled and has visible items */}
        {labsEnabled && visibleCollectionItems.length > 0 && (
          <>
            <div className="border-t border-border my-2" />
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Collections
            </div>
            {visibleCollectionItems.map((item) => (
              <DropdownMenuItem key={item.label} className="p-0" role="none">
                <Link
                  to={item.href}
                  className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-accent hover:text-accent-foreground group transition-colors"
                  onClick={() => handleItemClick(item)}
                  role="menuitem"
                  title={item.description}
                >
                  <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground" aria-hidden="true" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">
                      {item.description}
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}