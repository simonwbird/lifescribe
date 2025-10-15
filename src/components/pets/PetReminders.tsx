import { useState } from 'react'
import { usePetReminders, useCompleteReminder, useDeleteReminder } from '@/hooks/usePetReminders'
import { AddReminderModal } from './AddReminderModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Check, Trash2, Bell, Calendar } from 'lucide-react'
import { format, isPast, isToday, isTomorrow, isWithinInterval, addDays } from 'date-fns'
import { REMINDER_TYPES } from '@/lib/petReminderTypes'
import { useToast } from '@/hooks/use-toast'
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

interface PetRemindersProps {
  petId: string
  petName: string
}

export function PetReminders({ petId, petName }: PetRemindersProps) {
  const { toast } = useToast()
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  
  const { data: reminders, isLoading } = usePetReminders(petId)
  const completeReminder = useCompleteReminder()
  const deleteReminder = useDeleteReminder()

  const upcomingReminders = reminders?.filter(r => r.status === 'pending' && !isPast(new Date(r.dueDate))) || []
  const pastReminders = reminders?.filter(r => r.status === 'completed' || isPast(new Date(r.dueDate))) || []

  const handleComplete = async (id: string) => {
    try {
      await completeReminder.mutateAsync(id)
      toast({
        title: 'Reminder completed',
        description: 'Marked as done',
      })
    } catch (error) {
      console.error('Error completing reminder:', error)
      toast({
        title: 'Error',
        description: 'Failed to complete reminder',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await deleteReminder.mutateAsync({ id: deleteId, petId })
      toast({
        title: 'Reminder deleted',
      })
      setDeleteId(null)
    } catch (error) {
      console.error('Error deleting reminder:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete reminder',
        variant: 'destructive',
      })
    }
  }

  const getReminderBadge = (dueDate: string) => {
    const date = new Date(dueDate)
    
    if (isPast(date)) {
      return <Badge variant="destructive">Overdue</Badge>
    }
    if (isToday(date)) {
      return <Badge variant="default">Today</Badge>
    }
    if (isTomorrow(date)) {
      return <Badge variant="secondary">Tomorrow</Badge>
    }
    if (isWithinInterval(date, { start: new Date(), end: addDays(new Date(), 7) })) {
      return <Badge variant="outline">This week</Badge>
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pet Care Reminders</h3>
        <Button onClick={() => setShowAddModal(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Reminder
        </Button>
      </div>

      {/* Upcoming Reminders */}
      {upcomingReminders.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Upcoming</h4>
          {upcomingReminders.map((reminder) => {
            const typeLabel = REMINDER_TYPES.find(t => t.value === reminder.type)?.label || reminder.type
            
            return (
              <Card key={reminder.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Bell className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <h5 className="font-medium">{reminder.title}</h5>
                        {getReminderBadge(reminder.dueDate)}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(reminder.dueDate), 'PPP')} • {typeLabel}
                        </p>
                        {reminder.notes && (
                          <p className="text-xs">{reminder.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleComplete(reminder.id)}
                        disabled={completeReminder.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteId(reminder.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Past Reminders */}
      {pastReminders.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Past</h4>
          {pastReminders.slice(0, 5).map((reminder) => {
            const typeLabel = REMINDER_TYPES.find(t => t.value === reminder.type)?.label || reminder.type
            
            return (
              <Card key={reminder.id} className="opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <h5 className="font-medium line-through">{reminder.title}</h5>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>
                          {format(new Date(reminder.dueDate), 'PPP')} • {typeLabel}
                        </p>
                        {reminder.status === 'completed' && (
                          <p className="text-xs">
                            Completed
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteId(reminder.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && reminders?.length === 0 && (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-2">No reminders yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first one to track vaccinations, vet visits, and more
          </p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Reminder
          </Button>
        </div>
      )}

      {/* Modals */}
      <AddReminderModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        petId={petId}
        petName={petName}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete reminder?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
