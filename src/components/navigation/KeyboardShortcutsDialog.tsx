import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

const shortcuts = [
  {
    category: 'Navigation',
    items: [
      { keys: ['G', 'H'], description: 'Go to Home' },
      { keys: ['⌘', 'K'], description: 'Command Palette' },
      { keys: ['/'], description: 'Focus Search' },
      { keys: ['?'], description: 'Show shortcuts' },
    ]
  },
  {
    category: 'Create',
    items: [
      { keys: ['C'], description: 'Open Create menu' },
      { keys: ['S'], description: 'Create Story' },
      { keys: ['P'], description: 'Create Photo Album' },
      { keys: ['V'], description: 'Create Voice Note' },
      { keys: ['R'], description: 'Create Recipe' },
      { keys: ['O'], description: 'Create Object' },
      { keys: ['Y'], description: 'Create Property' },
      { keys: ['T'], description: 'Create Pet' },
      { keys: ['Q'], description: 'Answer Prompt' },
    ]
  }
]

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {shortcuts.map((category) => (
            <div key={category.category}>
              <h3 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wider">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.items.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <Badge key={keyIndex} variant="outline" className="text-xs px-2 py-1">
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}