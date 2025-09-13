import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { FamilyTreeService } from '@/lib/familyTreeV2Service'
import type { QuickAddForm } from '@/lib/familyTreeV2Types'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'

interface QuickAddModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  familyId: string
  relationshipType: 'partner' | 'child' | 'parent'
  targetPersonId: string
  onSuccess: () => void
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  open,
  onOpenChange,
  familyId,
  relationshipType,
  targetPersonId,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<QuickAddForm>({
    given_name: '',
    surname: '',
    sex: 'M',
    birth_date: '',
    is_living: true,
    relationship_type: relationshipType,
    target_person_id: targetPersonId
  })

  // Reset/sync form whenever the modal opens or target/type changes
  useEffect(() => {
    if (!open) return
    setForm({
      given_name: '',
      surname: '',
      sex: 'M',
      birth_date: '',
      is_living: true,
      relationship_type: relationshipType,
      target_person_id: targetPersonId
    })
  }, [open, relationshipType, targetPersonId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.given_name) {
      toast.error('Given name is required')
      return
    }
    if (!familyId) {
      toast.error('Missing family. Please reload and try again.')
      return
    }
    if (!form.target_person_id) {
      toast.error('Missing target person. Please select a person to add a relation to.')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await FamilyTreeService.quickAddPerson(form, familyId, user.id)
      toast.success(`${form.given_name} added successfully`)
      onSuccess()
    } catch (error: any) {
      console.error('Error adding person:', error)
      toast.error('Failed to add person: ' + (error?.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const relationshipLabels = {
    partner: 'Add Partner',
    child: 'Add Child', 
    parent: 'Add Parent'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{relationshipLabels[relationshipType]}</DialogTitle>
          <DialogDescription>Enter details to quickly add a related person.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="given_name">Given Name *</Label>
              <Input
                id="given_name"
                value={form.given_name}
                onChange={(e) => setForm(prev => ({ ...prev, given_name: e.target.value }))}
                placeholder="John"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="surname">Surname</Label>
              <Input
                id="surname"
                value={form.surname}
                onChange={(e) => setForm(prev => ({ ...prev, surname: e.target.value }))}
                placeholder="Smith"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="sex">Sex</Label>
            <Select value={form.sex} onValueChange={(value: 'M' | 'F' | 'X') => 
              setForm(prev => ({ ...prev, sex: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Male</SelectItem>
                <SelectItem value="F">Female</SelectItem>
                <SelectItem value="X">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="birth_date">Birth Date</Label>
            <Input
              id="birth_date"
              type="date"
              value={form.birth_date}
              onChange={(e) => setForm(prev => ({ ...prev, birth_date: e.target.value }))}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_living"
              checked={form.is_living}
              onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_living: checked }))}
            />
            <Label htmlFor="is_living">Still living</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : `Add ${relationshipType}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}