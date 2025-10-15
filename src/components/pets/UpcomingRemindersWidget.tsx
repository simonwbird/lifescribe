import { useUpcomingReminders } from '@/hooks/usePetReminders'
import { usePets } from '@/hooks/usePets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Bell, Calendar } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { REMINDER_TYPES } from '@/lib/petReminderTypes'

interface UpcomingRemindersWidgetProps {
  familyId: string | null
}

export function UpcomingRemindersWidget({ familyId }: UpcomingRemindersWidgetProps) {
  const { data: reminders, isLoading } = useUpcomingReminders(familyId)
  const { data: pets } = usePets(familyId)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Next 7 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!reminders || reminders.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Upcoming Pet Care
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reminders.slice(0, 5).map((reminder) => {
          const pet = pets?.find(p => p.id === reminder.petId)
          const typeLabel = REMINDER_TYPES.find(t => t.value === reminder.type)?.label || reminder.type
          const daysUntil = differenceInDays(new Date(reminder.dueDate), new Date())
          
          return (
            <div key={reminder.id} className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
              <Bell className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-medium text-sm">{reminder.title}</p>
                  {daysUntil === 0 && <Badge variant="default" className="text-xs">Today</Badge>}
                  {daysUntil === 1 && <Badge variant="secondary" className="text-xs">Tomorrow</Badge>}
                  {daysUntil > 1 && <Badge variant="outline" className="text-xs">{daysUntil}d</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {pet?.name} • {typeLabel}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(reminder.dueDate), 'MMM d')}
                </p>
              </div>
            </div>
          )
        })}
        {reminders.length > 5 && (
          <p className="text-xs text-center text-muted-foreground pt-2">
            +{reminders.length - 5} more upcoming
          </p>
        )}
      </CardContent>
    </Card>
  )
}
