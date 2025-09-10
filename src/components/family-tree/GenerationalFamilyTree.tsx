import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ZoomIn, ZoomOut, Home, Heart, Plus } from 'lucide-react'
import type { Person, Relationship } from '@/lib/familyTreeTypes'

interface GenerationalNode {
  person: Person
  x: number
  y: number
  generation: number
  branchColor: string
  spouses: Person[]
  children: Person[]
  parents: Person[]
}

interface SpouseConnection {
  spouse1: Person
  spouse2: Person
  x: number
  y: number
  generation: number
  branchColor: string
  children: Person[]
}

interface GenerationalFamilyTreeProps {
  people: Person[]
  relationships: Relationship[]
  onPersonClick?: (personId: string) => void
  onPersonEdit?: (personId: string) => void
  onAddPerson?: (parentId?: string, type?: 'child' | 'spouse' | 'parent') => void
}

// Color palette for family branches
const BRANCH_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F97316', // Orange
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
  '#EF4444', // Red
  '#EAB308', // Yellow
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#84CC16', // Lime
]

export default function GenerationalFamilyTree({
  people,
  relationships,
  onPersonClick,
  onPersonEdit,
  onAddPerson
}: GenerationalFamilyTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(0.8)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hoveredPerson, setHoveredPerson] = useState<string | null>(null)

  // Layout constants
  const PERSON_WIDTH = 120
  const PERSON_HEIGHT = 140
  const GENERATION_HEIGHT = 200
  const SPOUSE_SPACING = 160
  const SIBLING_SPACING = 180
  const AVATAR_SIZE = 80

  // Build relationship maps
  const relationshipMaps = useMemo(() => {
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

    return { spouseMap, childrenMap, parentsMap }
  }, [relationships])

  // Assign branch colors based on root ancestors
  const assignBranchColors = (people: Person[], parentsMap: Map<string, string[]>) => {
    const branchColors = new Map<string, string>()
    const rootPeople = people.filter(person => !parentsMap.has(person.id))
    
    // Assign colors to root people
    rootPeople.forEach((person, index) => {
      const color = BRANCH_COLORS[index % BRANCH_COLORS.length]
      branchColors.set(person.id, color)
    })

    // Propagate colors down through generations
    const assignColorToDescendants = (personId: string, color: string, visited = new Set<string>()) => {
      if (visited.has(personId)) return
      visited.add(personId)
      
      branchColors.set(personId, color)
      
      const children = relationshipMaps.childrenMap.get(personId) || []
      children.forEach(childId => {
        assignColorToDescendants(childId, color, visited)
      })
    }

    rootPeople.forEach(person => {
      const color = branchColors.get(person.id)!
      assignColorToDescendants(person.id, color)
    })

    return branchColors
  }

  // Build generational layout
  const buildGenerationalLayout = () => {
    if (!people.length) return { nodes: [], spouseConnections: [] }

    const { spouseMap, childrenMap, parentsMap } = relationshipMaps
    const branchColors = assignBranchColors(people, parentsMap)

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

      // Add children to next generation
      const children = childrenMap.get(person.id) || []
      children.forEach(childId => {
        const child = people.find(p => p.id === childId)
        if (child && !visited.has(child.id)) {
          assignGeneration(child, generation + 1)
        }
      })
    }

    // Start from root people (those with no parents)
    const rootPeople = people.filter(person => !parentsMap.has(person.id))
    if (rootPeople.length === 0 && people.length > 0) {
      rootPeople.push(people[0])
    }
    
    rootPeople.forEach(person => assignGeneration(person, 0))

    // Create spouse connections first
    const spouseConnections: SpouseConnection[] = []
    const processedSpousePairs = new Set<string>()

    Array.from(generations.entries()).forEach(([generation, genPeople]) => {
      genPeople.forEach(person => {
        const spouses = spouseMap.get(person.id) || []
        spouses.forEach(spouseId => {
          const spouse = people.find(p => p.id === spouseId)
          if (spouse && personGeneration.get(spouse.id) === generation) {
            const pairKey = [person.id, spouseId].sort().join('-')
            if (!processedSpousePairs.has(pairKey)) {
              processedSpousePairs.add(pairKey)
              
              const children = Array.from(new Set([
                ...(childrenMap.get(person.id) || []),
                ...(childrenMap.get(spouseId) || [])
              ])).map(id => people.find(p => p.id === id)!).filter(Boolean)
              
              spouseConnections.push({
                spouse1: person,
                spouse2: spouse,
                x: 0, // Will be calculated later
                y: generation * GENERATION_HEIGHT,
                generation,
                branchColor: branchColors.get(person.id) || BRANCH_COLORS[0],
                children
              })
            }
          }
        })
      })
    })

    // Position spouse connections
    let currentX = 0
    const spouseConnectionPositions = new Map<string, { x: number, width: number }>()
    
    Array.from(generations.entries()).forEach(([generation, genPeople]) => {
      const genSpouseConnections = spouseConnections.filter(sc => sc.generation === generation)
      const singlePeople = genPeople.filter(person => {
        return !genSpouseConnections.some(sc => 
          sc.spouse1.id === person.id || sc.spouse2.id === person.id
        )
      })

      let genCurrentX = -(genSpouseConnections.length * SPOUSE_SPACING + singlePeople.length * SIBLING_SPACING) / 2

      // Position spouse connections
      genSpouseConnections.forEach(sc => {
        sc.x = genCurrentX
        spouseConnectionPositions.set(
          [sc.spouse1.id, sc.spouse2.id].sort().join('-'),
          { x: genCurrentX, width: SPOUSE_SPACING }
        )
        genCurrentX += SPOUSE_SPACING
      })

      // Position single people
      singlePeople.forEach(person => {
        genCurrentX += SIBLING_SPACING
      })
    })

    // Create nodes
    const nodes: GenerationalNode[] = []
    
    people.forEach(person => {
      const generation = personGeneration.get(person.id) ?? 0
      const spouses = (spouseMap.get(person.id) || []).map(id => people.find(p => p.id === id)!).filter(Boolean)
      const children = (childrenMap.get(person.id) || []).map(id => people.find(p => p.id === id)!).filter(Boolean)
      const parents = (parentsMap.get(person.id) || []).map(id => people.find(p => p.id === id)!).filter(Boolean)
      
      // Find position
      let x = 0
      let y = generation * GENERATION_HEIGHT

      // Check if person is part of a spouse connection
      const spouseConnection = spouseConnections.find(sc => 
        sc.spouse1.id === person.id || sc.spouse2.id === person.id
      )
      
      if (spouseConnection) {
        if (spouseConnection.spouse1.id === person.id) {
          x = spouseConnection.x - SPOUSE_SPACING / 4
        } else {
          x = spouseConnection.x + SPOUSE_SPACING / 4
        }
      } else {
        // Single person positioning
        const genPeople = generations.get(generation) || []
        const singlePeople = genPeople.filter(p => {
          return !spouseConnections.some(sc => 
            sc.spouse1.id === p.id || sc.spouse2.id === p.id
          )
        })
        const personIndex = singlePeople.findIndex(p => p.id === person.id)
        const totalWidth = singlePeople.length * SIBLING_SPACING
        x = -totalWidth / 2 + personIndex * SIBLING_SPACING
      }

      nodes.push({
        person,
        x,
        y,
        generation,
        branchColor: branchColors.get(person.id) || BRANCH_COLORS[0],
        spouses,
        children,
        parents
      })
    })

    return { nodes, spouseConnections }
  }

  const { nodes, spouseConnections } = buildGenerationalLayout()

  // Zoom and pan handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3))
  const handleResetView = () => {
    setZoom(0.8)
    setPan({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
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

    // Parent-child lines
    nodes.forEach(node => {
      node.children.forEach(child => {
        const childNode = nodes.find(n => n.person.id === child.id)
        if (childNode) {
          // Find if parents are married (spouse connection)
          const spouseConnection = spouseConnections.find(sc => 
            (sc.spouse1.id === node.person.id || sc.spouse2.id === node.person.id) &&
            sc.children.some(c => c.id === child.id)
          )

          if (spouseConnection) {
            // Line from center of spouse connection to child
            lines.push(
              <g key={`parent-child-${node.person.id}-${child.id}`}>
                {/* Vertical line from spouse connection center */}
                <line
                  x1={spouseConnection.x}
                  y1={spouseConnection.y + PERSON_HEIGHT}
                  x2={spouseConnection.x}
                  y2={spouseConnection.y + PERSON_HEIGHT + 40}
                  stroke="#94A3B8"
                  strokeWidth="2"
                />
                {/* Horizontal line to child position */}
                <line
                  x1={spouseConnection.x}
                  y1={spouseConnection.y + PERSON_HEIGHT + 40}
                  x2={childNode.x}
                  y2={spouseConnection.y + PERSON_HEIGHT + 40}
                  stroke="#94A3B8"
                  strokeWidth="2"
                />
                {/* Vertical line down to child */}
                <line
                  x1={childNode.x}
                  y1={spouseConnection.y + PERSON_HEIGHT + 40}
                  x2={childNode.x}
                  y2={childNode.y}
                  stroke="#94A3B8"
                  strokeWidth="2"
                />
              </g>
            )
          } else {
            // Direct parent-child line
            lines.push(
              <line
                key={`parent-child-single-${node.person.id}-${child.id}`}
                x1={node.x}
                y1={node.y + PERSON_HEIGHT}
                x2={childNode.x}
                y2={childNode.y}
                stroke="#94A3B8"
                strokeWidth="2"
              />
            )
          }
        }
      })
    })

    return lines
  }

  // Render spouse connections
  const renderSpouseConnections = () => {
    return spouseConnections.map((sc, index) => (
      <g key={`spouse-${sc.spouse1.id}-${sc.spouse2.id}`}>
        {/* Connection line */}
        <line
          x1={sc.x - SPOUSE_SPACING / 4}
          y1={sc.y + PERSON_HEIGHT / 2}
          x2={sc.x + SPOUSE_SPACING / 4}
          y2={sc.y + PERSON_HEIGHT / 2}
          stroke={sc.branchColor}
          strokeWidth="3"
        />
        {/* Heart icon */}
        <circle
          cx={sc.x}
          cy={sc.y + PERSON_HEIGHT / 2}
          r="12"
          fill="white"
          stroke={sc.branchColor}
          strokeWidth="2"
        />
        <Heart
          x={sc.x - 8}
          y={sc.y + PERSON_HEIGHT / 2 - 8}
          width={16}
          height={16}
          fill={sc.branchColor}
          stroke="none"
        />
      </g>
    ))
  }

  // Render person card
  const renderPersonCard = (node: GenerationalNode) => {
    const { person, x, y, branchColor } = node
    const displayName = person.full_name || `${person.given_name || ''} ${person.surname || ''}`.trim()
    const birthYear = person.birth_year || (person.birth_date ? new Date(person.birth_date).getFullYear() : null)
    const deathYear = person.death_year || (person.death_date ? new Date(person.death_date).getFullYear() : null)
    const years = deathYear ? `${birthYear || '?'} - ${deathYear}` : `${birthYear || '?'} - Present`

    return (
      <g
        key={person.id}
        transform={`translate(${x - PERSON_WIDTH/2}, ${y})`}
        className="cursor-pointer transition-all duration-200"
        onClick={() => onPersonClick?.(person.id)}
        onMouseEnter={() => setHoveredPerson(person.id)}
        onMouseLeave={() => setHoveredPerson(null)}
      >
        {/* Card background */}
        <rect
          width={PERSON_WIDTH}
          height={PERSON_HEIGHT}
          rx="12"
          fill="white"
          stroke={hoveredPerson === person.id ? branchColor : '#E5E7EB'}
          strokeWidth={hoveredPerson === person.id ? 3 : 1}
          className="drop-shadow-md"
        />
        
        {/* Avatar */}
        <circle
          cx={PERSON_WIDTH / 2}
          cy={30 + AVATAR_SIZE / 2}
          r={AVATAR_SIZE / 2}
          fill="white"
          stroke={branchColor}
          strokeWidth="4"
        />
        
        {/* Profile image or initials */}
        {person.avatar_url ? (
          <image
            href={person.avatar_url}
            x={PERSON_WIDTH / 2 - AVATAR_SIZE / 2}
            y={30}
            width={AVATAR_SIZE}
            height={AVATAR_SIZE}
            clipPath={`circle(${AVATAR_SIZE / 2}px at center)`}
          />
        ) : (
          <text
            x={PERSON_WIDTH / 2}
            y={30 + AVATAR_SIZE / 2 + 6}
            textAnchor="middle"
            className="fill-gray-600 text-lg font-bold"
            fontSize="18"
          >
            {displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </text>
        )}
        
        {/* Name */}
        <text
          x={PERSON_WIDTH / 2}
          y={30 + AVATAR_SIZE + 20}
          textAnchor="middle"
          className="fill-gray-900 text-sm font-semibold"
          fontSize="12"
        >
          {displayName.length > 16 ? displayName.substring(0, 16) + '...' : displayName}
        </text>
        
        {/* Years */}
        <text
          x={PERSON_WIDTH / 2}
          y={30 + AVATAR_SIZE + 35}
          textAnchor="middle"
          className="fill-gray-500 text-xs"
          fontSize="10"
        >
          {years}
        </text>

        {/* Add person buttons on hover */}
        {hoveredPerson === person.id && (
          <>
            {/* Add child button */}
            <circle
              cx={PERSON_WIDTH / 2}
              cy={PERSON_HEIGHT + 15}
              r="12"
              fill={branchColor}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                onAddPerson?.(person.id, 'child')
              }}
            />
            <Plus
              x={PERSON_WIDTH / 2 - 6}
              y={PERSON_HEIGHT + 15 - 6}
              width={12}
              height={12}
              stroke="white"
              strokeWidth={2}
            />
            
            {/* Add spouse button */}
            <circle
              cx={PERSON_WIDTH + 15}
              cy={PERSON_HEIGHT / 2}
              r="12"
              fill={branchColor}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                onAddPerson?.(person.id, 'spouse')
              }}
            />
            <Plus
              x={PERSON_WIDTH + 15 - 6}
              y={PERSON_HEIGHT / 2 - 6}
              width={12}
              height={12}
              stroke="white"
              strokeWidth={2}
            />
          </>
        )}
      </g>
    )
  }

  if (!nodes.length) {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Family Tree Data</h3>
          <p className="text-gray-500">Add people and relationships to see your family tree</p>
        </div>
      </div>
    )
  }

  // Calculate canvas dimensions
  const padding = 200
  const minX = Math.min(...nodes.map(n => n.x - PERSON_WIDTH/2)) - padding
  const maxX = Math.max(...nodes.map(n => n.x + PERSON_WIDTH/2)) + padding
  const minY = Math.min(...nodes.map(n => n.y)) - padding
  const maxY = Math.max(...nodes.map(n => n.y + PERSON_HEIGHT)) + padding
  const width = maxX - minX
  const height = maxY - minY

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden">
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

      {/* Canvas */}
      <div
        ref={containerRef}
        className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`${minX} ${minY} ${width} ${height}`}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          {/* Grid background */}
          <defs>
            <pattern id="generational-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#F1F5F9" strokeWidth="1" opacity="0.3"/>
            </pattern>
          </defs>
          <rect x={minX} y={minY} width={width} height={height} fill="url(#generational-grid)" />
          
          {/* Connection lines */}
          {renderConnections()}
          
          {/* Spouse connections */}
          {renderSpouseConnections()}
          
          {/* Person cards */}
          {nodes.map(renderPersonCard)}
        </svg>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
        <h4 className="font-semibold text-sm mb-2">Family Branches</h4>
        <div className="space-y-2 text-xs">
          {Array.from(new Set(nodes.map(n => n.branchColor))).map((color, index) => (
            <div key={color} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full border-2" 
                style={{ backgroundColor: color, borderColor: color }}
              ></div>
              <span>Branch {index + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}