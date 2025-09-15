import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Plus, Edit2 } from 'lucide-react'
import { Person, UserRole, canEdit, computeAge, nextBirthdayOccurrence } from '@/utils/personUtils'
import { format, differenceInDays } from 'date-fns'

interface DatesPanelProps {
  person: Person
  userRole: UserRole
  onPersonUpdated: () => void
}

export function DatesPanel({ person, userRole, onPersonUpdated }: DatesPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const canUserEdit = canEdit(userRole)
  
  const age = computeAge(person.birth_date, person.death_date)
  const nextBirthday = nextBirthdayOccurrence(person.birth_date)
  const daysUntilBirthday = nextBirthday ? differenceInDays(nextBirthday, new Date()) : null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Important Dates
        </CardTitle>
        {canUserEdit && (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add date
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Birthday */}
        {person.birth_date && (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Birthday</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(person.birth_date), 'MMMM d, yyyy')}
                {age && <span> • Age {age}</span>}
              </p>
              {daysUntilBirthday !== null && person.is_living !== false && (
                <Badge variant="outline" className="mt-1">
                  {daysUntilBirthday === 0 ? 'Today!' : `${daysUntilBirthday} days`}
                </Badge>
              )}
            </div>
            {canUserEdit && (
              <Button variant="ghost" size="sm">
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Death Date */}
        {person.death_date && (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Passed Away</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(person.death_date), 'MMMM d, yyyy')}
              </p>
            </div>
            {canUserEdit && (
              <Button variant="ghost" size="sm">
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* TODO: Render life events from life_events table */}
        
        {!person.birth_date && !person.death_date && (
          <p className="text-muted-foreground text-center py-4">
            No dates added yet
          </p>
        )}
      </CardContent>
    </Card>
  )
}