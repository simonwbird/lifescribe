import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Calendar, 
  Check, 
  Trash2, 
  AlertCircle,
  Clock
} from 'lucide-react'
import { ReminderDialog } from './ReminderDialog'
import { useReminders, useCompleteReminder, useDeleteReminder } from '@/hooks/useReminders'
import { REMINDER_TYPES } from '@/lib/reminderTypes'
import type { PropertyReminder } from '@/lib/propertyTypes'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface PropertyUpkeepTabProps {
  propertyId: string
  familyId: string
}

export function PropertyUpkeepTab({ propertyId, familyId }: PropertyUpkeepTabProps) {
  const { data: reminders = [], isLoading } = useReminders(propertyId)
  const completeReminder = useCompleteReminder()
  const deleteReminder = useDeleteReminder()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const now = new Date()
  const upcoming = reminders.filter(r => !r.completed_at && new Date(r.due_at) >= now)
  const overdue = reminders.filter(r => !r.completed_at && new Date(r.due_at) < now)
  const completed = reminders.filter(r => r.completed_at)

  const getReminderIcon = (type: string) => {
    const reminderType = REMINDER_TYPES.find(t => t.value === type)
    return reminderType?.icon || '📋'
  }

  const getDaysUntil = (date: string) => {
    const dueDate = new Date(date)
    const diffTime = dueDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const ReminderCard = ({ reminder }: { reminder: PropertyReminder }) => {
    const daysUntil = getDaysUntil(reminder.due_at)
    const isOverdue = daysUntil < 0
    const isCompleted = !!reminder.completed_at

    return (
      <Card className={isCompleted ? 'opacity-60' : ''}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-2xl flex-shrink-0">
                  {getReminderIcon(reminder.type)}
                </span>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">
                    {reminder.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {new Date(reminder.due_at).toLocaleDateString()}
                    </span>
                    {!isCompleted && (
                      <Badge 
                        variant={isOverdue ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {isOverdue ? (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {Math.abs(daysUntil)} days overdue
                          </>
                        ) : daysUntil === 0 ? (
                          'Today'
                        ) : daysUntil === 1 ? (
                          'Tomorrow'
                        ) : (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            In {daysUntil} days
                          </>
                        )}
                      </Badge>
                    )}
                    {isCompleted && (
                      <Badge variant="outline" className="text-xs">
                        <Check className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                  {reminder.notes && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {reminder.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-1 flex-shrink-0">
              {!isCompleted && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => completeReminder.mutate(reminder.id)}
                  disabled={completeReminder.isPending}
                >
                  <Check className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDeleteId(reminder.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-h4 font-serif">Upkeep & Reminders</h3>
          <p className="text-body-sm text-muted-foreground">
            Track maintenance tasks and compliance deadlines
          </p>
        </div>
        <ReminderDialog propertyId={propertyId} familyId={familyId} />
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <div>
          <h4 className="text-h5 font-serif mb-3 flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            Overdue ({overdue.length})
          </h4>
          <div className="space-y-3">
            {overdue.map(reminder => (
              <ReminderCard key={reminder.id} reminder={reminder} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <h4 className="text-h5 font-serif mb-3">
            Upcoming ({upcoming.length})
          </h4>
          <div className="space-y-3">
            {upcoming.map(reminder => (
              <ReminderCard key={reminder.id} reminder={reminder} />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h4 className="text-h5 font-serif mb-3 text-muted-foreground">
            Completed ({completed.length})
          </h4>
          <div className="space-y-3">
            {completed.map(reminder => (
              <ReminderCard key={reminder.id} reminder={reminder} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {reminders.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-h5 font-serif mb-2">No reminders yet</h4>
            <p className="text-body-sm text-muted-foreground mb-4">
              Keep track of maintenance tasks, renewals, and compliance checks.
            </p>
            <ReminderDialog 
              propertyId={propertyId} 
              familyId={familyId}
              trigger={
                <Button>
                  <Calendar className="w-4 h-4 mr-2" />
                  Create First Reminder
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reminder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reminder? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteReminder.mutate({ id: deleteId, propertyId })
                  setDeleteId(null)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
