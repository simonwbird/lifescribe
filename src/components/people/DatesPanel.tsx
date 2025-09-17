import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Plus, Edit2 } from 'lucide-react'
import { Person, UserRole, canEdit, computeAge, nextBirthdayOccurrence } from '@/utils/personUtils'
import { format, differenceInDays } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { DatePrecisionPicker, DatePrecisionValue } from '@/components/DatePrecisionPicker'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface DatesPanelProps {
  person: Person
  userRole: UserRole
  onPersonUpdated: () => void
}

export function DatesPanel({ person, userRole, onPersonUpdated }: DatesPanelProps) {
  const canUserEdit = canEdit(userRole)
  const { toast } = useToast()

  const [editType, setEditType] = useState<'birth' | 'death' | null>(null)
  const [dp, setDp] = useState<DatePrecisionValue>({ date: null, yearOnly: false })
  const [saving, setSaving] = useState(false)
  
  const age = computeAge(person.birth_date, person.death_date)
  const nextBirthday = nextBirthdayOccurrence(person.birth_date)
  const daysUntilBirthday = nextBirthday ? differenceInDays(nextBirthday, new Date()) : null

  function openEdit(type: 'birth' | 'death') {
    setEditType(type)
    const d = type === 'birth' ? person.birth_date : person.death_date
    // Check if we only have year data
    const precRaw = (type === 'birth' ? (person as any).birth_date_precision : (person as any).death_date_precision) as string | undefined
    const yearOnly = precRaw === 'year' || precRaw === 'y'
    setDp({ date: d ? new Date(d) : null, yearOnly })
  }

  async function saveDate() {
    if (!editType) return
    setSaving(true)
    try {
      const updates: any = {}
      if (editType === 'birth') {
        updates.birth_date = dp.date ? format(dp.date, 'yyyy-MM-dd') : null
        updates.birth_date_precision = dp.yearOnly ? 'year' : 'day'
      } else {
        updates.death_date = dp.date ? format(dp.date, 'yyyy-MM-dd') : null
        updates.death_date_precision = dp.yearOnly ? 'year' : 'day'
      }
      const { error } = await supabase
        .from('people')
        .update(updates)
        .eq('id', person.id)
        .eq('family_id', (person as any).family_id)
      if (error) throw error
      toast({ title: 'Saved' })
      setEditType(null)
      onPersonUpdated()
    } catch (e: any) {
      toast({ title: 'Failed to save', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Important Dates
          </CardTitle>
          {canUserEdit && (
            <Button variant="outline" size="sm" onClick={() => openEdit(person.birth_date ? 'death' : 'birth')}>
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
                <Button variant="ghost" size="sm" onClick={() => openEdit('birth')}>
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
                <Button variant="ghost" size="sm" onClick={() => openEdit('death')}>
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

      {/* Edit Date Dialog */}
      <Dialog open={!!editType} onOpenChange={(o) => setEditType(o ? editType : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editType === 'birth' ? 'Edit Birthday' : 'Edit Death Date'}</DialogTitle>
            <DialogDescription>Select a date and precision.</DialogDescription>
          </DialogHeader>
          <DatePrecisionPicker value={dp} onChange={setDp} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditType(null)}>Cancel</Button>
            <Button onClick={saveDate} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}