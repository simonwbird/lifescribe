import React from 'react'
import type { Person, Relationship } from '@/lib/familyTreeTypes'

interface ConnectionRendererProps {
  people: Person[]
  relationships: Relationship[]
  positions: Record<string, { x: number; y: number; depth: number }>
  cardWidth?: number
  cardHeight?: number
}

export function ConnectionRenderer({
  people,
  relationships,
  positions,
  cardWidth = 150,
  cardHeight = 180
}: ConnectionRendererProps) {
  // Create maps for quick lookups
  const spouseMap = new Map<string, string[]>()
  const parentChildMap = new Map<string, string[]>()
  
  relationships.forEach(rel => {
    if (rel.relationship_type === 'spouse') {
      if (!spouseMap.has(rel.from_person_id)) spouseMap.set(rel.from_person_id, [])
      if (!spouseMap.has(rel.to_person_id)) spouseMap.set(rel.to_person_id, [])
      spouseMap.get(rel.from_person_id)!.push(rel.to_person_id)
      spouseMap.get(rel.to_person_id)!.push(rel.from_person_id)
    } else if (rel.relationship_type === 'parent') {
      if (!parentChildMap.has(rel.from_person_id)) parentChildMap.set(rel.from_person_id, [])
      parentChildMap.get(rel.from_person_id)!.push(rel.to_person_id)
    }
  })

  const renderConnections = () => {
    const paths: JSX.Element[] = []
    const hearts: JSX.Element[] = []
    let pathIndex = 0

    // Render spouse connections (horizontal lines with hearts)
    const processedSpouses = new Set<string>()
    
    people.forEach(person => {
      const personPos = positions[person.id]
      if (!personPos) return
      
      const spouses = spouseMap.get(person.id) || []
      spouses.forEach(spouseId => {
        const pairKey = [person.id, spouseId].sort().join('-')
        if (processedSpouses.has(pairKey)) return
        processedSpouses.add(pairKey)
        
        const spousePos = positions[spouseId]
        if (!spousePos) return
        
        // Horizontal line between spouses
        const y = personPos.y
        const x1 = Math.min(personPos.x, spousePos.x) + cardWidth / 2
        const x2 = Math.max(personPos.x, spousePos.x) - cardWidth / 2
        
        if (x2 > x1) {
          paths.push(
            <path
              key={`spouse-${pathIndex++}`}
              d={`M ${x1} ${y} L ${x2} ${y}`}
              stroke="#C9CCD6"
              strokeWidth="2"
              fill="none"
              className="hover:stroke-neutral-400 transition-colors"
            />
          )
          
          // Heart at midpoint
          const heartX = (x1 + x2) / 2
          const heartY = y
          hearts.push(
            <g key={`heart-${pathIndex}`} transform={`translate(${heartX}, ${heartY})`}>
              <circle r="8" fill="white" stroke="#F45B69" strokeWidth="1" />
              <svg x="-6" y="-6" width="12" height="12" viewBox="0 0 24 24" fill="#F45B69">
                <path d="M12,21.35l-1.45-1.32C5.4,15.36,2,12.28,2,8.5 C2,5.42,4.42,3,7.5,3c1.74,0,3.41,0.81,4.5,2.09C13.09,3.81,14.76,3,16.5,3 C19.58,3,22,5.42,22,8.5c0,3.78-3.4,6.86-8.55,11.54L12,21.35z"/>
              </svg>
            </g>
          )
        }
      })
    })

    // Render parent-child connections (elbow/orthogonal paths)
    people.forEach(parent => {
      const parentPos = positions[parent.id]
      if (!parentPos) return
      
      const children = parentChildMap.get(parent.id) || []
      children.forEach(childId => {
        const childPos = positions[childId]
        if (!childPos) return
        
        // Calculate connection points
        const parentBottom = parentPos.y + cardHeight / 2
        const childTop = childPos.y - cardHeight / 2
        const parentCenterX = parentPos.x
        const childCenterX = childPos.x
        
        // Mid-level for horizontal segment
        const midY = parentBottom + (childTop - parentBottom) / 2
        
        // Create orthogonal path: down from parent, across, down to child
        const pathData = [
          `M ${parentCenterX} ${parentBottom}`,  // Start at bottom center of parent
          `L ${parentCenterX} ${midY}`,          // Go down to mid level
          `L ${childCenterX} ${midY}`,           // Go horizontally to child x
          `L ${childCenterX} ${childTop}`        // Go down to top of child
        ].join(' ')
        
        paths.push(
          <path
            key={`parent-child-${pathIndex++}`}
            d={pathData}
            stroke="#C9CCD6"
            strokeWidth="2"
            fill="none"
            className="hover:stroke-neutral-400 transition-colors"
          />
        )
      })
    })

    return [...paths, ...hearts]
  }

  return (
    <g className="connections">
      {renderConnections()}
    </g>
  )
}