import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PromptBannerProps {
  promptTitle: string
  onDismiss: () => void
}

export function PromptBanner({ promptTitle, onDismiss }: PromptBannerProps) {
  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4 flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">
          Answering: <span className="font-semibold">{promptTitle}</span>
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDismiss}
        className="h-8 w-8 shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
