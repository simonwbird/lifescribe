import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { REMINDER_TYPES, type ReminderType } from '@/lib/reminderTypes'
import { useCreateReminder } from '@/hooks/useReminders'

interface ReminderDialogProps {
  propertyId: string
  familyId: string
  trigger?: React.ReactNode
}

export function ReminderDialog({ propertyId, familyId, trigger }: ReminderDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    type: 'other' as ReminderType,
    title: '',
    due_at: '',
    notes: ''
  })

  const createReminder = useCreateReminder()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.due_at) return

    await createReminder.mutateAsync({
      property_id: propertyId,
      family_id: familyId,
      type: formData.type,
      title: formData.title,
      due_at: formData.due_at,
      notes: formData.notes || null,
      completed_at: null
    })

    // Reset form
    setFormData({
      type: 'other',
      title: '',
      due_at: '',
      notes: ''
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Reminder
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Maintenance Reminder</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: ReminderType) => {
                setFormData(prev => ({ ...prev, type: value }))
                // Auto-populate title based on type if empty
                if (!formData.title) {
                  const reminderType = REMINDER_TYPES.find(t => t.value === value)
                  if (reminderType) {
                    setFormData(prev => ({ ...prev, title: reminderType.label }))
                  }
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMINDER_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Annual boiler service"
              required
            />
          </div>

          <div>
            <Label htmlFor="due_at">Due Date</Label>
            <Input
              id="due_at"
              type="date"
              value={formData.due_at}
              onChange={(e) => setFormData(prev => ({ ...prev, due_at: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createReminder.isPending}>
              {createReminder.isPending ? 'Adding...' : 'Add Reminder'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
