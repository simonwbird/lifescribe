import { useState } from 'react'
import { Plus, FileText, Images, Mic, Video, ChefHat, Package, Home, Heart, ChevronDown } from 'lucide-react'
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
import QuickCaptureComposer from '@/components/capture/QuickCaptureComposer'

const quickCaptureItems = [
  {
    icon: FileText,
    label: 'Write',
    description: 'Quick text capture',
    mode: 'write' as const,
  },
  {
    icon: Images,
    label: 'Photo',
    description: 'Capture with photos',
    mode: 'photo' as const,
  },
  {
    icon: Mic,
    label: 'Voice',
    description: 'Record voice memo',
    mode: 'voice' as const,
  },
  {
    icon: Video,
    label: 'Video',
    description: 'Record video story',
    mode: 'video' as const,
  }
]

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
  const [showQuickCapture, setShowQuickCapture] = useState(false)
  const [quickCaptureMode, setQuickCaptureMode] = useState<'write' | 'photo' | 'voice' | 'video'>('write')
  const { track } = useAnalytics()

  const handleItemClick = (item: typeof createItems[0]) => {
    track('create_item_selected', { type: item.label.toLowerCase() })
    setOpen(false)
  }

  const handleQuickCapture = (mode?: 'write' | 'photo' | 'voice' | 'video') => {
    track('quick_capture_open', { mode: mode || 'default' })
    setQuickCaptureMode(mode || 'write')
    setShowQuickCapture(true)
    setOpen(false)
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            className="bg-brand-green hover:bg-brand-green/90 text-brand-green-foreground font-medium rounded-full px-4 py-2 gap-2 shadow-sm"
            aria-expanded={open}
            aria-haspopup="menu"
          >
            <Plus className="h-4 w-4" />
            Quick Capture
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className="w-64 p-2 bg-popover border border-border shadow-lg z-50"
          role="menu"
        >
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
            Quick Capture
          </DropdownMenuLabel>
          {quickCaptureItems.map((item) => (
            <DropdownMenuItem 
              key={item.label} 
              className="p-0 cursor-pointer" 
              role="none"
              onClick={() => handleQuickCapture(item.mode)}
            >
              <div className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-accent hover:text-accent-foreground group">
                <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground" aria-hidden="true" />
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">
                    {item.description}
                  </div>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
            Create New
          </DropdownMenuLabel>
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