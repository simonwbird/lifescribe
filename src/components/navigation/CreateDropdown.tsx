import { useState } from 'react'
import { Plus, FileText, Images, Mic, ChefHat, Package, Home, MessageSquare, Heart, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Link } from 'react-router-dom'
import { useAnalytics } from '@/hooks/useAnalytics'
import QuickCaptureComposer from '@/components/capture/QuickCaptureComposer'

const createItems = [
  {
    icon: FileText,
    label: 'Story',
    description: 'Share a memory or moment',
    href: '/stories/new',
    shortcut: 'S'
  },
  {
    icon: Images,
    label: 'Photo album',
    description: 'Upload and organize photos',
    href: '/photos/new',
    shortcut: 'P'
  },
  {
    icon: Mic,
    label: 'Voice note',
    description: 'Record audio memories',
    href: '/audio/new',
    shortcut: 'V'
  },
  {
    icon: ChefHat,
    label: 'Recipe',
    description: 'Add a family recipe',
    href: '/recipes/new',
    shortcut: 'R'
  },
  {
    icon: Package,
    label: 'Object',
    description: 'Catalog an heirloom or item',
    href: '/objects/new',
    shortcut: 'O'
  },
  {
    icon: Home,
    label: 'Property',
    description: 'Document a family property',
    href: '/properties/new',
    shortcut: 'Y'
  },
  {
    icon: Heart,
    label: 'Pet',
    description: 'Add a beloved family pet',
    href: '/pets/new',
    shortcut: 'T'
  },
  {
    icon: MessageSquare,
    label: 'Prompt response',
    description: 'Answer a family question',
    href: '/prompts/browse',
    shortcut: 'Q'
  }
]

export default function CreateDropdown() {
  const [open, setOpen] = useState(false)
  const [showQuickCapture, setShowQuickCapture] = useState(false)
  const { track } = useAnalytics()

  const handleItemClick = (item: typeof createItems[0]) => {
    track('create_item_selected', { type: item.label.toLowerCase() })
    setOpen(false)
  }

  const handleQuickCapture = () => {
    track('quick_capture_open')
    setShowQuickCapture(true)
  }

  return (
    <>
      <div className="flex items-center">
        {/* Primary Quick Capture Button */}
        <Button
          onClick={handleQuickCapture}
          className="bg-brand-green hover:bg-brand-green/90 text-brand-green-foreground font-medium rounded-l-full px-4 py-2 gap-2 rounded-r-none border-r border-brand-green-foreground/20"
        >
          <Plus className="h-4 w-4" />
          Create
        </Button>

        {/* Dropdown Caret */}
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              className="bg-brand-green hover:bg-brand-green/90 text-brand-green-foreground font-medium rounded-r-full rounded-l-none px-2 py-2 border-l border-brand-green-foreground/20"
              aria-expanded={open}
              aria-haspopup="menu"
              size="sm"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="w-64 p-2 bg-popover border border-border shadow-lg"
            role="menu"
          >
            {createItems.map((item) => (
              <DropdownMenuItem key={item.label} className="p-0" role="none">
                <Link
                  to={item.href}
                  className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-accent hover:text-accent-foreground group"
                  onClick={() => handleItemClick(item)}
                  role="menuitem"
                  title={`${item.description} (${item.shortcut})`}
                >
                  <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground" aria-hidden="true" />
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">
                      {item.description}
                    </div>
                  </div>
                  <kbd className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {item.shortcut}
                  </kbd>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick Capture Composer */}
      <QuickCaptureComposer
        isOpen={showQuickCapture}
        onClose={() => setShowQuickCapture(false)}
        onSave={() => {
          // Handle successful save
        }}
      />
    </>
  )
}