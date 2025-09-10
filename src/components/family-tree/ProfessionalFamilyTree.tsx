import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, Home, Download } from 'lucide-react'
import type { Person, Relationship } from '@/lib/familyTreeTypes'

interface FamilyNode {
  person: Person
  x: number
  y: number
  generation: number
  spouses: Person[]
  children: Person[]
  parents: Person[]
}

interface ProfessionalFamilyTreeProps {
  people: Person[]
  relationships: Relationship[]
  onPersonClick?: (personId: string) => void
  onPersonEdit?: (personId: string) => void
}

export default function ProfessionalFamilyTree({
  people,
  relationships,
  onPersonClick,
  onPersonEdit
}: ProfessionalFamilyTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [nodes, setNodes] = useState<FamilyNode[]>([])

  // Layout constants
  const NODE_WIDTH = 120
  const NODE_HEIGHT = 140
  const GENERATION_HEIGHT = 200
  const SPOUSE_SPACING = 160
  const SIBLING_SPACING = 180
  const MIN_HORIZONTAL_SPACING = 200

  // Build family tree structure
  const buildFamilyTree = () => {
    if (!people.length) return []

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

    // Find root generation (people with no parents)
    const rootPeople = people.filter(person => !parentsMap.has(person.id))
    
    // Assign generations
    const generations = new Map<number, Person[]>()
    const personGeneration = new Map<string, number>()
    const visited = new Set<string>()

    const assignGeneration = (person: Person, generation: number) => {
      if (visited.has(person.id)) return
      visited.add(person.id)
      
      personGeneration.set(person.id, generation)
      if (!generations.has(generation)) generations.set(generation, [])
      generations.get(generation)!.push(person)

      // Add spouses to same generation
      const spouses = spouseMap.get(person.id) || []
      spouses.forEach(spouseId => {
        const spouse = people.find(p => p.id === spouseId)
        if (spouse && !visited.has(spouse.id)) {
          assignGeneration(spouse, generation)
        }
      })

      // Add children to next generation
      const children = childrenMap.get(person.id) || []
      children.forEach(childId => {
        const child = people.find(p => p.id === childId)
        if (child && !visited.has(child.id)) {
          assignGeneration(child, generation + 1)
        }
      })
    }

    // Start from root people
    rootPeople.forEach(person => assignGeneration(person, 0))

    // Create nodes with positions
    const treeNodes: FamilyNode[] = []
    
    Array.from(generations.entries()).forEach(([generation, genPeople]) => {
      // Group married couples
      const processed = new Set<string>()
      const couples: Person[][] = []
      const singles: Person[] = []

      genPeople.forEach(person => {
        if (processed.has(person.id)) return
        
        const spouses = spouseMap.get(person.id) || []
        const spousesInGeneration = spouses
          .map(id => people.find(p => p.id === id))
          .filter(p => p && personGeneration.get(p.id) === generation)

        if (spousesInGeneration.length > 0) {
          const couple = [person, ...spousesInGeneration]
          couples.push(couple)
          couple.forEach(p => processed.add(p.id))
        } else {
          singles.push(person)
          processed.add(person.id)
        }
      })

      // Calculate positions
      const totalWidth = couples.length * SPOUSE_SPACING * 2 + singles.length * SIBLING_SPACING + 
                        Math.max(0, couples.length + singles.length - 1) * MIN_HORIZONTAL_SPACING
      
      let currentX = -totalWidth / 2

      // Position couples
      couples.forEach(couple => {
        const coupleWidth = couple.length * SPOUSE_SPACING
        const startX = currentX + coupleWidth / 2
        
        couple.forEach((person, index) => {
          const x = startX + (index - (couple.length - 1) / 2) * SPOUSE_SPACING
          const y = generation * GENERATION_HEIGHT
          
          treeNodes.push({
            person,
            x,
            y,
            generation,
            spouses: couple.filter(p => p.id !== person.id),
            children: (childrenMap.get(person.id) || []).map(id => people.find(p => p.id === id)!).filter(Boolean),
            parents: (parentsMap.get(person.id) || []).map(id => people.find(p => p.id === id)!).filter(Boolean)
          })
        })
        
        currentX += coupleWidth + MIN_HORIZONTAL_SPACING
      })

      // Position singles
      singles.forEach(person => {
        treeNodes.push({
          person,
          x: currentX,
          y: generation * GENERATION_HEIGHT,
          generation,
          spouses: [],
          children: (childrenMap.get(person.id) || []).map(id => people.find(p => p.id === id)!).filter(Boolean),
          parents: (parentsMap.get(person.id) || []).map(id => people.find(p => p.id === id)!).filter(Boolean)
        })
        currentX += SIBLING_SPACING + MIN_HORIZONTAL_SPACING
      })
    })

    return treeNodes
  }

  useEffect(() => {
    const treeNodes = buildFamilyTree()
    setNodes(treeNodes)
  }, [people, relationships])

  // Zoom and pan handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3))
  const handleResetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Render connection lines
  const renderConnections = () => {
    const lines: JSX.Element[] = []

    nodes.forEach(node => {
      // Marriage lines (horizontal)
      node.spouses.forEach(spouse => {
        const spouseNode = nodes.find(n => n.person.id === spouse.id)
        if (spouseNode && node.person.id < spouse.id) { // Avoid duplicate lines
          lines.push(
            <line
              key={`marriage-${node.person.id}-${spouse.id}`}
              x1={node.x + NODE_WIDTH / 2}
              y1={node.y + NODE_HEIGHT / 2}
              x2={spouseNode.x + NODE_WIDTH / 2}
              y2={spouseNode.y + NODE_HEIGHT / 2}
              stroke="#f59e0b"
              strokeWidth="3"
              strokeDasharray="8,4"
            />
          )
        }
      })

      // Parent-child lines
      node.children.forEach(child => {
        const childNode = nodes.find(n => n.person.id === child.id)
        if (childNode) {
          // Find marriage line midpoint if parents are married
          const parentSpouse = node.spouses[0]
          const spouseNode = parentSpouse ? nodes.find(n => n.person.id === parentSpouse.id) : null
          
          if (spouseNode) {
            // T-intersection from marriage line
            const midX = (node.x + spouseNode.x) / 2 + NODE_WIDTH / 2
            const parentY = node.y + NODE_HEIGHT / 2
            const childX = childNode.x + NODE_WIDTH / 2
            const childY = childNode.y + NODE_HEIGHT / 2
            const intermediateY = parentY + 40

            lines.push(
              <g key={`parent-child-${node.person.id}-${child.id}`}>
                {/* Vertical line down from marriage */}
                <line
                  x1={midX}
                  y1={parentY}
                  x2={midX}
                  y2={intermediateY}
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
                {/* Horizontal line to child */}
                <line
                  x1={midX}
                  y1={intermediateY}
                  x2={childX}
                  y2={intermediateY}
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
                {/* Vertical line to child */}
                <line
                  x1={childX}
                  y1={intermediateY}
                  x2={childX}
                  y2={childY}
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
              </g>
            )
          } else {
            // Direct parent-child line
            lines.push(
              <line
                key={`parent-child-${node.person.id}-${child.id}`}
                x1={node.x + NODE_WIDTH / 2}
                y1={node.y + NODE_HEIGHT}
                x2={childNode.x + NODE_WIDTH / 2}
                y2={childNode.y}
                stroke="#3b82f6"
                strokeWidth="2"
              />
            )
          }
        }
      })
    })

    return lines
  }

  // Render person node
  const renderPersonNode = (node: FamilyNode) => {
    const { person, x, y } = node
    const displayName = person.full_name || `${person.given_name || ''} ${person.surname || ''}`.trim()
    const years = [person.birth_year, person.death_year].filter(Boolean).join(' - ') || ''

    return (
      <g
        key={person.id}
        transform={`translate(${x}, ${y})`}
        className="cursor-pointer"
        onClick={() => onPersonClick?.(person.id)}
      >
        {/* Background card */}
        <rect
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
          rx="12"
          fill="white"
          stroke="#e5e7eb"
          strokeWidth="1"
          className="hover:stroke-blue-400 transition-colors"
        />
        
        {/* Profile photo circle */}
        <circle
          cx={NODE_WIDTH / 2}
          cy={35}
          r="25"
          fill="#f3f4f6"
          stroke="#d1d5db"
          strokeWidth="2"
        />
        
        {/* Profile image or initials */}
        {person.avatar_url ? (
          <image
            href={person.avatar_url}
            x={NODE_WIDTH / 2 - 25}
            y={10}
            width="50"
            height="50"
            clipPath="circle(25px at center)"
          />
        ) : (
          <text
            x={NODE_WIDTH / 2}
            y={42}
            textAnchor="middle"
            className="fill-gray-600 text-sm font-medium"
          >
            {displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </text>
        )}
        
        {/* Name */}
        <text
          x={NODE_WIDTH / 2}
          y={80}
          textAnchor="middle"
          className="fill-gray-900 text-sm font-semibold"
        >
          {displayName.length > 12 ? displayName.substring(0, 12) + '...' : displayName}
        </text>
        
        {/* Years */}
        {years && (
          <text
            x={NODE_WIDTH / 2}
            y={100}
            textAnchor="middle"
            className="fill-gray-500 text-xs"
          >
            {years}
          </text>
        )}
        
        {/* Gender indicator */}
        {person.gender && (
          <rect
            x={NODE_WIDTH - 20}
            y={5}
            width="15"
            height="15"
            rx="3"
            fill={person.gender.toLowerCase() === 'male' ? '#3b82f6' : person.gender.toLowerCase() === 'female' ? '#ec4899' : '#6b7280'}
          />
        )}
      </g>
    )
  }

  // Calculate SVG dimensions
  const padding = 200
  const minX = Math.min(...nodes.map(n => n.x)) - padding
  const maxX = Math.max(...nodes.map(n => n.x + NODE_WIDTH)) + padding
  const minY = Math.min(...nodes.map(n => n.y)) - padding
  const maxY = Math.max(...nodes.map(n => n.y + NODE_HEIGHT)) + padding
  const width = maxX - minX
  const height = maxY - minY

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button variant="outline" size="sm" onClick={handleZoomIn}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleResetView}>
          <Home className="w-4 h-4" />
        </Button>
      </div>

      {/* Family Tree SVG */}
      <svg
        ref={svgRef}
        className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          <g transform={`translate(${-minX}, ${-minY})`}>
            {/* Grid background */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f1f5f9" strokeWidth="1" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width={width} height={height} fill="url(#grid)" />
            
            {/* Connection lines */}
            {renderConnections()}
            
            {/* Person nodes */}
            {nodes.map(renderPersonNode)}
          </g>
        </g>
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
        <h4 className="font-semibold text-sm mb-2">Connection Types</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0 border-t-3 border-dashed border-amber-500"></div>
            <span>Marriage</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0 border-t-2 border-blue-500"></div>
            <span>Parent-Child</span>
          </div>
        </div>
      </div>
    </div>
  )
}