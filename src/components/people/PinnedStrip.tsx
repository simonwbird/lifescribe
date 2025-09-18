import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pin, PinOff, Plus } from 'lucide-react'
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
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Pin className="h-6 w-6 text-amber-600" />
              </div>
              <p className="text-sm font-medium mb-1">Pin your first highlight</p>
              <p className="text-xs text-muted-foreground mb-3">
                Choose important stories to feature here
              </p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i <= 1 ? 'bg-brand-400' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground ml-2">0/5 highlights</span>
              </div>
              {canUserEdit && (
                <Button size="sm" variant="outline">
                  <Plus className="h-3 w-3 mr-1" />
                  Browse Timeline
                </Button>
              )}
            </div>
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