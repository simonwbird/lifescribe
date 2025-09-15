import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ZoomIn, ZoomOut, Home, Mic, MoreHorizontal, Edit3 } from 'lucide-react'
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
  onRecordMemoryAbout?: (personId: string, personName: string) => void
}

export default function ProfessionalFamilyTree({
  people,
  relationships,
  onPersonClick,
  onPersonEdit,
  onRecordMemoryAbout
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
      // Marriage lines (curved)
      node.spouses.forEach(spouse => {
        const spouseNode = nodes.find(n => n.person.id === spouse.id)
        if (spouseNode && node.person.id < spouse.id) { // Avoid duplicate lines
          const midX = (node.x + NODE_WIDTH / 2 + spouseNode.x + NODE_WIDTH / 2) / 2
          const midY = (node.y + NODE_HEIGHT / 2 + spouseNode.y + NODE_HEIGHT / 2) / 2
          const heartSize = 8
          
          lines.push(
            <g key={`marriage-${node.person.id}-${spouse.id}`}>
              <path
                d={`M ${node.x + NODE_WIDTH / 2} ${node.y + NODE_HEIGHT / 2} 
                   Q ${midX} ${midY - 20} ${spouseNode.x + NODE_WIDTH / 2} ${spouseNode.y + NODE_HEIGHT / 2}`}
                stroke="#e11d48"
                strokeWidth="2.5"
                fill="none"
                strokeDasharray="6,3"
              />
              <circle
                cx={midX}
                cy={midY - 10}
                r={heartSize}
                fill="#fecaca"
                stroke="#e11d48"
                strokeWidth="2"
              />
              <text
                x={midX}
                y={midY - 6}
                textAnchor="middle"
                className="fill-red-600 text-xs font-bold"
              >
                ♥
              </text>
            </g>
          )
        }
      })

      // Parent-child lines (curved)
      node.children.forEach(child => {
        const childNode = nodes.find(n => n.person.id === child.id)
        if (childNode) {
          const startX = node.x + NODE_WIDTH / 2
          const startY = node.y + NODE_HEIGHT
          const endX = childNode.x + NODE_WIDTH / 2
          const endY = childNode.y
          const midY = startY + (endY - startY) / 2
          
          lines.push(
            <path
              key={`parent-child-${node.person.id}-${child.id}`}
              d={`M ${startX} ${startY} 
                 Q ${startX} ${midY} ${(startX + endX) / 2} ${midY}
                 Q ${endX} ${midY} ${endX} ${endY}`}
              stroke="#3b82f6"
              strokeWidth="2"
              fill="none"
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
      <g key={person.id} transform={`translate(${x}, ${y})`} className="group">
        {/* Background card */}
        <rect
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
          rx="12"
          fill="white"
          stroke="#e2e8f0"
          strokeWidth="1.5"
          className="hover:stroke-blue-400 transition-colors group-hover:stroke-blue-400"
          style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))" }}
        />
        
        {/* Profile photo circle */}
        <circle
          cx={NODE_WIDTH / 2}
          cy={40}
          r="26"
          fill="#f8fafc"
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />
        
        {/* Profile image or initials */}
        {person.avatar_url ? (
          <image
            href={person.avatar_url}
            x={NODE_WIDTH / 2 - 26}
            y={14}
            width="52"
            height="52"
            clipPath="circle(26px at center)"
          />
        ) : (
          <text
            x={NODE_WIDTH / 2}
            y={46}
            textAnchor="middle"
            className="fill-slate-600 text-sm font-semibold"
          >
            {displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </text>
        )}
        
        {/* Name */}
        <text
          x={NODE_WIDTH / 2}
          y={85}
          textAnchor="middle"
          className="fill-slate-900 text-sm font-semibold"
        >
          {displayName.length > 16 ? displayName.substring(0, 16) + '...' : displayName}
        </text>
        
        {/* Years */}
        {years && (
          <text
            x={NODE_WIDTH / 2}
            y={102}
            textAnchor="middle"
            className="fill-slate-500 text-xs"
          >
            {years}
          </text>
        )}

        {/* Action dropdown */}
        <foreignObject x={NODE_WIDTH - 32} y={8} width="24" height="24">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost" 
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 relative z-50"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="bg-white border border-gray-200 shadow-lg z-[100] min-w-[180px]"
              sideOffset={5}
            >
              <DropdownMenuItem 
                onClick={() => onRecordMemoryAbout?.(person.id, displayName)}
                className="hover:bg-gray-100 cursor-pointer"
              >
                <Mic className="h-4 w-4 mr-2" />
                Record about {displayName.split(' ')[0]}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onPersonEdit?.(person.id)}
                className="hover:bg-gray-100 cursor-pointer"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </foreignObject>

        {/* Clickable overlay */}
        <rect
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
          rx="12"
          fill="transparent"
          className="cursor-pointer"
          onClick={() => onPersonClick?.(person.id)}
        />
      </g>
    )
  }

  // Calculate SVG dimensions
  if (!nodes.length) {
    return (
      <div className="relative w-full h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden flex items-center justify-center">
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

  console.log('SVG dimensions:', { minX, maxX, minY, maxY, width, height, nodesCount: nodes.length })

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden">
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
        viewBox={`${minX} ${minY} ${width} ${height}`}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Connection lines */}
          {renderConnections()}
          
          {/* Person nodes */}
          {nodes.map(renderPersonNode)}
        </g>
      </svg>
    </div>
  )
}