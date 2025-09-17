import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, Home, RotateCcw, Grid, Users } from 'lucide-react'
import HierarchicalPersonCard from './HierarchicalPersonCard'
import HierarchicalConnectionRenderer from './HierarchicalConnectionRenderer'
import type { Person, Relationship } from '@/lib/familyTreeTypes'

interface FamilyTreeCanvasProps {
  people: Person[]
  relationships: Relationship[]
  onPersonMove: (personId: string, x: number, y: number) => void
  onPersonSelect: (personId: string) => void
  onAddRelation: (fromPersonId: string, toPersonId: string, type: 'parent' | 'spouse') => void
  onDeleteRelation: (relationshipId: string) => void
  onViewProfile: (personId: string) => void
  onEditPerson: (personId: string) => void
  onDeletePerson?: (personId: string) => void
  onUpdate?: () => void
  onRecordMemoryAbout?: (personId: string, personName: string) => void
  positions: Record<string, { x: number; y: number }>
  selectedPersonId?: string
  shouldFitToScreen?: boolean
  onFitToScreenComplete?: () => void
}

export default function EnhancedFamilyTreeCanvas({
  people,
  relationships,
  onPersonMove,
  onPersonSelect,
  onAddRelation,
  onDeleteRelation,
  onViewProfile,
  onEditPerson,
  onDeletePerson,
  onUpdate,
  onRecordMemoryAbout,
  positions,
  selectedPersonId,
  shouldFitToScreen,
  onFitToScreenComplete
}: FamilyTreeCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(0.8)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(false)
  const [hoveredPerson, setHoveredPerson] = useState<string | null>(null)
  const [draggingPerson, setDraggingPerson] = useState<string | null>(null)

  const CARD_WIDTH = 120
  const CARD_HEIGHT = 100
  const GENERATION_HEIGHT = 200

  // Organize people into generations for hierarchical layout
  const organizeByGenerations = useCallback(() => {
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

    // Find root people (those with no parents)
    const rootPeople = people.filter(person => !parentsMap.has(person.id))
    if (rootPeople.length === 0 && people.length > 0) {
      rootPeople.push(people[0]) // Fallback to first person if no clear root
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

    return Array.from(generations.entries()).sort(([a], [b]) => a - b)
  }, [people, relationships])

  // Calculate positions for hierarchical layout
  const calculateHierarchicalPositions = useCallback(() => {
    const generations = organizeByGenerations()
    const newPositions: Record<string, { x: number; y: number }> = {}

    generations.forEach(([generationIndex, genPeople]) => {
      const totalWidth = genPeople.length * (CARD_WIDTH + 50)
      let currentX = -totalWidth / 2

      genPeople.forEach((person, index) => {
        const x = currentX + index * (CARD_WIDTH + 50) + CARD_WIDTH / 2
        const y = generationIndex * GENERATION_HEIGHT + 100

        newPositions[person.id] = { x, y }
      })
    })

    return newPositions
  }, [organizeByGenerations])

  // Use hierarchical positions if not manually positioned
  const displayPositions = Object.keys(positions).length === 0 ? calculateHierarchicalPositions() : positions

  // Zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3))
  const handleResetZoom = () => {
    setZoom(0.8)
    setPan({ x: 0, y: 0 })
  }

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
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

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(prev => Math.max(0.3, Math.min(3, prev * delta)))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false })
      return () => canvas.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  return (
    <div className="relative w-full h-screen bg-gray-800 overflow-hidden">
      <div
        ref={canvasRef}
        className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
        {/* SVG for all connections and cards */}
        <svg
          className="absolute inset-0"
          style={{ 
            zIndex: 1,
            width: '100%',
            height: '100%'
          }}
        >
          {/* Grid pattern */}
          {showGrid && (
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="1" opacity="0.3"/>
              </pattern>
            </defs>
          )}
          {showGrid && (
            <rect width="100%" height="100%" fill="url(#grid)" />
          )}
          
          {/* Connection lines */}
          <HierarchicalConnectionRenderer
            people={people}
            relationships={relationships}
            positions={displayPositions}
            cardWidth={CARD_WIDTH}
            cardHeight={CARD_HEIGHT}
          />
          
          {/* Person cards */}
          {people.map((person) => {
            const position = displayPositions[person.id]
            if (!position) return null
            
            return (
              <g
                key={person.id}
                onMouseEnter={() => setHoveredPerson(person.id)}
                onMouseLeave={() => setHoveredPerson(null)}
              >
                <HierarchicalPersonCard
                  person={person}
                  x={position.x}
                  y={position.y}
                  width={CARD_WIDTH}
                  height={CARD_HEIGHT}
                  onPersonClick={onViewProfile}
                  onPersonEdit={onEditPerson}
                  onRecordMemoryAbout={onRecordMemoryAbout}
                  isDragging={draggingPerson === person.id}
                  isHovered={hoveredPerson === person.id}
                />
              </g>
            )
          })}
        </svg>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowGrid(!showGrid)}
          className={`${showGrid ? 'bg-gray-700 text-white border-gray-600' : 'bg-white/90 text-gray-800'}`}
        >
          <Grid className="w-4 h-4 mr-1" />
          Show Grid
        </Button>
        
        <div className="flex gap-1 bg-white/90 rounded-lg p-1">
          <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-8 w-8 p-0">
            <span className="text-lg font-bold">−</span>
          </Button>
          <div className="flex items-center px-2 text-sm font-medium min-w-[60px] justify-center">
            {Math.round(zoom * 100)}%
          </div>
          <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-8 w-8 p-0">
            <span className="text-lg font-bold">+</span>
          </Button>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleResetZoom}
          className="bg-white/90 text-gray-800"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Instructions panel */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border max-w-xs">
        <h4 className="font-semibold text-sm text-gray-800 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Interactive Family Tree
        </h4>
        <div className="space-y-2 text-xs text-gray-600">
          <div>• Drag any person to reposition them</div>
          <div>• Use zoom controls (+/-) to get closer or see more</div>
          <div>• Cards snap to an invisible grid (hold Shift or Alt to disable)</div>
          <div>• Connections update automatically</div>
          <div>• Click persons to view their profile</div>
        </div>
      </div>
    </div>
  )
}