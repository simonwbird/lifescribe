import React from 'react'
import type { Person, Relationship } from '@/lib/familyTreeTypes'

interface ConnectionRendererProps {
  people: Person[]
  relationships: Relationship[]
  positions: Record<string, { x: number; y: number; depth: number }>
  cardWidth?: number
  cardHeight?: number
}

type Point = { x: number; y: number }

function elbowPath(from: Point, to: Point): string {
  const midY = (from.y + to.y) / 2
  return `M ${from.x} ${from.y} L ${from.x} ${midY} L ${to.x} ${midY} L ${to.x} ${to.y}`
}

function cardAnchors(x: number, y: number, width: number, height: number) {
  return {
    top: { x: x, y: y - height/2 },
    bottom: { x: x, y: y + height/2 },
    midLeft: { x: x - width/2, y: y },
    midRight: { x: x + width/2, y: y }
  }
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
    const skipEdges = new Set<string>()
    
    // Process spouse connections and their children
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
        
        const personAnchors = cardAnchors(personPos.x, personPos.y, cardWidth, cardHeight)
        const spouseAnchors = cardAnchors(spousePos.x, spousePos.y, cardWidth, cardHeight)
        
        // Determine which person is on the left
        const leftPerson = personPos.x < spousePos.x ? personAnchors : spouseAnchors
        const rightPerson = personPos.x < spousePos.x ? spouseAnchors : personAnchors
        
        // Spouse connection line
        paths.push(
          <path
            key={`spouse-${pathIndex++}`}
            d={`M ${leftPerson.midRight.x} ${leftPerson.midRight.y} L ${rightPerson.midLeft.x} ${rightPerson.midLeft.y}`}
            stroke="#FFFFFF"
            strokeWidth="3"
            fill="none"
          />
        )
        
        // Heart at midpoint
        const heartX = (leftPerson.midRight.x + rightPerson.midLeft.x) / 2
        const heartY = (leftPerson.midRight.y + rightPerson.midLeft.y) / 2
        hearts.push(
          <text
            key={`heart-${pathIndex++}`}
            x={heartX}
            y={heartY + 4}
            textAnchor="middle"
            fontSize="16"
            fill="#FF69B4"
            className="pointer-events-none font-bold"
            style={{ filter: 'drop-shadow(0 0 3px rgba(255,105,180,0.8))' }}
          >
            ❤
          </text>
        )

        // Find children of this couple (union of both parents' children)
        const parent1Children = parentChildMap.get(person.id) || []
        const parent2Children = parentChildMap.get(spouseId) || []
        const coupleChildren = Array.from(new Set<string>([...parent1Children, ...parent2Children]))

        if (coupleChildren.length > 0) {
          // Get child positions
          const childAnchors = coupleChildren
            .map(childId => ({ 
              id: childId, 
              pos: positions[childId],
              child: people.find(p => p.id === childId)
            }))
            .filter(({ pos }) => !!pos)
            .map(({ id, pos, child }) => ({ 
              id, 
              child,
              anchors: cardAnchors(pos!.x, pos!.y, cardWidth, cardHeight) 
            }))

          if (childAnchors.length > 0) {
            const xs = childAnchors.map(c => c.anchors.top.x)
            const ys = childAnchors.map(c => c.anchors.top.y)
            
            // Position horizontal bar 40px above the children
            const childrenTopY = Math.min(...ys)
            const barY = childrenTopY - 40

            if (childAnchors.length > 1) {
              // Multiple children: trunk → horizontal bar → stems
              
              // Trunk from heart down to bar
              paths.push(
                <path
                  key={`trunk-${pathIndex++}`}
                  d={`M ${heartX} ${heartY + 8} L ${heartX} ${barY}`}
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  fill="none"
                />
              )

              // Horizontal bar
              const minX = Math.min(...xs)
              const maxX = Math.max(...xs)
              paths.push(
                <path
                  key={`bar-${pathIndex++}`}
                  d={`M ${minX} ${barY} L ${maxX} ${barY}`}
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  fill="none"
                />
              )

              // Connector if heart is outside child range
              if (heartX < minX || heartX > maxX) {
                const connectorX = heartX < minX ? minX : maxX
                paths.push(
                  <path
                    key={`connector-${pathIndex++}`}
                    d={`M ${heartX} ${barY} L ${connectorX} ${barY}`}
                    stroke="#FFFFFF"
                    strokeWidth="3"
                    fill="none"
                  />
                )
              }

              // Stems to children
              childAnchors.forEach((c) => {
                paths.push(
                  <path
                    key={`child-stem-${pathIndex++}`}
                    d={`M ${c.anchors.top.x} ${barY} L ${c.anchors.top.x} ${c.anchors.top.y}`}
                    stroke="#FFFFFF"
                    strokeWidth="3"
                    fill="none"
                  />
                )
              })
            } else {
              // Single child: heart → vertical → horizontal → vertical to child
              const childAnchor = childAnchors[0]
              paths.push(
                <path
                  key={`single-child-${pathIndex++}`}
                  d={`M ${heartX} ${heartY + 8} L ${heartX} ${barY} L ${childAnchor.anchors.top.x} ${barY} L ${childAnchor.anchors.top.x} ${childAnchor.anchors.top.y}`}
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  fill="none"
                />
              )
            }

            // Mark edges to skip
            childAnchors.forEach(c => {
              skipEdges.add(`${person.id}->${c.id}`)
              skipEdges.add(`${spouseId}->${c.id}`)
            })
          }
        }
      })
    })

    // Handle single parent connections (not routed through hearts)
    people.forEach(parent => {
      const parentPos = positions[parent.id]
      if (!parentPos) return
      
      const children = parentChildMap.get(parent.id) || []
      children.forEach(childId => {
        if (skipEdges.has(`${parent.id}->${childId}`)) return

        const child = people.find(p => p.id === childId)
        const childPos = positions[childId]
        if (!childPos || !child) return
        
        const parentAnchors = cardAnchors(parentPos.x, parentPos.y, cardWidth, cardHeight)
        const childAnchors = cardAnchors(childPos.x, childPos.y, cardWidth, cardHeight)
        
        paths.push(
          <path
            key={`single-parent-${pathIndex++}`}
            d={elbowPath(parentAnchors.bottom, childAnchors.top)}
            stroke="#FFFFFF"
            strokeWidth="3"
            fill="none"
          />
        )
      })
    })

    return [...paths, ...hearts]
  }

  return (
    <>
      {renderConnections()}
    </>
  )
}