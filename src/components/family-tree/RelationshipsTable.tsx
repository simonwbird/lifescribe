import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Plus, Save, X } from 'lucide-react'
import { RelationshipData, PersonData, FamilyDataService } from '@/lib/familyDataService'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface RelationshipsTableProps {
  relationships: RelationshipData[]
  people: PersonData[]
  familyId: string
  onUpdate: () => void
}

interface EditingRelationship extends Partial<RelationshipData> {
  id?: string
  isNew?: boolean
  relationship_type?: 'parent' | 'spouse' | 'divorced'
}

export function RelationshipsTable({ relationships, people, familyId, onUpdate }: RelationshipsTableProps) {
  const [editingRelationship, setEditingRelationship] = useState<EditingRelationship | null>(null)
  const [loading, setLoading] = useState(false)

  const getPersonName = (id: string) => {
    const person = people.find(p => p.id === id)
    return person ? person.full_name : 'Unknown'
  }

  const handleEdit = (relationship: RelationshipData) => {
    setEditingRelationship({ ...relationship })
  }

  const handleAddNew = () => {
    setEditingRelationship({
      isNew: true,
      from_person_id: '',
      to_person_id: '',
      relationship_type: 'parent',
      family_id: familyId
    })
  }

  const handleSave = async () => {
    if (!editingRelationship) return
    
    if (!editingRelationship.from_person_id || !editingRelationship.to_person_id) {
      toast.error('Please select both people for the relationship')
      return
    }

    if (editingRelationship.from_person_id === editingRelationship.to_person_id) {
      toast.error('A person cannot have a relationship with themselves')
      return
    }
    
    setLoading(true)
    try {
      if (editingRelationship.isNew) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')
        
        await FamilyDataService.createRelationship({
          from_person_id: editingRelationship.from_person_id!,
          to_person_id: editingRelationship.to_person_id!,
          relationship_type: editingRelationship.relationship_type!,
          family_id: familyId,
          created_by: user.id
        })
        toast.success('Relationship created successfully')
      } else {
        const { isNew, ...updates } = editingRelationship
        await FamilyDataService.updateRelationship(editingRelationship.id!, updates)
        toast.success('Relationship updated successfully')
      }
      
      setEditingRelationship(null)
      onUpdate()
    } catch (error: any) {
      toast.error('Failed to save relationship: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this relationship?')) return
    
    setLoading(true)
    try {
      await FamilyDataService.deleteRelationship(id)
      toast.success('Relationship deleted successfully')
      onUpdate()
    } catch (error: any) {
      toast.error('Failed to delete relationship: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditingRelationship(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">All Relationships ({relationships.length})</h3>
        <Button onClick={handleAddNew} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Relationship
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden max-h-[60vh] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From Person</TableHead>
              <TableHead>Relationship Type</TableHead>
              <TableHead>To Person</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {relationships.map((relationship) => (
              <TableRow key={relationship.id}>
                <TableCell>
                  {editingRelationship?.id === relationship.id ? (
                    <Select 
                      value={editingRelationship.from_person_id || ''} 
                      onValueChange={(value) => setEditingRelationship({ ...editingRelationship, from_person_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select person" />
                      </SelectTrigger>
                      <SelectContent>
                        {people.map(person => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : getPersonName(relationship.from_person_id)}
                </TableCell>
                <TableCell>
                  {editingRelationship?.id === relationship.id ? (
                     <Select 
                       value={editingRelationship.relationship_type || ''} 
                       onValueChange={(value: 'parent' | 'spouse' | 'divorced') => setEditingRelationship({ ...editingRelationship, relationship_type: value })}
                     >
                       <SelectTrigger>
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="parent">Parent</SelectItem>
                         <SelectItem value="spouse">Spouse</SelectItem>
                         <SelectItem value="divorced">Divorced</SelectItem>
                       </SelectContent>
                     </Select>
                  ) : relationship.relationship_type}
                </TableCell>
                <TableCell>
                  {editingRelationship?.id === relationship.id ? (
                    <Select 
                      value={editingRelationship.to_person_id || ''} 
                      onValueChange={(value) => setEditingRelationship({ ...editingRelationship, to_person_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select person" />
                      </SelectTrigger>
                      <SelectContent>
                        {people.map(person => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : getPersonName(relationship.to_person_id)}
                </TableCell>
                <TableCell>
                  {editingRelationship?.id === relationship.id ? (
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
                      <Button size="sm" variant="outline" onClick={() => handleEdit(relationship)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(relationship.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            
            {/* New relationship row */}
            {editingRelationship?.isNew && (
              <TableRow>
                <TableCell>
                  <Select 
                    value={editingRelationship.from_person_id || ''} 
                    onValueChange={(value) => setEditingRelationship({ ...editingRelationship, from_person_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select person" />
                    </SelectTrigger>
                    <SelectContent>
                      {people.map(person => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                   <Select 
                     value={editingRelationship.relationship_type || ''} 
                     onValueChange={(value: 'parent' | 'spouse' | 'divorced') => setEditingRelationship({ ...editingRelationship, relationship_type: value })}
                   >
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="parent">Parent</SelectItem>
                       <SelectItem value="spouse">Spouse</SelectItem>
                       <SelectItem value="divorced">Divorced</SelectItem>
                     </SelectContent>
                   </Select>
                </TableCell>
                <TableCell>
                  <Select 
                    value={editingRelationship.to_person_id || ''} 
                    onValueChange={(value) => setEditingRelationship({ ...editingRelationship, to_person_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select person" />
                    </SelectTrigger>
                    <SelectContent>
                      {people.map(person => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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