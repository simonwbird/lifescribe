import React, { useRef } from 'react'
import type { Person, Relationship } from '@/lib/familyTreeTypes'

interface ConnectionRendererProps {
  people: Person[]
  relationships: Relationship[]
  positions: Record<string, { x: number; y: number; depth: number }>
  cardWidth?: number
  cardHeight?: number
}

type Point = { x: number; y: number }
const DEBUG = true

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
  if (DEBUG) {
    console.log('🔧 ConnectionRenderer Props:', { 
      peopleCount: people.length, 
      relationshipsCount: relationships.length,
      positionsCount: Object.keys(positions).length,
      sampleRelationship: relationships[0],
      samplePosition: Object.entries(positions)[0]
    })
  }

  // Create maps for quick lookups
  const spouseMap = new Map<string, string[]>()
  const parentChildMap = new Map<string, string[]>()
  const childParentsMap = new Map<string, Set<string>>()
  
  relationships.forEach(rel => {
    if (rel.relationship_type === 'spouse') {
      if (!spouseMap.has(rel.from_person_id)) spouseMap.set(rel.from_person_id, [])
      if (!spouseMap.has(rel.to_person_id)) spouseMap.set(rel.to_person_id, [])
      spouseMap.get(rel.from_person_id)!.push(rel.to_person_id)
      spouseMap.get(rel.to_person_id)!.push(rel.from_person_id)
    } else if (rel.relationship_type === 'parent') {
      if (!parentChildMap.has(rel.from_person_id)) parentChildMap.set(rel.from_person_id, [])
      parentChildMap.get(rel.from_person_id)!.push(rel.to_person_id)
      if (!childParentsMap.has(rel.to_person_id)) childParentsMap.set(rel.to_person_id, new Set())
      childParentsMap.get(rel.to_person_id)!.add(rel.from_person_id)
    }
  })

  if (DEBUG) {
    console.log('🔧 Relationship Maps:', { 
      spouseMapSize: spouseMap.size, 
      parentChildMapSize: parentChildMap.size,
      spouseMapEntries: Array.from(spouseMap.entries()).slice(0, 3),
      parentChildMapEntries: Array.from(parentChildMap.entries()).slice(0, 3)
    })
  }

  const renderConnections = () => {
    const paths: JSX.Element[] = []
    const hearts: JSX.Element[] = []
    let pathIndex = 0

    // Debug logging
    let parentChildCount = 0
    let spouseCount = 0
    const debugPaths: string[] = []

    // We'll collect parent->child edges to skip when routed through hearts
    const skipEdges = new Set<string>()

    // Render spouse connections (horizontal lines with hearts) and prepare couple->children routing
    const processedSpouses = new Set<string>()
    
    people.forEach(person => {
      const personPos = positions[person.id]
      if (!personPos) {
        if (DEBUG) console.log('❌ No position for person:', person.full_name, person.id)
        return
      }
      
      const spouses = spouseMap.get(person.id) || []
      spouses.forEach(spouseId => {
        const pairKey = [person.id, spouseId].sort().join('-')
        if (processedSpouses.has(pairKey)) return
        processedSpouses.add(pairKey)
        
        const spousePos = positions[spouseId]
        if (!spousePos) {
          if (DEBUG) console.log('❌ No position for spouse:', spouseId)
          return
        }
        
        const personAnchors = cardAnchors(personPos.x, personPos.y, cardWidth, cardHeight)
        const spouseAnchors = cardAnchors(spousePos.x, spousePos.y, cardWidth, cardHeight)
        
        // Determine which person is on the left
        const leftPerson = personPos.x < spousePos.x ? personAnchors : spouseAnchors
        const rightPerson = personPos.x < spousePos.x ? spouseAnchors : personAnchors
        
        const spousePath = `M ${leftPerson.midRight.x} ${leftPerson.midRight.y} L ${rightPerson.midLeft.x} ${rightPerson.midLeft.y}`
        spouseCount++
        if (debugPaths.length < 3) debugPaths.push(`Spouse: ${spousePath}`)
        
        paths.push(
          <path
            key={`spouse-${pathIndex++}`}
            d={spousePath}
            stroke="#FFFFFF"
            strokeWidth="3"
            fill="none"
            className="hover:stroke-[#FFD700] hover:stroke-[4px] transition-all"
          />
        )
        
        // Heart at midpoint
        const heartX = (leftPerson.midRight.x + rightPerson.midLeft.x) / 2
        const heartY = (leftPerson.midRight.y + rightPerson.midLeft.y) / 2
        hearts.push(
          <text
            key={`heart-${pathIndex}`}
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

        // Couple -> children routing via the heart
        const parent1Children = new Set(parentChildMap.get(person.id) || [])
        const parent2Children = new Set(parentChildMap.get(spouseId) || [])
        const unionChildren = new Set<string>([...parent1Children, ...parent2Children])

        // Prefer children that list BOTH parents; fall back to those listing at least one
        const sharedChildren = Array.from(unionChildren).filter(childId => {
          const parents = Array.from(childParentsMap.get(childId) || [])
          if (parents.length >= 2) {
            return parents.includes(person.id) && parents.includes(spouseId)
          }
          // If only one parent is recorded, still show under the couple to keep structure
          return parents.includes(person.id) || parents.includes(spouseId)
        })

        if (DEBUG) console.log(`💕 Checking children for couple ${person.full_name} & ${people.find(p => p.id === spouseId)?.full_name}:`, sharedChildren.length)

        if (sharedChildren.length > 0) {
          // Compute child top anchor positions that exist
          const childAnchors = sharedChildren
            .map(childId => {
              const childPos = positions[childId]
              const child = people.find(p => p.id === childId)
              if (DEBUG) console.log(`  Child ${child?.full_name}: has position = ${!!childPos}`)
              return { id: childId, pos: childPos, child }
            })
            .filter(({ pos }) => !!pos)
            .map(({ id, pos, child }) => ({ 
              id, 
              child,
              anchors: cardAnchors(pos!.x, pos!.y, cardWidth, cardHeight) 
            }))

          if (DEBUG) console.log(`  Valid child anchors: ${childAnchors.length}`)

          if (childAnchors.length > 0) {
            const xs = childAnchors.map(c => c.anchors.top.x)
            const ys = childAnchors.map(c => c.anchors.top.y)
            
            // Calculate proper spacing: heart → down 80px → horizontal bar → down 40px to children
            const parentBottomY = Math.max(personPos.y + cardHeight/2, spousePos.y + cardHeight/2)
            const trunkLength = 80 // Distance from heart down to horizontal bar
            const barToChildGap = 40 // Distance from bar to top of children cards
            
            const childrenTopY = Math.min(...ys)
            const barY = childrenTopY - barToChildGap // Position bar above children
            const trunkEndY = heartY + 8 + trunkLength // Heart + 8px offset + trunk length

            if (DEBUG) console.log(`  Heart at (${heartX}, ${heartY}), trunk ends at ${trunkEndY}, bar at Y=${barY}, children top at ${childrenTopY}`)

            if (childAnchors.length > 1) {
              // Multiple children: heart → vertical trunk → horizontal bar → vertical stems to children
              
              // Trunk from heart down
              paths.push(
                <path
                  key={`trunk-${pathIndex++}`}
                  d={`M ${heartX} ${heartY + 8} L ${heartX} ${barY}`}
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  fill="none"
                />
              )

              // Horizontal bar spanning all children
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

              // Vertical connector from trunk to horizontal bar if needed
              if (heartX < minX || heartX > maxX) {
                // Heart is outside child range, need horizontal connector
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

              // Short vertical stems from bar down to each child card
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
              // Single child - heart → vertical trunk → horizontal segment → vertical to child
              const childAnchor = childAnchors[0]
              const elbowPath = `M ${heartX} ${heartY + 8} L ${heartX} ${barY} L ${childAnchor.anchors.top.x} ${barY} L ${childAnchor.anchors.top.x} ${childAnchor.anchors.top.y}`
              paths.push(
                <path
                  key={`direct-child-${pathIndex++}`}
                  d={elbowPath}
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  fill="none"
                />
              )
            }

            // Mark edges to skip (from both parents to this child)
            childAnchors.forEach(c => {
              skipEdges.add(`${person.id}->${c.id}`)
              skipEdges.add(`${spouseId}->${c.id}`)
              if (DEBUG) console.log(`  Skipping direct edges to ${c.child?.full_name}`)
            })
          }
        }
      })
    })

    // Render parent-child connections (elbow/orthogonal paths)
    people.forEach(parent => {
      const parentPos = positions[parent.id]
      if (!parentPos) {
        if (DEBUG) console.log('❌ No position for parent:', parent.full_name, parent.id)
        return
      }
      
      const children = parentChildMap.get(parent.id) || []
      children.forEach(childId => {
        // Skip if this child is already handled via a spouse heart
        if (skipEdges.has(`${parent.id}->${childId}`)) return

        const child = people.find(p => p.id === childId)
        const childPos = positions[childId]
        if (!childPos || !child) {
          if (DEBUG) console.log('❌ No position or person for child:', childId, child?.full_name)
          return
        }
        
        const parentAnchors = cardAnchors(parentPos.x, parentPos.y, cardWidth, cardHeight)
        const childAnchors = cardAnchors(childPos.x, childPos.y, cardWidth, cardHeight)
        
        // Create elbow path from parent bottom to child top
        const pathData = elbowPath(parentAnchors.bottom, childAnchors.top)
        parentChildCount++
        if (debugPaths.length < 3) debugPaths.push(`Parent-Child: ${pathData}`)
        
        paths.push(
          <path
            key={`parent-child-${pathIndex++}`}
            d={pathData}
            stroke="#FFFFFF"
            strokeWidth="3"
            fill="none"
            className="hover:stroke-[#FFD700] hover:stroke-[4px] transition-all"
          />
        )
      })
    })

    // Debug output
    if (DEBUG) {
      console.log(`🔧 ConnectionRenderer Debug:`)
      console.log(`  - Parent→Child edges: ${parentChildCount}`)
      console.log(`  - Spouse edges: ${spouseCount}`)
      console.log(`  - First 3 paths:`, debugPaths)
    }

    return [...paths, ...hearts]
  }

  return (
    <>
      {renderConnections()}
    </>
  )
}