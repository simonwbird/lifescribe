import { useState } from 'react'
import { FileText, Mic, Video, Camera, Plus, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import { useAnalytics } from '@/hooks/useAnalytics'
import { cn } from '@/lib/utils'

const primaryContentTypes = [
  {
    icon: FileText,
    label: 'Text Story',
    description: 'Write a detailed story or memory',
    href: '/stories/new?type=text',
    shortcut: 'T',
    color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
  },
  {
    icon: Mic,
    label: 'Audio Story',
    description: 'Record an audio story',
    href: '/stories/new?type=audio',
    shortcut: 'A',
    color: 'bg-red-50 text-red-600 hover:bg-red-100',
  },
  {
    icon: Video,
    label: 'Video Story',
    description: 'Record or upload a video',
    href: '/stories/new?type=video',
    shortcut: 'V',
    color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
  },
  {
    icon: Camera,
    label: 'Photo Story',
    description: 'Share photos with descriptions',
    href: '/stories/new?type=photo',
    shortcut: 'P',
    color: 'bg-green-50 text-green-600 hover:bg-green-100',
  }
]

export default function EnhancedCreateDropdown() {
  const [open, setOpen] = useState(false)
  const { track } = useAnalytics()

  const handleItemClick = (item: typeof primaryContentTypes[0]) => {
    track('create_item_selected', { 
      type: item.label.toLowerCase()
    })
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-dashed border-2 hover:border-solid hover:bg-accent"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <Plus className="h-4 w-4" />
          Create New
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="center" 
        className="w-80 p-3 bg-popover border border-border shadow-xl z-50"
        role="menu"
      >
        <div className="text-sm font-semibold mb-3 text-center">What would you like to create?</div>
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          {primaryContentTypes.map((item) => (
            <DropdownMenuItem key={item.label} className="p-0" role="none">
              <Link
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 w-full rounded-lg border-2 border-transparent transition-all group",
                  item.color
                )}
                onClick={() => handleItemClick(item)}
                role="menuitem"
                title={`${item.description} (${item.shortcut})`}
              >
                <div className="relative">
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs font-bold"
                  >
                    {item.shortcut}
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs opacity-80 mt-0.5">
                    {item.description}
                  </div>
                </div>
              </Link>
            </DropdownMenuItem>
          ))}
        </div>
        
        <DropdownMenuSeparator />
        
        <div className="text-xs text-muted-foreground text-center mt-2">
          💡 Pro tip: Use keyboard shortcuts or press <kbd className="px-1 py-0.5 bg-muted rounded">C</kbd> for quick voice recording
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}