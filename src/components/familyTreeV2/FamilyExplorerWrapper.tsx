import React, { useState, useEffect } from 'react'
import { FamilyTreeService } from '@/lib/familyTreeV2Service'
import InteractiveFamilyTree from './InteractiveFamilyTree'
import { QuickAddModal } from './QuickAddModal'
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
  const [modalOpen, setModalOpen] = useState(false)
  const [relType, setRelType] = useState<'partner' | 'child' | 'parent'>('child')
  const [targetId, setTargetId] = useState<string>('')
  const [renderKey, setRenderKey] = useState(0)

  useEffect(() => {
    loadData()
  }, [familyId, focusPersonId])

  const loadData = async () => {
    try {
      const data = await FamilyTreeService.getTreeData(familyId, focusPersonId || undefined)

      /** ---------- NORMALIZE + ORIENTATION AUTODETECT ---------- **/

      // 1) Normalize people
      const convertedPeople: Person[] = (data.people || []).map((p: any) => ({
        id: String(p.id),
        given_name: p.given_name || '',
        surname: p.surname || undefined,
        birth_date: p.birth_date,
        death_date: p.death_date,
        sex: p.gender === 'male' ? 'M' : p.gender === 'female' ? 'F' : (p.sex === 'M' || p.sex === 'F' ? p.sex : 'X'),
        avatar_url: p.avatar_url ?? null,
      }))

      // Utilities to score which way the "parent" relation is oriented in your DB
      type RawRel = { relationship_type: string; from_person_id: string | number; to_person_id: string | number }

      function mapWithOrientation(raw: RawRel[], mode: 'fromIsParent' | 'toIsParent'): Relationship[] {
        const parentEdges: Relationship[] = raw
          .filter(r => r.relationship_type === 'parent')
          .map(r => {
            const parent_id = String(mode === 'fromIsParent' ? r.from_person_id : r.to_person_id)
            const child_id  = String(mode === 'fromIsParent' ? r.to_person_id : r.from_person_id)
            return { type: 'parent', parent_id, child_id } as const
          })

        const spouseEdges: Relationship[] = raw
          .filter(r => r.relationship_type === 'spouse')
          .map(r => ({ type: 'spouse', a: String(r.from_person_id), b: String(r.to_person_id) }) as const)

        const divorcedEdges: Relationship[] = raw
          .filter(r => r.relationship_type === 'divorced')
          .map(r => ({ type: 'divorced', a: String(r.from_person_id), b: String(r.to_person_id) }) as const)

        return [...parentEdges, ...spouseEdges, ...divorcedEdges]
      }

      function scoreOrientation(rels: Relationship[]) {
        // Higher score = more children with exactly 2 parents, fewer with >2
        const parentsOf = new Map<string, Set<string>>()
        for (const r of rels) if (r.type === 'parent') {
          const set = parentsOf.get(r.child_id) ?? new Set<string>()
          set.add(r.parent_id)
          parentsOf.set(r.child_id, set)
        }
        let exactly2 = 0, over2 = 0
        parentsOf.forEach(s => { if (s.size === 2) exactly2++; if (s.size > 2) over2++; })
        return exactly2 - over2 * 5
      }

      const dbRels: RawRel[] = (data.relationships || []) as RawRel[]
      const relsFrom = mapWithOrientation(dbRels, 'fromIsParent')
      const relsTo   = mapWithOrientation(dbRels, 'toIsParent')
      const rels: Relationship[] = scoreOrientation(relsFrom) >= scoreOrientation(relsTo) ? relsFrom : relsTo

      // 3) Quick sanity logs (optional)
      console.log('[Tree] people:', convertedPeople.length, 'rels:', rels.length, 'focus:', focusPersonId)
      console.log('[Tree] People:', convertedPeople.map(p => p.given_name))
      console.log('[Tree] Relationships:', rels)

      setPeople(convertedPeople)
      setRelationships(rels)
      setRenderKey(k => k + 1)
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

  const handleAddRequested = (type: 'parent'|'sibling'|'child'|'spouse', personId: string) => {
    const mapped: Record<string, 'partner'|'child'|'parent'> = {
      parent: 'parent',
      child: 'child',
      spouse: 'partner',
      sibling: 'parent', // adding a sibling usually implies adding a parent first
    };
    setRelType(mapped[type]);
    setTargetId(personId);
    setModalOpen(true);
  };

  return (
    <>
      <InteractiveFamilyTree
        key={renderKey}
        people={people}
        relationships={relationships}
        focusPersonId={focusPersonId || (people.find(p => relationships.some(r => 
          (r.type === 'parent' && (r.parent_id === p.id || r.child_id === p.id)) ||
          (r.type === 'spouse' && (r.a === p.id || r.b === p.id))
        ))?.id || people[0]?.id) || ''}
        showCaptions={false}
        onAddRequested={handleAddRequested}
      />
      <QuickAddModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        familyId={familyId}
        relationshipType={relType}
        targetPersonId={targetId}
        onSuccess={async () => { setModalOpen(false); await loadData(); }}
      />
    </>
  )
}