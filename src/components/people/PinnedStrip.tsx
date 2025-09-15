import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pin, PinOff } from 'lucide-react'
import { Person, UserRole, canEdit } from '@/utils/personUtils'

interface PinnedStripProps {
  person: Person
  userRole: UserRole
  onPersonUpdated: () => void
}

export function PinnedStrip({ person, userRole, onPersonUpdated }: PinnedStripProps) {
  const canUserEdit = canEdit(userRole)
  const pinnedIds = person.pinned_story_ids || []

  if (pinnedIds.length === 0 && !canUserEdit) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pin className="h-5 w-5" />
          Pinned Highlights
          <Badge variant="secondary">{pinnedIds.length}/5</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pinnedIds.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No pinned highlights yet. Pin important stories, photos, or memories from the timeline below.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* TODO: Render pinned story/media cards */}
            {pinnedIds.map((id, index) => (
              <div key={id} className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Pinned Item {index + 1}</p>
                <p className="text-xs text-muted-foreground">ID: {id}</p>
                {canUserEdit && (
                  <Button variant="ghost" size="sm" className="mt-2">
                    <PinOff className="h-4 w-4 mr-1" />
                    Unpin
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}