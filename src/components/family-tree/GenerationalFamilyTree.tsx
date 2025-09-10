import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, Home, Grid, Shuffle, Plus } from 'lucide-react'
import { FamilyTreeLayoutEngine, type LayoutNode, type Marriage } from '@/utils/familyTreeLayoutEngine'
import ConnectionRenderer from '@/components/family-tree/ConnectionRenderer'
import type { Person, Relationship } from '@/lib/familyTreeTypes'

interface GenerationalFamilyTreeProps {
  people: Person[]
  relationships: Relationship[]
  onPersonClick?: (personId: string) => void
  onPersonEdit?: (personId: string) => void
  onAddPerson?: (parentId?: string, type?: 'child' | 'spouse' | 'parent') => void
}

export default function GenerationalFamilyTree({
  people,
  relationships,
  onPersonClick,
  onPersonEdit,
  onAddPerson
}: GenerationalFamilyTreeProps) {
  const [zoom, setZoom] = useState(0.8)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hoveredPerson, setHoveredPerson] = useState<string | null>(null)
  const [autoLayout, setAutoLayout] = useState(true)

  const PERSON_WIDTH = 120
  const PERSON_HEIGHT = 140
  const AVATAR_SIZE = 80

  // Initialize layout engine with cache-busting
  const layoutEngine = useMemo(() => {
    console.log('Creating new FamilyTreeLayoutEngine instance')
    return new FamilyTreeLayoutEngine()
  }, [])

  // Generate layout using the engine with forced refresh
  const { nodes, marriages, dimensions } = useMemo(() => {
    console.log('Generating layout with', people.length, 'people and', relationships.length, 'relationships')
    if (!people.length || !autoLayout) {
      return { 
        nodes: [], 
        marriages: [], 
        dimensions: { minX: 0, maxX: 800, minY: 0, maxY: 600, width: 800, height: 600 }
      }
    }
    const result = layoutEngine.generateLayout(people, relationships)
    console.log('Layout generated:', result.nodes.length, 'nodes,', result.marriages.length, 'marriages')
    return result
  }, [people, relationships, layoutEngine, autoLayout])

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

  // Render person card
  const renderPersonCard = (node: LayoutNode) => {
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
        {/* Card background - perfect generational alignment */}
        <rect
          width={PERSON_WIDTH}
          height={PERSON_HEIGHT}
          rx="12"
          fill="white"
          stroke={hoveredPerson === person.id ? branchColor : '#E5E7EB'}
          strokeWidth={hoveredPerson === person.id ? 3 : 1}
          className="drop-shadow-md transition-all duration-200"
        />
        
        {/* Branch color indicator */}
        <rect
          width={PERSON_WIDTH}
          height="4"
          rx="2"
          fill={branchColor}
          opacity="0.8"
        />
        
        {/* Avatar with branch color border */}
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
            <circle
              cx={PERSON_WIDTH / 2}
              cy={PERSON_HEIGHT + 15}
              r="12"
              fill={branchColor}
              className="cursor-pointer transition-all duration-200"
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

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button 
          variant={autoLayout ? "default" : "outline"} 
          size="sm" 
          onClick={() => setAutoLayout(!autoLayout)}
          className="flex items-center gap-2"
        >
          {autoLayout ? <Grid className="w-4 h-4" /> : <Shuffle className="w-4 h-4" />}
          {autoLayout ? 'Auto-Layout' : 'Manual'}
        </Button>
        
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
        className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`${dimensions.minX} ${dimensions.minY} ${dimensions.width} ${dimensions.height}`}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          <defs>
            <pattern id="generational-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#F1F5F9" strokeWidth="1" opacity="0.3"/>
            </pattern>
            <linearGradient id="generationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F8FAFC" stopOpacity="0.5"/>
              <stop offset="100%" stopColor="#E2E8F0" stopOpacity="0.2"/>
            </linearGradient>
          </defs>
          
          <rect 
            x={dimensions.minX} 
            y={dimensions.minY} 
            width={dimensions.width} 
            height={dimensions.height} 
            fill="url(#generational-grid)" 
          />
          
          {/* Generation background stripes for visual clarity */}
          {autoLayout && Array.from(new Set(nodes.map(n => n.depth))).sort().map(gen => (
            <rect
              key={`generation-bg-${gen}`}
              x={dimensions.minX}
              y={gen * 200 - 10}
              width={dimensions.width}
              height={PERSON_HEIGHT + 20}
              fill="url(#generationGradient)"
              opacity={gen % 2 === 0 ? 0.4 : 0.2}
              rx="4"
            />
          ))}
          
          {/* Generation labels */}
          {autoLayout && Array.from(new Set(nodes.map(n => n.depth))).sort().map(gen => (
            <text
              key={`generation-label-${gen}`}
              x={dimensions.minX + 20}
              y={gen * 200 + 20}
              className="fill-gray-400 text-xs font-medium"
              fontSize="11"
            >
              Generation {gen + 1}
            </text>
          ))}
          
          {/* Connection lines */}
          <ConnectionRenderer 
            nodes={nodes}
            marriages={marriages}
            personWidth={PERSON_WIDTH}
            personHeight={PERSON_HEIGHT}
          />
          
          {/* Person cards */}
          {nodes.map(renderPersonCard)}
        </svg>
      </div>

      {/* Status indicators */}
      {autoLayout ? (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-green-200">
          <div className="flex items-center gap-2 text-green-700 mb-2">
            <Grid className="w-4 h-4" />
            <span className="font-semibold text-sm">Auto-Layout Active</span>
          </div>
          <div className="text-gray-600 space-y-1 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Perfect generational rows</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Spouses side-by-side</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Children centered under parents</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-orange-200">
          <div className="flex items-center gap-2 text-orange-700 mb-2">
            <Shuffle className="w-4 h-4" />
            <span className="font-semibold text-sm">Manual Mode</span>
          </div>
          <div className="text-gray-600 text-xs">
            <span>Drag people to position them manually</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-200">
        <h4 className="font-semibold text-sm mb-3 text-gray-800">Family Tree Legend</h4>
        
        {/* Connection types */}
        <div className="space-y-2 mb-4">
          <h5 className="font-medium text-xs text-gray-600 mb-1">Connection Types</h5>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-0 border-t-4 border-blue-500"></div>
            <span>Marriage/Partnership</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-0 border-t-2 border-gray-400"></div>
            <span>Parent-Child</span>
          </div>
        </div>
        
        {/* Family branches */}
        {nodes.length > 0 && (
          <div className="space-y-2">
            <h5 className="font-medium text-xs text-gray-600 mb-1">Family Branches</h5>
            {Array.from(new Set(nodes.map(n => n.branchColor))).slice(0, 4).map((color, index) => (
              <div key={color} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-4 h-4 rounded-full border-2" 
                  style={{ backgroundColor: color, borderColor: color }}
                ></div>
                <span>Branch {index + 1}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}