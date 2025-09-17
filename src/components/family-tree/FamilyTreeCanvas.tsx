import React from 'react'
import type { Person, Relationship } from '@/lib/familyTreeTypes'
import ResponsiveFamilyTree from './ResponsiveFamilyTree'

interface FamilyTreeCanvasProps {
  people: Person[]
  relationships: Relationship[]
  onPersonMove: (personId: string, x: number, y: number) => void
  onPersonSelect: (personId: string) => void
  onAddRelation: (fromPersonId: string, toPersonId: string, type: 'parent' | 'child' | 'spouse') => void
  onViewProfile: (personId: string) => void
  onEditPerson: (personId: string) => void
  positions: Record<string, { x: number; y: number }>
  selectedPersonId?: string
}

export default function FamilyTreeCanvas({
  people,
  relationships,
  onPersonMove,
  onPersonSelect,
  onAddRelation,
  onViewProfile,
  onEditPerson,
  positions,
  selectedPersonId
}: FamilyTreeCanvasProps) {

  return (
    <ResponsiveFamilyTree
      people={people}
      relationships={relationships}
      onPersonSelect={onPersonSelect}
      onViewProfile={onViewProfile}
      onEditPerson={onEditPerson}
      selectedPersonId={selectedPersonId}
    />
  )
}