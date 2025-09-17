import React from 'react'
import type { Person, Relationship } from '@/lib/familyTreeTypes'

interface HierarchicalConnectionRendererProps {
  people: Person[]
  relationships: Relationship[]
  positions: Record<string, { x: number; y: number }>
  cardWidth: number
  cardHeight: number
}

export default function HierarchicalConnectionRenderer({
  people,
  relationships,
  positions,
  cardWidth,
  cardHeight
}: HierarchicalConnectionRendererProps) {
  
  // Create relationship maps
  const spouseMap = new Map<string, string[]>()
  const childrenMap = new Map<string, string[]>()
  const parentsMap = new Map<string, string[]>()

  relationships.forEach(rel => {
    if (rel.relationship_type === 'spouse') {
      if (!spouseMap.has(rel.from_person_id)) spouseMap.set(rel.from_person_id, [])
      if (!spouseMap.has(rel.to_person_id)) spouseMap.set(rel.to_person_id, [])
      spouseMap.get(rel.from_person_id)!.push(rel.to_person_id)
      spouseMap.get(rel.to_person_id)!.push(rel.from_person_id)
    } else if (rel.relationship_type === 'parent') {
      if (!childrenMap.has(rel.from_person_id)) childrenMap.set(rel.from_person_id, [])
      if (!parentsMap.has(rel.to_person_id)) parentsMap.set(rel.to_person_id, [])
      childrenMap.get(rel.from_person_id)!.push(rel.to_person_id)
      parentsMap.get(rel.to_person_id)!.push(rel.from_person_id)
    }
  })

  const renderConnections = () => {
    const lines: JSX.Element[] = []
    const processedSpouses = new Set<string>()

    people.forEach(person => {
      const personPos = positions[person.id]
      if (!personPos) return

      // Render spouse connections with heart symbols
      const spouses = spouseMap.get(person.id) || []
      spouses.forEach(spouseId => {
        const spousePos = positions[spouseId]
        if (!spousePos) return

        const connectionKey = [person.id, spouseId].sort().join('-')
        if (processedSpouses.has(connectionKey)) return
        processedSpouses.add(connectionKey)

        const startX = personPos.x + cardWidth / 2
        const startY = personPos.y + cardHeight / 2
        const endX = spousePos.x - cardWidth / 2
        const endY = spousePos.y + cardHeight / 2
        const midX = (startX + endX) / 2
        const midY = (startY + endY) / 2

        lines.push(
          <g key={`marriage-${connectionKey}`}>
            {/* Marriage line */}
            <line
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke="#E11D48"
              strokeWidth="3"
              strokeDasharray="none"
            />
            {/* Heart symbol */}
            <circle
              cx={midX}
              cy={midY}
              r="8"
              fill="#FCA5A5"
              stroke="#E11D48"
              strokeWidth="2"
            />
            <text
              x={midX}
              y={midY + 2}
              textAnchor="middle"
              className="fill-red-600 text-sm font-bold"
              fontSize="12"
            >
              ♥
            </text>
          </g>
        )
      })

      // Render parent-child connections
      const children = childrenMap.get(person.id) || []
      children.forEach(childId => {
        const childPos = positions[childId]
        if (!childPos) return

        const startX = personPos.x
        const startY = personPos.y + cardHeight
        const endX = childPos.x
        const endY = childPos.y

        // Vertical line down from parent
        const midY = startY + (endY - startY) / 2

        lines.push(
          <g key={`parent-child-${person.id}-${childId}`}>
            {/* Vertical line from parent */}
            <line
              x1={startX}
              y1={startY}
              x2={startX}
              y2={midY}
              stroke="#6B7280"
              strokeWidth="2"
            />
            {/* Horizontal line to child */}
            <line
              x1={startX}
              y1={midY}
              x2={endX}
              y2={midY}
              stroke="#6B7280"
              strokeWidth="2"
            />
            {/* Vertical line to child */}
            <line
              x1={endX}
              y1={midY}
              x2={endX}
              y2={endY}
              stroke="#6B7280"
              strokeWidth="2"
            />
          </g>
        )
      })
    })

    return lines
  }

  return <g>{renderConnections()}</g>
}