import React from 'react'
import { X } from 'lucide-react'
import type { Person } from '@/lib/familyTreeTypes'

interface Relationship {
  id: string
  from_person_id: string
  to_person_id: string
  relationship_type: 'parent' | 'spouse' | 'child'
}

interface FamilyConnectionsProps {
  people: Person[]
  relationships: Relationship[]
  positions: Record<string, { x: number; y: number }>
  selectedPersonId?: string
  onDeleteRelation?: (relationshipId: string) => void
}

export default function FamilyConnections({
  people,
  relationships,
  positions,
  selectedPersonId,
  onDeleteRelation
}: FamilyConnectionsProps) {
  const CARD_WIDTH = 264
  const CARD_HEIGHT = 160

  // Group relationships by family units
  const getFamilyUnits = () => {
    const familyUnits: Array<{
      parents: string[]
      children: string[]
      marriageRelationships: Relationship[]
      parentChildRelationships: Relationship[]
    }> = []

    // Find all spouse pairs
    const spouseRelationships = relationships.filter(rel => rel.relationship_type === 'spouse')
    const processedSpouses = new Set<string>()

    spouseRelationships.forEach(spouseRel => {
      if (processedSpouses.has(spouseRel.from_person_id) || processedSpouses.has(spouseRel.to_person_id)) {
        return
      }

      const parents = [spouseRel.from_person_id, spouseRel.to_person_id]
      processedSpouses.add(spouseRel.from_person_id)
      processedSpouses.add(spouseRel.to_person_id)

      // Find children of this couple
      const children = relationships
        .filter(rel => 
          rel.relationship_type === 'parent' && 
          parents.includes(rel.from_person_id)
        )
        .map(rel => rel.to_person_id)
        .filter((child, index, arr) => arr.indexOf(child) === index) // Unique children

      const parentChildRels = relationships.filter(rel =>
        rel.relationship_type === 'parent' &&
        parents.includes(rel.from_person_id) &&
        children.includes(rel.to_person_id)
      )

      if (children.length > 0) {
        familyUnits.push({
          parents,
          children,
          marriageRelationships: [spouseRel],
          parentChildRelationships: parentChildRels
        })
      }
    })

    return familyUnits
  }

  const familyUnits = getFamilyUnits()
  
  // Track which relationships are handled by family units
  const handledRelationships = new Set<string>()
  familyUnits.forEach(unit => {
    unit.marriageRelationships.forEach(rel => handledRelationships.add(rel.id))
    unit.parentChildRelationships.forEach(rel => handledRelationships.add(rel.id))
  })

  // Remaining individual relationships
  const individualRelationships = relationships.filter(rel => !handledRelationships.has(rel.id))

  const renderFamilyUnit = (unit: typeof familyUnits[0], index: number) => {
    const [parent1Id, parent2Id] = unit.parents
    const parent1Pos = positions[parent1Id]
    const parent2Pos = positions[parent2Id]

    if (!parent1Pos || !parent2Pos) return null

    // Marriage line between parents
    const leftParent = parent1Pos.x < parent2Pos.x ? parent1Pos : parent2Pos
    const rightParent = parent1Pos.x < parent2Pos.x ? parent2Pos : parent1Pos
    
    const marriageStartX = leftParent.x + CARD_WIDTH
    const marriageEndX = rightParent.x
    const marriageY = leftParent.y + CARD_HEIGHT / 2

    // T-intersection point (middle of marriage line)
    const tIntersectionX = (marriageStartX + marriageEndX) / 2
    const tIntersectionY = marriageY

    // Vertical line down from T-intersection
    const verticalLineLength = 60
    const verticalEndY = tIntersectionY + verticalLineLength

    // Children connection points
    const childrenWithPositions = unit.children
      .map(childId => ({ id: childId, pos: positions[childId] }))
      .filter(child => child.pos)
      .sort((a, b) => a.pos.x - b.pos.x) // Sort by x position

    const isHighlighted = unit.parents.includes(selectedPersonId || '') || 
                         unit.children.includes(selectedPersonId || '')

    return (
      <g key={`family-unit-${index}`}>
        {/* Marriage line */}
        <line
          x1={marriageStartX}
          y1={marriageY}
          x2={marriageEndX}
          y2={marriageY}
          stroke={isHighlighted ? '#ec4899' : '#f59e0b'}
          strokeWidth={isHighlighted ? 3 : 2}
          strokeDasharray="8 4"
          strokeLinecap="round"
        />

        {/* Vertical line from T-intersection */}
        {childrenWithPositions.length > 0 && (
          <line
            x1={tIntersectionX}
            y1={tIntersectionY}
            x2={tIntersectionX}
            y2={verticalEndY}
            stroke={isHighlighted ? '#3b82f6' : '#6b7280'}
            strokeWidth={isHighlighted ? 3 : 2}
            strokeLinecap="round"
          />
        )}

        {/* Horizontal line for children if multiple */}
        {childrenWithPositions.length > 1 && (
          <line
            x1={Math.min(...childrenWithPositions.map(c => c.pos.x + CARD_WIDTH / 2))}
            y1={verticalEndY}
            x2={Math.max(...childrenWithPositions.map(c => c.pos.x + CARD_WIDTH / 2))}
            y2={verticalEndY}
            stroke={isHighlighted ? '#3b82f6' : '#6b7280'}
            strokeWidth={isHighlighted ? 3 : 2}
            strokeLinecap="round"
          />
        )}

        {/* Lines from horizontal line to each child */}
        {childrenWithPositions.map(child => (
          <line
            key={`child-line-${child.id}`}
            x1={child.pos.x + CARD_WIDTH / 2}
            y1={verticalEndY}
            x2={child.pos.x + CARD_WIDTH / 2}
            y2={child.pos.y}
            stroke={isHighlighted ? '#3b82f6' : '#6b7280'}
            strokeWidth={isHighlighted ? 3 : 2}
            strokeLinecap="round"
            markerEnd="url(#arrow-parent)"
          />
        ))}
      </g>
    )
  }

  const renderIndividualRelationship = (relationship: Relationship) => {
    const fromPos = positions[relationship.from_person_id]
    const toPos = positions[relationship.to_person_id]
    
    if (!fromPos || !toPos) return null

    let startX, startY, endX, endY

    if (relationship.relationship_type === 'parent') {
      // Parent to child
      if (fromPos.y < toPos.y) {
        startX = fromPos.x + CARD_WIDTH / 2
        startY = fromPos.y + CARD_HEIGHT
        endX = toPos.x + CARD_WIDTH / 2
        endY = toPos.y
      } else {
        startX = fromPos.x + CARD_WIDTH / 2
        startY = fromPos.y
        endX = toPos.x + CARD_WIDTH / 2
        endY = toPos.y + CARD_HEIGHT
      }

      const midY = startY + (endY - startY) / 2
      const isHighlighted = selectedPersonId === relationship.from_person_id || 
                           selectedPersonId === relationship.to_person_id

      return (
        <g key={relationship.id}>
          <path
            d={`M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`}
            fill="none"
            stroke={isHighlighted ? '#3b82f6' : '#6b7280'}
            strokeWidth={isHighlighted ? 3 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            markerEnd="url(#arrow-parent)"
          />
        </g>
      )
    } else if (relationship.relationship_type === 'spouse') {
      // Direct spouse connection (not part of family unit)
      if (fromPos.x < toPos.x) {
        startX = fromPos.x + CARD_WIDTH
        startY = fromPos.y + CARD_HEIGHT / 2
        endX = toPos.x
        endY = toPos.y + CARD_HEIGHT / 2
      } else {
        startX = fromPos.x
        startY = fromPos.y + CARD_HEIGHT / 2
        endX = toPos.x + CARD_WIDTH
        endY = toPos.y + CARD_HEIGHT / 2
      }

      const isHighlighted = selectedPersonId === relationship.from_person_id || 
                           selectedPersonId === relationship.to_person_id

      return (
        <line
          key={relationship.id}
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke={isHighlighted ? '#ec4899' : '#f59e0b'}
          strokeWidth={isHighlighted ? 3 : 2}
          strokeDasharray="8 4"
          strokeLinecap="round"
        />
      )
    }

    return null
  }

  // Calculate SVG dimensions
  const allPositions = Object.values(positions)
  if (allPositions.length === 0) return null

  const minX = Math.min(...allPositions.map(p => p.x)) - 100
  const minY = Math.min(...allPositions.map(p => p.y)) - 100
  const maxX = Math.max(...allPositions.map(p => p.x + CARD_WIDTH)) + 100
  const maxY = Math.max(...allPositions.map(p => p.y + CARD_HEIGHT)) + 100

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none z-10"
      style={{
        left: minX,
        top: minY,
        width: maxX - minX,
        height: maxY - minY,
      }}
      viewBox={`0 0 ${maxX - minX} ${maxY - minY}`}
    >
      <defs>
        <marker
          id="arrow-parent"
          viewBox="0 0 10 10"
          refX="9"
          refY="3"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path
            d="M0,0 L0,6 L9,3 z"
            fill="#6b7280"
          />
        </marker>
      </defs>

      <g transform={`translate(${-minX}, ${-minY})`}>
        {/* Render family units with T-intersections */}
        {familyUnits.map((unit, index) => renderFamilyUnit(unit, index))}
        
        {/* Render individual relationships */}
        {individualRelationships.map(renderIndividualRelationship)}
      </g>
    </svg>
  )
}