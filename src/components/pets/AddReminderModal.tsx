import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAddReminder } from '@/hooks/usePetReminders'
import { REMINDER_TYPES, ReminderType } from '@/lib/petReminderTypes'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface AddReminderModalProps {
  isOpen: boolean
  onClose: () => void
  petId: string
  petName: string
}

export function AddReminderModal({ isOpen, onClose, petId, petName }: AddReminderModalProps) {
  const { toast } = useToast()
  const addReminder = useAddReminder()
  
  const [type, setType] = useState<ReminderType>('vaccination')
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState<Date>()
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !dueDate) {
      toast({
        title: 'Missing information',
        description: 'Please fill in the title and due date',
        variant: 'destructive',
      })
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: member } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .single()

      if (!member) return

      await addReminder.mutateAsync({
        petId,
        familyId: member.family_id,
        type,
        title: title.trim(),
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        notes: notes.trim() || undefined,
      })

      toast({
        title: 'Reminder added',
        description: `Reminder for ${petName} has been created`,
      })

      // Reset form
      setType('vaccination')
      setTitle('')
      setDueDate(undefined)
      setNotes('')
      onClose()
    } catch (error) {
      console.error('Error adding reminder:', error)
      toast({
        title: 'Error',
        description: 'Failed to add reminder',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Reminder for {petName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ReminderType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMINDER_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Rabies booster"
              required
            />
          </div>

          <div>
            <Label>Due Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dueDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={addReminder.isPending}>
              {addReminder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Reminder
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
