import { Check, Loader2 } from 'lucide-react'
import { SaveStatus } from '@/hooks/useSaveStatus'

interface SaveStatusBadgeProps {
  status: SaveStatus
}

export function SaveStatusBadge({ status }: SaveStatusBadgeProps) {
  if (status === 'idle') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Check className="h-4 w-4" />
        <span>All changes saved</span>
      </div>
    )
  }

  if (status === 'saving') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Saving...</span>
      </div>
    )
  }

  if (status === 'saved') {
    return (
      <div className="flex items-center gap-2 text-sm text-success">
        <Check className="h-4 w-4" />
        <span>Saved</span>
      </div>
    )
  }

  return null
}
