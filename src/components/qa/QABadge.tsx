import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'

interface QABadgeProps {
  ttfsSeconds: number | null
  className?: string
}

/**
 * QA badge that displays TTFS (Time to First Save) metrics
 * Only visible when ?qa=1 is in the URL
 */
export function QABadge({ ttfsSeconds, className }: QABadgeProps) {
  if (ttfsSeconds === null) {
    return null
  }

  return (
    <Badge 
      variant="outline" 
      className={`fixed bottom-4 right-4 z-50 bg-background/95 backdrop-blur-sm ${className}`}
    >
      <Clock className="h-3 w-3 mr-1" />
      TTFS: {ttfsSeconds.toFixed(2)}s
    </Badge>
  )
}
