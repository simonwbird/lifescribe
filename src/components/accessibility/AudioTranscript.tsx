import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AudioTranscriptProps {
  transcript: string
  title?: string
  className?: string
  defaultExpanded?: boolean
}

/**
 * Accessible audio transcript component
 * Ensures audio content is accessible to all users
 */
export function AudioTranscript({
  transcript,
  title = 'Transcript',
  className,
  defaultExpanded = false
}: AudioTranscriptProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  if (!transcript) {
    return null
  }

  return (
    <Card className={cn("mt-4", className)}>
      <CardHeader className="pb-3">
        <Button
          variant="ghost"
          className="w-full justify-between p-0 h-auto hover:bg-transparent"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="audio-transcript-content"
        >
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            {title}
          </CardTitle>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>

      {isExpanded && (
        <CardContent id="audio-transcript-content">
          <ScrollArea className="h-48 w-full rounded border bg-muted/50 p-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {transcript}
            </p>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  )
}
