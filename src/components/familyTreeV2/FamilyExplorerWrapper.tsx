import React, { useState, useEffect } from 'react'
import { FamilyTreeService } from '@/lib/familyTreeV2Service'
import FamilyExplorer from './FamilyExplorer'
import type { Person, Relationship } from '@/lib/familyTreeV2Types'

interface Props {
  familyId: string
  focusPersonId?: string | null
  onPersonFocus?: (personId: string) => void
}

export default function FamilyExplorerWrapper({ familyId, focusPersonId, onPersonFocus }: Props) {
  const [people, setPeople] = useState<Person[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [familyId, focusPersonId])

  const loadData = async () => {
    try {
      const data = await FamilyTreeService.getTreeData(familyId, focusPersonId || undefined)
      
      // Convert TreePerson to Person
      const convertedPeople: Person[] = data.people.map(p => ({
        id: p.id,
        given_name: p.given_name || '',
        surname: p.surname || undefined,
        birth_date: p.birth_date,
        death_date: p.death_date,
        sex: p.sex === 'M' ? 'M' : p.sex === 'F' ? 'F' : 'X',
        avatar_url: p.avatar_url
      }))

      // Convert families to relationships
      const rels: Relationship[] = []
      for (const family of data.families) {
        const familyChildren = data.children.filter(c => c.family_id === family.id)
        for (const child of familyChildren) {
          if (family.partner1_id) {
            rels.push({ type: 'parent', parent_id: family.partner1_id, child_id: child.child_id })
          }
          if (family.partner2_id) {
            rels.push({ type: 'parent', parent_id: family.partner2_id, child_id: child.child_id })
          }
        }
        if (family.partner1_id && family.partner2_id) {
          rels.push({ type: 'spouse', a: family.partner1_id, b: family.partner2_id })
        }
      }

      setPeople(convertedPeople)
      setRelationships(rels)
    } catch (error) {
      console.error('Error loading tree data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <FamilyExplorer
      people={people}
      relationships={relationships}
      focusPersonId={focusPersonId || people[0]?.id || ''}
      showCaptions={true}
    />
  )
}