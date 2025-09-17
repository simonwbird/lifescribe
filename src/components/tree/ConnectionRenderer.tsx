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
  console.log('🔧 ConnectionRenderer Props:', { 
    peopleCount: people.length, 
    relationshipsCount: relationships.length,
    positionsCount: Object.keys(positions).length,
    sampleRelationship: relationships[0],
    samplePosition: Object.entries(positions)[0]
  })

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

  console.log('🔧 Relationship Maps:', { 
    spouseMapSize: spouseMap.size, 
    parentChildMapSize: parentChildMap.size,
    spouseMapEntries: Array.from(spouseMap.entries()).slice(0, 3),
    parentChildMapEntries: Array.from(parentChildMap.entries()).slice(0, 3)
  })

  const renderConnections = () => {
    const paths: JSX.Element[] = []
    const hearts: JSX.Element[] = []
    let pathIndex = 0

    // Debug logging
    let parentChildCount = 0
    let spouseCount = 0
    const debugPaths: string[] = []

    // Render spouse connections (horizontal lines with hearts)
    const processedSpouses = new Set<string>()
    
    people.forEach(person => {
      const personPos = positions[person.id]
      if (!personPos) {
        console.log('❌ No position for person:', person.full_name, person.id)
        return
      }
      
      const spouses = spouseMap.get(person.id) || []
      spouses.forEach(spouseId => {
        const pairKey = [person.id, spouseId].sort().join('-')
        if (processedSpouses.has(pairKey)) return
        processedSpouses.add(pairKey)
        
        const spousePos = positions[spouseId]
        if (!spousePos) {
          console.log('❌ No position for spouse:', spouseId)
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
        
        console.log('✅ Creating spouse connection:', person.full_name, '↔', people.find(p => p.id === spouseId)?.full_name)
        
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
      })
    })

    // Render parent-child connections (elbow/orthogonal paths)
    people.forEach(parent => {
      const parentPos = positions[parent.id]
      if (!parentPos) {
        console.log('❌ No position for parent:', parent.full_name, parent.id)
        return
      }
      
      const children = parentChildMap.get(parent.id) || []
      children.forEach(childId => {
        const child = people.find(p => p.id === childId)
        const childPos = positions[childId]
        if (!childPos || !child) {
          console.log('❌ No position or person for child:', childId, child?.full_name)
          return
        }
        
        const parentAnchors = cardAnchors(parentPos.x, parentPos.y, cardWidth, cardHeight)
        const childAnchors = cardAnchors(childPos.x, childPos.y, cardWidth, cardHeight)
        
        // Create elbow path from parent bottom to child top
        const pathData = elbowPath(parentAnchors.bottom, childAnchors.top)
        parentChildCount++
        if (debugPaths.length < 3) debugPaths.push(`Parent-Child: ${pathData}`)
        
        console.log('✅ Creating parent-child connection:', parent.full_name, '→', child.full_name)
        
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
    console.log(`🔧 ConnectionRenderer Debug:`)
    console.log(`  - Parent→Child edges: ${parentChildCount}`)
    console.log(`  - Spouse edges: ${spouseCount}`)
    console.log(`  - First 3 paths:`, debugPaths)

    return [...paths, ...hearts]
  }

  return (
    <>
      {renderConnections()}
    </>
  )
}