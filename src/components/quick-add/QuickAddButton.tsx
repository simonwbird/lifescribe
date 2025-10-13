import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { QuickAddSheet } from './QuickAddSheet'
import { useAnalytics } from '@/hooks/useAnalytics'

export function QuickAddButton() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const navigate = useNavigate()
  const { track } = useAnalytics()

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input
      const target = e.target as HTMLElement
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      const isContentEditable = target.contentEditable === 'true'

      if (isInput || isContentEditable) return

      // C - Opens Quick Add Sheet
      if (e.key === 'c' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setSheetOpen(true)
        track('create_item_selected', { trigger: 'keyboard_c' })
      }

      // Shift+C - Opens dropdown
      if (e.key === 'C' && e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setDropdownOpen(true)
        track('create_select_story', { trigger: 'keyboard_shift_c' })
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [track])

  const handlePrimaryClick = () => {
    setSheetOpen(true)
    track('create_item_selected', { trigger: 'button_click' })
  }

  const quickLinks = [
    { label: 'Voice Story', route: '/compose/voice' },
    { label: 'Text Story', route: '/compose/text' },
    { label: 'Photo(s)', route: '/compose/photos' },
    { label: 'Recipe', route: '/recipes/new' },
    { label: 'Event', route: '/events/new' },
  ]

  return (
    <>
      <div className="flex items-center gap-0">
        {/* Primary Button */}
        <Button
          variant="default"
          size="sm"
          onClick={handlePrimaryClick}
          className="rounded-r-none pr-3 gap-1.5"
          aria-label="Quick Add - Press C"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create</span>
        </Button>

        {/* Dropdown Toggle */}
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="rounded-l-none border-l border-primary-foreground/20 px-1.5"
              aria-label="Create menu - Press Shift+C"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 bg-background">
            <DropdownMenuLabel>Quick Links</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {quickLinks.map((link) => (
              <DropdownMenuItem
                key={link.route}
                onClick={() => {
                  navigate(link.route)
                  track('create_item_selected', { 
                    type: link.label.toLowerCase().replace(/\s+/g, '_'),
                    trigger: 'dropdown',
                  })
                }}
              >
                {link.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handlePrimaryClick}>
              <Plus className="mr-2 h-4 w-4" />
              View all options...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <QuickAddSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  )
}
