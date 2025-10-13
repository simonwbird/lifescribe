import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Mic,
  PenTool,
  Camera,
  ScanLine,
  Video,
  Layers,
  UtensilsCrossed,
  Box,
  Calendar,
  StickyNote,
  Sparkles,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useAnalytics } from '@/hooks/useAnalytics'
import { cn } from '@/lib/utils'

interface QuickAddOption {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  route: string
  color: string
  badge?: string
}

interface QuickAddSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickAddSheet({ open, onOpenChange }: QuickAddSheetProps) {
  const navigate = useNavigate()
  const { track } = useAnalytics()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const options: QuickAddOption[] = [
    {
      id: 'voice',
      label: 'Voice Story',
      description: 'Record your story with audio',
      icon: <Mic className="h-5 w-5" />,
      route: '/compose/voice',
      color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20',
      badge: 'Popular',
    },
    {
      id: 'text',
      label: 'Text Story',
      description: 'Write a story or memory',
      icon: <PenTool className="h-5 w-5" />,
      route: '/compose/text',
      color: 'bg-green-500/10 text-green-600 hover:bg-green-500/20',
    },
    {
      id: 'photos',
      label: 'Photo(s)',
      description: 'Upload one or more photos',
      icon: <Camera className="h-5 w-5" />,
      route: '/compose/photos',
      color: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20',
    },
    {
      id: 'scan',
      label: 'Scan Old Photo',
      description: 'Digitize physical photos',
      icon: <ScanLine className="h-5 w-5" />,
      route: '/compose/scan',
      color: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20',
    },
    {
      id: 'video',
      label: 'Short Video',
      description: 'Record or upload a video clip',
      icon: <Video className="h-5 w-5" />,
      route: '/compose/video',
      color: 'bg-red-500/10 text-red-600 hover:bg-red-500/20',
    },
    {
      id: 'mixed',
      label: 'Mixed',
      description: 'Story with photos and videos',
      icon: <Layers className="h-5 w-5" />,
      route: '/compose/mixed',
      color: 'bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20',
    },
    {
      id: 'recipe',
      label: 'Recipe',
      description: 'Share a family recipe',
      icon: <UtensilsCrossed className="h-5 w-5" />,
      route: '/recipes/new',
      color: 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20',
    },
    {
      id: 'object',
      label: 'Object/Heirloom',
      description: 'Document a treasured item',
      icon: <Box className="h-5 w-5" />,
      route: '/objects/new',
      color: 'bg-teal-500/10 text-teal-600 hover:bg-teal-500/20',
    },
    {
      id: 'event',
      label: 'Event',
      description: 'Create a family event',
      icon: <Calendar className="h-5 w-5" />,
      route: '/events/new',
      color: 'bg-pink-500/10 text-pink-600 hover:bg-pink-500/20',
    },
    {
      id: 'note',
      label: 'Note/Checklist',
      description: 'Quick note or to-do list',
      icon: <StickyNote className="h-5 w-5" />,
      route: '/notes/new',
      color: 'bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20',
    },
  ]

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % options.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + options.length) % options.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleOptionClick(options[selectedIndex])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, selectedIndex, options])

  // Reset selection when opened
  useEffect(() => {
    if (open) {
      setSelectedIndex(0)
    }
  }, [open])

  const handleOptionClick = (option: QuickAddOption) => {
    track('create_item_selected', {
      type: option.id,
      route: option.route,
    })
    onOpenChange(false)
    navigate(option.route)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-xl overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Quick Add
          </SheetTitle>
          <SheetDescription>
            Choose what you'd like to create
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 grid gap-3">
          {options.map((option, index) => (
            <Button
              key={option.id}
              variant="outline"
              className={cn(
                "h-auto p-4 justify-start text-left transition-all",
                selectedIndex === index && "ring-2 ring-primary ring-offset-2",
                option.color
              )}
              onClick={() => handleOptionClick(option)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-start gap-4 w-full">
                <div className="flex-shrink-0 p-2 rounded-lg bg-background/50">
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{option.label}</h3>
                    {option.badge && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {option.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
            </Button>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-muted/50 text-xs text-muted-foreground">
          <p className="font-medium mb-2">Keyboard shortcuts:</p>
          <ul className="space-y-1">
            <li>↑↓ Navigate options</li>
            <li>Enter Select option</li>
            <li>Esc Close</li>
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  )
}
