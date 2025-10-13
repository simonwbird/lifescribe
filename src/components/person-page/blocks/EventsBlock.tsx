import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/design-system/EmptyState'
import { Calendar, Plus } from 'lucide-react'

interface EventsBlockProps {
  personId: string
  familyId: string
  blockContent?: any
  canEdit: boolean
  onUpdate?: () => void
}

export default function EventsBlock({
  personId,
  familyId,
  blockContent,
  canEdit,
  onUpdate
}: EventsBlockProps) {
  const handleCreateEvent = () => {
    // TODO: Implement event creation flow
    console.log('Create event for person:', personId)
  }

  return (
    <Card id="events">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={<Calendar className="h-6 w-6" />}
          title="No events yet"
          description="Track important dates, gatherings, and special occasions."
          action={canEdit ? {
            label: "Create Event",
            onClick: handleCreateEvent,
            variant: "default"
          } : undefined}
        />
      </CardContent>
    </Card>
  )
}
