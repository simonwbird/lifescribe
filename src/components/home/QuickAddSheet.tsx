import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  Mic,
  FileText,
  Camera,
  ScanLine,
  Video,
  UtensilsCrossed,
  Gem,
  Calendar,
  StickyNote,
} from 'lucide-react'
import { useUnifiedDraftManager } from '@/hooks/useUnifiedDraftManager'
import { useToast } from '@/hooks/use-toast'

interface QuickAddSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CaptureOption {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  route?: string
  action?: () => void
  color: string
}

export default function QuickAddSheet({ open, onOpenChange }: QuickAddSheetProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const draftManager = useUnifiedDraftManager('quick_add')
  const [isCapturing, setIsCapturing] = useState(false)

  const handleStartCapture = (option: CaptureOption) => {
    if (option.action) {
      option.action()
      return
    }

    if (option.route) {
      onOpenChange(false)
      navigate(option.route)
    }
  }

  const captureOptions: CaptureOption[] = [
    {
      id: 'voice',
      title: 'Voice Story',
      description: 'Record a memory or story',
      icon: Mic,
      action: () => {
        onOpenChange(false)
        // Will open inline voice capture on current page
        toast({
          title: 'Voice Recording',
          description: 'Starting voice capture...',
        })
        // Trigger voice capture (could emit event or use context)
        window.dispatchEvent(new CustomEvent('open-voice-capture'))
      },
      color: 'text-blue-600',
    },
    {
      id: 'text',
      title: 'Text Story',
      description: 'Write a story or memory',
      icon: FileText,
      route: '/stories/new',
      color: 'text-purple-600',
    },
    {
      id: 'photos',
      title: 'Photo(s)',
      description: 'Upload or take photos',
      icon: Camera,
      route: '/photos/new',
      color: 'text-green-600',
    },
    {
      id: 'scan',
      title: 'Scan Old Photo',
      description: 'Digitize a printed photo',
      icon: ScanLine,
      route: '/photos/scan',
      color: 'text-amber-600',
    },
    {
      id: 'video',
      title: 'Short Video',
      description: 'Record a video memory',
      icon: Video,
      route: '/videos/new',
      color: 'text-red-600',
    },
    {
      id: 'recipe',
      title: 'Recipe',
      description: 'Save a family recipe',
      icon: UtensilsCrossed,
      route: '/recipes/new',
      color: 'text-orange-600',
    },
    {
      id: 'object',
      title: 'Object/Heirloom',
      description: 'Document a treasured item',
      icon: Gem,
      route: '/objects/new',
      color: 'text-pink-600',
    },
    {
      id: 'event',
      title: 'Event',
      description: 'Create a family event',
      icon: Calendar,
      route: '/events/new',
      color: 'text-indigo-600',
    },
    {
      id: 'note',
      title: 'Note/Checklist',
      description: 'Quick note or task list',
      icon: StickyNote,
      route: '/notes/new',
      color: 'text-teal-600',
    },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] bg-background">
        <SheetHeader>
          <SheetTitle className="text-2xl font-serif">Quick Add</SheetTitle>
          <SheetDescription>
            Choose what you'd like to capture or create
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3 pb-6">
          {captureOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.id}
                onClick={() => handleStartCapture(option)}
                className="flex flex-col items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary transition-all group"
              >
                <div className={`p-3 rounded-full bg-muted group-hover:scale-110 transition-transform ${option.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-sm">{option.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {option.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div className="text-sm text-muted-foreground">
              {draftManager.hasDrafts && (
                <span>
                  {draftManager.availableDrafts.length} draft
                  {draftManager.availableDrafts.length !== 1 ? 's' : ''} saved
                </span>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                navigate('/drafts')
              }}
            >
              View Drafts
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
