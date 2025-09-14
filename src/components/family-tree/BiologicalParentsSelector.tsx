import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import type { Person, Relationship } from '@/lib/familyTreeTypes'

interface BiologicalParentsSelectorProps {
  person: Person
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

interface ParentRelationship {
  id: string
  parent: Person
  is_biological: boolean
}

export function BiologicalParentsSelector({
  person,
  isOpen,
  onClose,
  onUpdate
}: BiologicalParentsSelectorProps) {
  const [parentRelationships, setParentRelationships] = useState<ParentRelationship[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && person) {
      loadParentRelationships()
    }
  }, [isOpen, person])

  const loadParentRelationships = async () => {
    if (!person) return
    
    setLoading(true)
    try {
      // Get all parent relationships for this person
      const { data: relationships, error } = await supabase
        .from('relationships')
        .select(`
          id,
          is_biological,
          from_person_id,
          people!relationships_from_person_id_fkey (
            id,
            full_name,
            given_name,
            surname,
            avatar_url
          )
        `)
        .eq('to_person_id', person.id)
        .eq('relationship_type', 'parent')

      if (error) throw error

      const parentRels: ParentRelationship[] = relationships?.map(rel => ({
        id: rel.id,
        parent: rel.people as Person,
        is_biological: rel.is_biological ?? true
      })) || []

      setParentRelationships(parentRels)
    } catch (error) {
      console.error('Error loading parent relationships:', error)
      toast({
        title: "Error",
        description: "Failed to load parent relationships",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBiologicalChange = (relationshipId: string, isBiological: boolean) => {
    setParentRelationships(prev => 
      prev.map(rel => 
        rel.id === relationshipId 
          ? { ...rel, is_biological: isBiological }
          : rel
      )
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Update all parent relationships with new biological status
      for (const rel of parentRelationships) {
        const { error } = await supabase
          .from('relationships')
          .update({ is_biological: rel.is_biological })
          .eq('id', rel.id)

        if (error) throw error
      }

      toast({
        title: "Success",
        description: "Biological parents updated successfully"
      })
      onUpdate()
      onClose()
    } catch (error) {
      console.error('Error updating biological parents:', error)
      toast({
        title: "Error",
        description: "Failed to update biological parents",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const biologicalCount = parentRelationships.filter(rel => rel.is_biological).length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Biological Parents</DialogTitle>
          <DialogDescription>
            Select which parents are biological parents of {person.full_name}. 
            Only biological parents will be used for family tree connections.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : parentRelationships.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No parent relationships found for this person.
            </p>
          ) : (
            <>
              <div className="space-y-3">
                {parentRelationships.map((rel) => (
                  <div key={rel.id} className="flex items-center space-x-3 p-2 border rounded">
                    <Checkbox
                      id={`parent-${rel.id}`}
                      checked={rel.is_biological}
                      onCheckedChange={(checked) => 
                        handleBiologicalChange(rel.id, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor={`parent-${rel.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {rel.parent.full_name}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {rel.is_biological ? 'Biological parent' : 'Step/adoptive parent'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {biologicalCount > 2 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Note: More than 2 biological parents selected. 
                    Family tree connections may appear complex.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || loading || parentRelationships.length === 0}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default BiologicalParentsSelector