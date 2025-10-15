import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, Calendar, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PropertyReminder } from '@/lib/propertyTypes'

interface UpcomingUpkeepWidgetProps {
  reminders: (PropertyReminder & { property: { id: string; title: string } })[]
}

export function UpcomingUpkeepWidget({ reminders }: UpcomingUpkeepWidgetProps) {
  if (reminders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-h5">
            <Bell className="w-5 h-5" />
            Upcoming Upkeep
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body-sm text-muted-foreground text-center py-4">
            No upcoming reminders for the next 30 days
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-h5">
          <Bell className="w-5 h-5" />
          Upcoming Upkeep
          <Badge variant="secondary" className="ml-auto">
            {reminders.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reminders.slice(0, 5).map((reminder) => {
            const dueDate = new Date(reminder.due_at)
            const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            
            return (
              <Link
                key={reminder.id}
                to={`/properties/${reminder.property.id}`}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {reminder.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {reminder.property.title}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {daysUntil === 0 && 'Today'}
                    {daysUntil === 1 && 'Tomorrow'}
                    {daysUntil > 1 && `In ${daysUntil} days`}
                    {daysUntil < 0 && `${Math.abs(daysUntil)} days overdue`}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
