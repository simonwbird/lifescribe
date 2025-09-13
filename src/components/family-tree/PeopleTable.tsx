import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Plus, Save, X } from 'lucide-react'
import { PersonData, FamilyDataService } from '@/lib/familyDataService'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface PeopleTableProps {
  people: PersonData[]
  familyId: string
  onUpdate: () => void
}

interface EditingPerson extends Partial<PersonData> {
  id?: string
  isNew?: boolean
}

export function PeopleTable({ people, familyId, onUpdate }: PeopleTableProps) {
  const [editingPerson, setEditingPerson] = useState<EditingPerson | null>(null)
  const [loading, setLoading] = useState(false)

  const handleEdit = (person: PersonData) => {
    setEditingPerson({ ...person })
  }

  const handleAddNew = () => {
    setEditingPerson({
      isNew: true,
      given_name: '',
      surname: '',
      gender: 'other',
      birth_date: '',
      death_date: '',
      notes: '',
      family_id: familyId
    })
  }

  const handleSave = async () => {
    if (!editingPerson) return
    
    setLoading(true)
    try {
      if (editingPerson.isNew) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')
        
        await FamilyDataService.createPerson({
          given_name: editingPerson.given_name || '',
          surname: editingPerson.surname || null,
          full_name: `${editingPerson.given_name} ${editingPerson.surname || ''}`.trim(),
          gender: editingPerson.gender || null,
          birth_date: editingPerson.birth_date || null,
          death_date: editingPerson.death_date || null,
          avatar_url: null,
          notes: editingPerson.notes || null,
          family_id: familyId,
          created_by: user.id
        } as any)
        toast.success('Person created successfully')
      } else {
        const { isNew, ...updates } = editingPerson
        await FamilyDataService.updatePerson(editingPerson.id!, {
          ...updates,
          full_name: `${updates.given_name} ${updates.surname || ''}`.trim()
        })
        toast.success('Person updated successfully')
      }
      
      setEditingPerson(null)
      onUpdate()
    } catch (error: any) {
      toast.error('Failed to save person: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will also delete all relationships for this person.')) return
    
    setLoading(true)
    try {
      await FamilyDataService.deletePerson(id)
      toast.success('Person deleted successfully')
      onUpdate()
    } catch (error: any) {
      toast.error('Failed to delete person: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditingPerson(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">All People ({people.length})</h3>
        <Button onClick={handleAddNew} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Person
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden max-h-[60vh] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Given Name</TableHead>
              <TableHead>Surname</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Birth Date</TableHead>
              <TableHead>Death Date</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {people.map((person) => (
              <TableRow key={person.id}>
                <TableCell>
                  {editingPerson?.id === person.id ? (
                    <Input
                      value={editingPerson.given_name || ''}
                      onChange={(e) => setEditingPerson({ ...editingPerson, given_name: e.target.value })}
                      placeholder="Given name"
                    />
                  ) : person.given_name}
                </TableCell>
                <TableCell>
                  {editingPerson?.id === person.id ? (
                    <Input
                      value={editingPerson.surname || ''}
                      onChange={(e) => setEditingPerson({ ...editingPerson, surname: e.target.value })}
                      placeholder="Surname"
                    />
                  ) : person.surname}
                </TableCell>
                <TableCell>
                  {editingPerson?.id === person.id ? (
                    <Select 
                      value={editingPerson.gender || 'other'} 
                      onValueChange={(value) => setEditingPerson({ ...editingPerson, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : person.gender}
                </TableCell>
                <TableCell>
                  {editingPerson?.id === person.id ? (
                    <Input
                      type="date"
                      value={editingPerson.birth_date || ''}
                      onChange={(e) => setEditingPerson({ ...editingPerson, birth_date: e.target.value })}
                    />
                  ) : person.birth_date}
                </TableCell>
                <TableCell>
                  {editingPerson?.id === person.id ? (
                    <Input
                      type="date"
                      value={editingPerson.death_date || ''}
                      onChange={(e) => setEditingPerson({ ...editingPerson, death_date: e.target.value })}
                    />
                  ) : person.death_date}
                </TableCell>
                <TableCell>
                  {editingPerson?.id === person.id ? (
                    <Input
                      value={editingPerson.notes || ''}
                      onChange={(e) => setEditingPerson({ ...editingPerson, notes: e.target.value })}
                      placeholder="Notes"
                    />
                  ) : person.notes}
                </TableCell>
                <TableCell>
                  {editingPerson?.id === person.id ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave} disabled={loading}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(person)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(person.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            
            {/* New person row */}
            {editingPerson?.isNew && (
              <TableRow>
                <TableCell>
                  <Input
                    value={editingPerson.given_name || ''}
                    onChange={(e) => setEditingPerson({ ...editingPerson, given_name: e.target.value })}
                    placeholder="Given name"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={editingPerson.surname || ''}
                    onChange={(e) => setEditingPerson({ ...editingPerson, surname: e.target.value })}
                    placeholder="Surname"
                  />
                </TableCell>
                <TableCell>
                  <Select 
                    value={editingPerson.gender || 'other'} 
                    onValueChange={(value) => setEditingPerson({ ...editingPerson, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={editingPerson.birth_date || ''}
                    onChange={(e) => setEditingPerson({ ...editingPerson, birth_date: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={editingPerson.death_date || ''}
                    onChange={(e) => setEditingPerson({ ...editingPerson, death_date: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={editingPerson.notes || ''}
                    onChange={(e) => setEditingPerson({ ...editingPerson, notes: e.target.value })}
                    placeholder="Notes"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} disabled={loading}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}