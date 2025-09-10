import React, { useRef, useCallback, useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import EnhancedPersonCard from './EnhancedPersonCard'
import ConnectionLine from './ConnectionLine'
import ZoomControls from './ZoomControls'
import GridOverlay from './GridOverlay'
import RelationshipModal from './RelationshipModal'
import type { Person, Relationship } from '@/lib/familyTreeTypes'
import { getPersonDisplayName } from '@/utils/familyTreeUtils'

interface FamilyTreeCanvasProps {
  people: Person[]
  relationships: Relationship[]
  onPersonMove: (personId: string, x: number, y: number) => void
  onPersonSelect: (personId: string) => void
  onAddRelation: (fromPersonId: string, toPersonId: string, type: 'parent' | 'spouse') => void
  onViewProfile: (personId: string) => void
  onEditPerson: (personId: string) => void
  positions: Record<string, { x: number; y: number }>
  selectedPersonId?: string
}

export default function EnhancedFamilyTreeCanvas({
  people,
  relationships,
  onPersonMove,
  onPersonSelect,
  onAddRelation,
  onViewProfile,
  onEditPerson,
  positions,
  selectedPersonId
}: FamilyTreeCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState<string | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [relationshipModal, setRelationshipModal] = useState<{
    isOpen: boolean
    fromPerson: Person | null
    suggestedType?: 'parent' | 'child' | 'spouse'
  }>({
    isOpen: false,
    fromPerson: null
  })

  const CANVAS_SIZE = 4000
  const MIN_ZOOM = 0.2
  const MAX_ZOOM = 2.0

  // Handle zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(prev => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * delta)))
  }, [])

  // Handle canvas panning
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setIsPanning(true)
      setPanStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      })
      e.preventDefault()
    }
  }, [pan])

  const handleCanvasMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }
  }, [isPanning, panStart])

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Handle person dragging
  const handlePersonDrag = useCallback((personId: string, deltaX: number, deltaY: number) => {
    const currentPos = positions[personId] || { x: 0, y: 0 }
    const newX = currentPos.x + deltaX / zoom
    const newY = currentPos.y + deltaY / zoom
    onPersonMove(personId, newX, newY)
    setHasUnsavedChanges(true)
  }, [positions, zoom, onPersonMove])

  const handlePersonDragStart = useCallback((personId: string) => {
    setIsDragging(personId)
  }, [])

  const handlePersonDragEnd = useCallback(() => {
    setIsDragging(null)
  }, [])

  // Auto-arrange functions
  const handleAutoArrange = useCallback(() => {
    // Create generations based on relationships
    const generations = new Map<number, Person[]>()
    const personLevels = new Map<string, number>()
    
    // Start with people who have no parents (roots)
    const rootPeople = people.filter(person => 
      !relationships.some(rel => 
        rel.relationship_type === 'parent' && rel.from_person_id === person.id
      )
    )
    
    // Assign levels using BFS
    const queue = rootPeople.map(person => ({ person, level: 0 }))
    const visited = new Set<string>()
    
    while (queue.length > 0) {
      const { person, level } = queue.shift()!
      
      if (visited.has(person.id)) continue
      visited.add(person.id)
      
      personLevels.set(person.id, level)
      if (!generations.has(level)) {
        generations.set(level, [])
      }
      generations.get(level)!.push(person)
      
      // Add children to next level
      const children = relationships
        .filter(rel => rel.relationship_type === 'parent' && rel.to_person_id === person.id)
        .map(rel => people.find(p => p.id === rel.from_person_id))
        .filter(Boolean) as Person[]
      
      children.forEach(child => {
        if (!visited.has(child.id)) {
          queue.push({ person: child, level: level + 1 })
        }
      })
    }
    
    // Position people by generation
    Array.from(generations.entries()).forEach(([level, levelPeople]) => {
      levelPeople.forEach((person, index) => {
        const x = (index - (levelPeople.length - 1) / 2) * 350 + CANVAS_SIZE / 2
        const y = level * 250 + 200
        onPersonMove(person.id, x, y)
      })
    })
    
    setHasUnsavedChanges(true)
  }, [people, relationships, onPersonMove])

  const handleFitToScreen = useCallback(() => {
    if (people.length === 0) return

    const personPositions = Object.values(positions)
    if (personPositions.length === 0) return

    const minX = Math.min(...personPositions.map(p => p.x))
    const maxX = Math.max(...personPositions.map(p => p.x))
    const minY = Math.min(...personPositions.map(p => p.y))
    const maxY = Math.max(...personPositions.map(p => p.y))

    const contentWidth = maxX - minX + 400
    const contentHeight = maxY - minY + 300

    const canvasRect = canvasRef.current?.getBoundingClientRect()
    if (!canvasRect) return

    const scaleX = canvasRect.width / contentWidth
    const scaleY = canvasRect.height / contentHeight
    const newZoom = Math.min(scaleX, scaleY, MAX_ZOOM)

    setZoom(newZoom)
    setPan({
      x: canvasRect.width / 2 - (minX + maxX) / 2 * newZoom,
      y: canvasRect.height / 2 - (minY + maxY) / 2 * newZoom
    })
  }, [positions, people.length])

  const handleResetPositions = useCallback(() => {
    // Reset to a simple grid
    people.forEach((person, index) => {
      const x = (index % 4) * 300 + 200
      const y = Math.floor(index / 4) * 200 + 200
      onPersonMove(person.id, x, y)
    })
    setHasUnsavedChanges(true)
  }, [people, onPersonMove])

  const handleSaveLayout = useCallback(() => {
    // In a real app, this would save to backend
    localStorage.setItem('familyTree.positions', JSON.stringify(positions))
    setHasUnsavedChanges(false)
  }, [positions])

  // Get relationships for rendering connections
  const getPersonRelationships = useCallback((personId: string) => {
    return relationships.filter(rel => 
      rel.from_person_id === personId || rel.to_person_id === personId
    )
  }, [relationships])

  // Get spouse count and children count for each person
  const getPersonStats = useCallback((personId: string) => {
    const personRels = getPersonRelationships(personId)
    const spouseCount = personRels
      .filter(rel => rel.relationship_type === 'spouse')
      .length

    const childrenCount = personRels
      .filter(rel => rel.relationship_type === 'parent' && rel.to_person_id === personId)
      .length

    return { spouseCount, childrenCount }
  }, [getPersonRelationships])

  // Handle adding relation from hotspots
  const handleAddRelationFromCard = useCallback((personId: string, type: 'parent' | 'child' | 'spouse') => {
    const person = people.find(p => p.id === personId)
    if (!person) return
    
    setRelationshipModal({
      isOpen: true,
      fromPerson: person,
      suggestedType: type
    })
  }, [people])

  // Auto-center on people when they first load
  useEffect(() => {
    if (people.length > 0 && Object.keys(positions).length > 0) {
      setTimeout(() => {
        handleFitToScreen()
      }, 100)
    }
  }, [people.length, positions, handleFitToScreen])

  // Setup event listeners
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    
    if (isPanning) {
      document.addEventListener('mousemove', handleCanvasMouseMove)
      document.addEventListener('mouseup', handleCanvasMouseUp)
    }

    return () => {
      canvas.removeEventListener('wheel', handleWheel)
      document.removeEventListener('mousemove', handleCanvasMouseMove)
      document.removeEventListener('mouseup', handleCanvasMouseUp)
    }
  }, [handleWheel, handleCanvasMouseMove, handleCanvasMouseUp, isPanning])

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Canvas */}
      <div
        ref={canvasRef}
        className={`relative w-full h-full ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleCanvasMouseDown}
        style={{ 
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: CANVAS_SIZE,
          height: CANVAS_SIZE
        }}
      >
        {/* Grid Overlay */}
        {showGrid && <GridOverlay zoom={zoom} />}

        {/* Connection Lines */}
        {relationships.map(relationship => {
          const fromPos = positions[relationship.from_person_id]
          const toPos = positions[relationship.to_person_id]
          
          if (!fromPos || !toPos) return null

          return (
            <ConnectionLine
              key={relationship.id}
              from={fromPos}
              to={toPos}
              type={relationship.relationship_type as 'parent' | 'spouse' | 'child'}
              isHighlighted={
                selectedPersonId === relationship.from_person_id ||
                selectedPersonId === relationship.to_person_id
              }
            />
          )
        })}

        {/* Person Cards */}
        {people.map(person => {
          const position = positions[person.id] || { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 }
          const stats = getPersonStats(person.id)
          
          return (
            <EnhancedPersonCard
              key={person.id}
              person={person}
              x={position.x}
              y={position.y}
              isDragging={isDragging === person.id}
              isSelected={selectedPersonId === person.id}
              spouseCount={stats.spouseCount}
              childrenCount={stats.childrenCount}
              onDrag={(deltaX, deltaY) => handlePersonDrag(person.id, deltaX, deltaY)}
              onDragStart={() => handlePersonDragStart(person.id)}
              onDragEnd={handlePersonDragEnd}
              onSelect={() => onPersonSelect(person.id)}
              onViewProfile={() => onViewProfile(person.id)}
              onEditPerson={() => onEditPerson(person.id)}
              onAddRelation={(type) => handleAddRelationFromCard(person.id, type)}
              showConnectionHotspots={selectedPersonId === person.id}
            />
          )
        })}
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4">
        <ZoomControls
          zoom={zoom}
          onZoomIn={() => setZoom(prev => Math.min(MAX_ZOOM, prev * 1.2))}
          onZoomOut={() => setZoom(prev => Math.max(MIN_ZOOM, prev / 1.2))}
          onFitToScreen={handleFitToScreen}
          onAutoArrange={handleAutoArrange}
          onToggleGrid={() => setShowGrid(!showGrid)}
          onReset={handleResetPositions}
          showGrid={showGrid}
        />
      </div>

      {/* Canvas Info */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 text-sm text-gray-700 shadow-lg">
        <div className="space-y-1">
          <div className="font-semibold">Family Tree</div>
          <div>Zoom: {Math.round(zoom * 100)}%</div>
          <div>{people.length} people, {relationships.length} connections</div>
          <div className="text-xs text-gray-500 mt-2">
            {isPanning ? 'Panning...' : isDragging ? `Moving ${getPersonDisplayName(people.find(p => p.id === isDragging)!)}` : 'Drag cards to move • Mouse wheel to zoom'}
          </div>
          {hasUnsavedChanges && (
            <div className="text-xs text-blue-600 font-medium animate-pulse">
              ● Unsaved changes
            </div>
          )}
        </div>
      </div>

      {/* Relationship Modal */}
      <RelationshipModal
        isOpen={relationshipModal.isOpen}
        onClose={() => setRelationshipModal({ isOpen: false, fromPerson: null })}
        fromPerson={relationshipModal.fromPerson}
        toPerson={null}
        people={people}
        onCreateRelationship={onAddRelation}
        suggestedType={relationshipModal.suggestedType}
      />
    </div>
  )
}