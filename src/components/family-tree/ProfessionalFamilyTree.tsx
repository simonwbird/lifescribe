import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, Home } from 'lucide-react'
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
  const [zoom, setZoom] = useState(0.8)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [nodes, setNodes] = useState<FamilyNode[]>([])

  // Layout constants - adjusted for better visibility
  const NODE_WIDTH = 140
  const NODE_HEIGHT = 160
  const GENERATION_HEIGHT = 250
  const SPOUSE_SPACING = 180
  const SIBLING_SPACING = 200

  console.log('ProfessionalFamilyTree rendering with:', { 
    peopleCount: people.length, 
    relationshipsCount: relationships.length,
    nodesCount: nodes.length 
  })

  // Simplified family tree builder
  const buildFamilyTree = () => {
    if (!people.length) {
      console.log('No people data')
      return []
    }

    console.log('Building family tree with people:', people.map(p => p.full_name))
    console.log('Relationships:', relationships)

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
    console.log('Root people:', rootPeople.map(p => p.full_name))
    
    // If no root people found, take first person as root
    if (rootPeople.length === 0) {
      rootPeople.push(people[0])
    }

    // Assign generations using BFS
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

    console.log('Generations:', Array.from(generations.entries()))

    // Create nodes with simple positioning
    const treeNodes: FamilyNode[] = []
    
    Array.from(generations.entries()).forEach(([generation, genPeople]) => {
      const totalWidth = genPeople.length * SIBLING_SPACING
      let currentX = -totalWidth / 2

      genPeople.forEach((person, index) => {
        const x = currentX + index * SIBLING_SPACING
        const y = generation * GENERATION_HEIGHT

        treeNodes.push({
          person,
          x,
          y,
          generation,
          spouses: (spouseMap.get(person.id) || []).map(id => people.find(p => p.id === id)!).filter(Boolean),
          children: (childrenMap.get(person.id) || []).map(id => people.find(p => p.id === id)!).filter(Boolean),
          parents: (parentsMap.get(person.id) || []).map(id => people.find(p => p.id === id)!).filter(Boolean)
        })
      })
    })

    console.log('Generated nodes:', treeNodes)
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
    setZoom(0.8)
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
    if (!nodes.length) return []
    
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
          // Simple direct line for now
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
      })
    })

    console.log('Rendering connections:', lines.length)
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
          strokeWidth="2"
          className="hover:stroke-blue-400 transition-colors drop-shadow-md"
        />
        
        {/* Profile photo circle */}
        <circle
          cx={NODE_WIDTH / 2}
          cy={40}
          r="28"
          fill="#f3f4f6"
          stroke="#d1d5db"
          strokeWidth="2"
        />
        
        {/* Profile image or initials */}
        {person.avatar_url ? (
          <image
            href={person.avatar_url}
            x={NODE_WIDTH / 2 - 28}
            y={12}
            width="56"
            height="56"
            clipPath="circle(28px at center)"
          />
        ) : (
          <text
            x={NODE_WIDTH / 2}
            y={48}
            textAnchor="middle"
            className="fill-gray-600 text-base font-bold"
          >
            {displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </text>
        )}
        
        {/* Name */}
        <text
          x={NODE_WIDTH / 2}
          y={90}
          textAnchor="middle"
          className="fill-gray-900 text-sm font-semibold"
        >
          {displayName.length > 14 ? displayName.substring(0, 14) + '...' : displayName}
        </text>
        
        {/* Years */}
        {years && (
          <text
            x={NODE_WIDTH / 2}
            y={110}
            textAnchor="middle"
            className="fill-gray-500 text-xs"
          >
            {years}
          </text>
        )}
        
        {/* Status indicator */}
        <text
          x={NODE_WIDTH / 2}
          y={130}
          textAnchor="middle"
          className="fill-gray-400 text-xs"
        >
          Gen {node.generation}
        </text>
      </g>
    )
  }

  // Calculate SVG dimensions
  if (!nodes.length) {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Family Tree Data</h3>
          <p className="text-gray-500">Add people and relationships to see your family tree</p>
        </div>
      </div>
    )
  }

  const padding = 300  
  const minX = Math.min(...nodes.map(n => n.x)) - padding
  const maxX = Math.max(...nodes.map(n => n.x + NODE_WIDTH)) + padding
  const minY = Math.min(...nodes.map(n => n.y)) - padding
  const maxY = Math.max(...nodes.map(n => n.y + NODE_HEIGHT)) + padding
  const width = maxX - minX
  const height = maxY - minY

  console.log('SVG dimensions:', { minX, maxX, minY, maxY, width, height })

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

      {/* Debug info */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg text-xs">
        <div>People: {people.length}</div>
        <div>Nodes: {nodes.length}</div>
        <div>Zoom: {zoom.toFixed(2)}</div>
      </div>

      {/* Family Tree SVG */}
      <svg
        ref={svgRef}
        className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        viewBox={`${minX} ${minY} ${width} ${height}`}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Grid background */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f1f5f9" strokeWidth="1" opacity="0.3"/>
            </pattern>
          </defs>
          <rect x={minX} y={minY} width={width} height={height} fill="url(#grid)" />
          
          {/* Connection lines */}
          {renderConnections()}
          
          {/* Person nodes */}
          {nodes.map(renderPersonNode)}
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