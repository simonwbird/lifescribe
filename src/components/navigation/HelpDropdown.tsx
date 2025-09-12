import { useState } from 'react'
import { ChevronDown, Keyboard, FileText, MessageCircle, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAnalytics } from '@/hooks/useAnalytics'

const helpItems = [
  {
    icon: Keyboard,
    label: 'Keyboard shortcuts',
    action: 'shortcuts'
  },
  {
    icon: FileText,
    label: "What's new",
    action: 'changelog'
  },
  {
    icon: MessageCircle,
    label: 'Send feedback',
    action: 'feedback'
  }
]

interface HelpDropdownProps {
  onShortcutsOpen: () => void
}

export default function HelpDropdown({ onShortcutsOpen }: HelpDropdownProps) {
  const [open, setOpen] = useState(false)
  const { track } = useAnalytics()

  const handleItemClick = (action: string) => {
    track('help_open', { type: action })
    
    switch (action) {
      case 'shortcuts':
        onShortcutsOpen()
        break
      case 'changelog':
        // Open changelog modal or navigate to changelog page
        console.log('Opening changelog...')
        break
      case 'feedback':
        // Open feedback form or external link
        console.log('Opening feedback form...')
        break
    }
    
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="hover:bg-accent hover:text-accent-foreground"
          aria-label="Help and support"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 p-2 bg-popover border border-border shadow-lg"
        role="menu"
      >
        {helpItems.map((item) => (
          <DropdownMenuItem key={item.action} className="p-0" role="none">
            <button
              className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-accent hover:text-accent-foreground group text-left"
              onClick={() => handleItemClick(item.action)}
              role="menuitem"
            >
              <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground" aria-hidden="true" />
              <span className="font-medium">{item.label}</span>
            </button>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}