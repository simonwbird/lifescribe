import React, { useRef, useCallback, useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import EnhancedPersonCard from './EnhancedPersonCard'
import ConnectionLine from './ConnectionLine'
import FamilyConnections from './FamilyConnections'
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
  onDeleteRelation: (relationshipId: string) => void
  onViewProfile: (personId: string) => void
  onEditPerson: (personId: string) => void
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
  positions,
  selectedPersonId,
  shouldFitToScreen,
  onFitToScreenComplete
}: FamilyTreeCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1.0) // Default to 100% zoom
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState<string | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isConnecting, setIsConnecting] = useState<{
    fromPersonId: string
    connectionType: 'parent' | 'child' | 'spouse'
    mousePos: { x: number; y: number }
  } | null>(null)
  const [hoveredPersonId, setHoveredPersonId] = useState<string | null>(null)
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

  // Handle connection dragging
  const handleConnectionStart = useCallback((personId: string, connectionType: 'parent' | 'child' | 'spouse', mousePos: { x: number; y: number }) => {
    console.log('Canvas received connection start:', personId, connectionType)
    setIsConnecting({ fromPersonId: personId, connectionType, mousePos })
  }, [])

  const handleConnectionDrag = useCallback((mousePos: { x: number; y: number }) => {
    if (isConnecting) {
      setIsConnecting(prev => prev ? { ...prev, mousePos } : null)
    }
  }, [isConnecting])

  const handleConnectionEnd = useCallback((targetPersonId?: string) => {
    console.log('Connection end:', isConnecting, targetPersonId)
    if (isConnecting && targetPersonId && targetPersonId !== isConnecting.fromPersonId) {
      // Auto-determine relationship type based on connection type
      let relType: 'parent' | 'spouse' = 'parent'
      if (isConnecting.connectionType === 'spouse') {
        relType = 'spouse'
      } else if (isConnecting.connectionType === 'parent') {
        relType = 'parent' // from child to parent
      } else if (isConnecting.connectionType === 'child') {
        relType = 'parent' // from parent to child
      }
      
      console.log('Creating connection:', isConnecting.fromPersonId, '->', targetPersonId, 'as', relType)
      onAddRelation(isConnecting.fromPersonId, targetPersonId, relType)
      
      // Auto-align and position spouses
      if (relType === 'spouse') {
        const fromPos = positions[isConnecting.fromPersonId]
        const toPos = positions[targetPersonId]
        
        if (fromPos && toPos) {
          // Align both to the same Y level (use the average)
          const alignedY = Math.round((fromPos.y + toPos.y) / 2 / 50) * 50 // Snap to 50px grid
          
          // Position them closer together horizontally
          const centerX = (fromPos.x + toPos.x) / 2
          const spouseDistance = 300 // Distance between spouses
          
          const leftX = Math.round((centerX - spouseDistance / 2) / 50) * 50 // Snap to grid
          const rightX = Math.round((centerX + spouseDistance / 2) / 50) * 50 // Snap to grid
          
          // Position the person who initiated the connection on the left
          onPersonMove(isConnecting.fromPersonId, leftX, alignedY)
          onPersonMove(targetPersonId, rightX, alignedY)
          
          setHasUnsavedChanges(true)
        }
      }
    }
    setIsConnecting(null)
    setHoveredPersonId(null)
  }, [isConnecting, onAddRelation, positions, onPersonMove])

  const handleCanvasMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    } else if (isConnecting) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const x = (e.clientX - rect.left - pan.x) / zoom
        const y = (e.clientY - rect.top - pan.y) / zoom
        handleConnectionDrag({ x, y })

        // Check if we're near any person cards for auto-connect
        let nearestPerson = null
        let minDistance = Infinity
        const snapDistance = 250 // Increased snap distance for easier connection

        people.forEach(person => {
          if (person.id === isConnecting.fromPersonId) return
          
          const personPos = positions[person.id]
          if (!personPos) return
          
          // Updated card dimensions to match actual EnhancedPersonCard (256x160 approx)
          const cardCenterX = personPos.x + 132 // card width/2 (264/2)
          const cardCenterY = personPos.y + 100  // card height/2 (approx 200/2)
          
          const distance = Math.sqrt(
            Math.pow(x - cardCenterX, 2) + Math.pow(y - cardCenterY, 2)
          )
          
          if (distance < snapDistance && distance < minDistance) {
            minDistance = distance
            nearestPerson = person.id
          }
        })
        
        setHoveredPersonId(nearestPerson)
      }
    }
  }, [isPanning, panStart, isConnecting, pan.x, pan.y, zoom, handleConnectionDrag, people, positions])

  const handleCanvasMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false)
    } else if (isConnecting) {
      // Auto-connect to hovered person if nearby
      handleConnectionEnd(hoveredPersonId)
    }
  }, [isPanning, isConnecting, handleConnectionEnd, hoveredPersonId])

  // Handle person dragging
  const handlePersonDrag = useCallback((personId: string, deltaX: number, deltaY: number) => {
    const currentPos = positions[personId] || { x: 0, y: 0 }
    const newX = currentPos.x + deltaX / zoom
    const newY = currentPos.y + deltaY / zoom
    onPersonMove(personId, newX, newY)
    setHasUnsavedChanges(true)
  }, [positions, zoom, onPersonMove])

  const [dragStartPos, setDragStartPos] = useState<Record<string, { x: number; y: number; startX: number; startY: number }>>({})

  const handlePersonDragStart = useCallback((personId: string) => {
    const currentPos = positions[personId] || { x: 0, y: 0 }
    setDragStartPos(prev => ({
      ...prev,
      [personId]: { 
        x: currentPos.x, 
        y: currentPos.y,
        startX: currentPos.x,
        startY: currentPos.y
      }
    }))
    setIsDragging(personId)
  }, [positions])

  const handlePersonDragUpdate = useCallback((personId: string, deltaX: number, deltaY: number) => {
    const startPos = dragStartPos[personId]
    if (!startPos) return
    
    const newX = startPos.startX + deltaX / zoom
    const newY = startPos.startY + deltaY / zoom
    
    onPersonMove(personId, newX, newY)
    setHasUnsavedChanges(true)
  }, [dragStartPos, zoom, onPersonMove])

  const handlePersonDragEnd = useCallback(() => {
    setIsDragging(null)
  }, [])

  // Auto-arrange functions
  const handleAutoArrange = useCallback(() => {
    // Create generations based on relationships
    const generations = new Map<number, Person[]>()
    const personLevels = new Map<string, number>()
    const spouseGroups = new Map<string, string[]>() // Groups of spouses
    
    // Find all spouse relationships and group them
    const spouseRelationships = relationships.filter(rel => rel.relationship_type === 'spouse')
    const processedSpouses = new Set<string>()
    
    spouseRelationships.forEach(rel => {
      if (!processedSpouses.has(rel.from_person_id) && !processedSpouses.has(rel.to_person_id)) {
        const groupId = `spouse_group_${rel.from_person_id}`
        spouseGroups.set(groupId, [rel.from_person_id, rel.to_person_id])
        processedSpouses.add(rel.from_person_id)
        processedSpouses.add(rel.to_person_id)
      }
    })
    
    // Start with people who have no parents (roots)
    const rootPeople = people.filter(person => 
      !relationships.some(rel => 
        rel.relationship_type === 'parent' && rel.to_person_id === person.id
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
      
      // Also assign the same level to all spouses
      spouseGroups.forEach(spouseGroup => {
        if (spouseGroup.includes(person.id)) {
          spouseGroup.forEach(spouseId => {
            if (!visited.has(spouseId) && spouseId !== person.id) {
              visited.add(spouseId)
              personLevels.set(spouseId, level)
              const spousePerson = people.find(p => p.id === spouseId)
              if (spousePerson) {
                generations.get(level)!.push(spousePerson)
              }
            }
          })
        }
      })
      
      // Add children to next level
      const children = relationships
        .filter(rel => rel.relationship_type === 'parent' && rel.from_person_id === person.id)
        .map(rel => people.find(p => p.id === rel.to_person_id))
        .filter(Boolean) as Person[]
      
      children.forEach(child => {
        if (!visited.has(child.id)) {
          queue.push({ person: child, level: level + 1 })
        }
      })
    }
    
    // Position people by generation, keeping spouses close together
    Array.from(generations.entries()).forEach(([level, levelPeople]) => {
      // Group spouses together in positioning
      const positionedPeople: Person[] = []
      const processedInLevel = new Set<string>()
      
      levelPeople.forEach(person => {
        if (processedInLevel.has(person.id)) return
        
        // Check if this person has spouses in the same level
        const personSpouses = spouseGroups.get(Array.from(spouseGroups.keys()).find(key => 
          spouseGroups.get(key)?.includes(person.id)
        ) || '') || []
        
        const spousesInLevel = personSpouses.filter(spouseId => 
          levelPeople.some(p => p.id === spouseId)
        ).map(spouseId => levelPeople.find(p => p.id === spouseId)).filter(Boolean) as Person[]
        
        if (spousesInLevel.length > 1) {
          // Add all spouses as a group
          spousesInLevel.forEach(spouse => {
            positionedPeople.push(spouse)
            processedInLevel.add(spouse.id)
          })
        } else {
          // Add single person
          positionedPeople.push(person)
          processedInLevel.add(person.id)
        }
      })
      
      // Position the people/groups
      positionedPeople.forEach((person, index) => {
        const x = (index - (positionedPeople.length - 1) / 2) * 350 + CANVAS_SIZE / 2
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

  // Handle adding relation from hotspots (keep for backward compatibility)
  const handleAddRelationFromCard = useCallback((personId: string, type: 'parent' | 'child' | 'spouse') => {
    const person = people.find(p => p.id === personId)
    if (!person) return
    
    setRelationshipModal({
      isOpen: true,
      fromPerson: person,
      suggestedType: type
    })
  }, [people])

  const handleTopLeftView = useCallback(() => {
    if (people.length === 0) return

    const personPositions = Object.values(positions)
    if (personPositions.length === 0) return

    const minX = Math.min(...personPositions.map(p => p.x))
    const minY = Math.min(...personPositions.map(p => p.y))

    // Position the tree in the top-left with some padding
    const padding = 50
    setPan({
      x: padding - minX * zoom,
      y: padding - minY * zoom
    })
  }, [positions, people.length, zoom])

  // Auto-position to top-left when people first load (only once)
  const hasInitialized = useRef(false)
  useEffect(() => {
    if (people.length > 0 && Object.keys(positions).length > 0 && !hasInitialized.current) {
      hasInitialized.current = true
      setTimeout(() => {
        handleTopLeftView()
      }, 100)
    }
  }, [people.length, positions, handleTopLeftView])

  // Handle shouldFitToScreen trigger from parent
  useEffect(() => {
    if (shouldFitToScreen && onFitToScreenComplete) {
      handleFitToScreen()
      onFitToScreenComplete()
    }
  }, [shouldFitToScreen, onFitToScreenComplete, handleFitToScreen])

  // Setup event listeners
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    
    if (isPanning || isConnecting) {
      document.addEventListener('mousemove', handleCanvasMouseMove)
      document.addEventListener('mouseup', handleCanvasMouseUp)
    }

    return () => {
      canvas.removeEventListener('wheel', handleWheel)
      document.removeEventListener('mousemove', handleCanvasMouseMove)
      document.removeEventListener('mouseup', handleCanvasMouseUp)
    }
  }, [handleWheel, handleCanvasMouseMove, handleCanvasMouseUp, isPanning, isConnecting])

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
        <FamilyConnections
          people={people}
          relationships={relationships}
          positions={positions}
          selectedPersonId={selectedPersonId}
          onDeleteRelation={onDeleteRelation}
        />

        {/* Dynamic Connection Line (while dragging) */}
        {isConnecting && (
          <svg
            className="absolute top-0 left-0 pointer-events-none z-20"
            style={{
              width: CANVAS_SIZE,
              height: CANVAS_SIZE,
            }}
          >
            {/* Preview line with 90-degree angles */}
            <path
              d={`M ${positions[isConnecting.fromPersonId]?.x + 128 || 0} ${positions[isConnecting.fromPersonId]?.y + 64 || 0} 
                  L ${positions[isConnecting.fromPersonId]?.x + 128 || 0} ${((positions[isConnecting.fromPersonId]?.y + 64 || 0) + (hoveredPersonId ? (positions[hoveredPersonId]?.y + 64 || isConnecting.mousePos.y) : isConnecting.mousePos.y)) / 2} 
                  L ${hoveredPersonId ? (positions[hoveredPersonId]?.x + 128 || isConnecting.mousePos.x) : isConnecting.mousePos.x} ${((positions[isConnecting.fromPersonId]?.y + 64 || 0) + (hoveredPersonId ? (positions[hoveredPersonId]?.y + 64 || isConnecting.mousePos.y) : isConnecting.mousePos.y)) / 2}
                  L ${hoveredPersonId ? (positions[hoveredPersonId]?.x + 128 || isConnecting.mousePos.x) : isConnecting.mousePos.x} ${hoveredPersonId ? (positions[hoveredPersonId]?.y + 64 || isConnecting.mousePos.y) : isConnecting.mousePos.y}`}
              stroke={hoveredPersonId ? '#10b981' : (isConnecting.connectionType === 'spouse' ? '#ec4899' : '#3b82f6')}
              strokeWidth={hoveredPersonId ? "4" : "3"}
              strokeDasharray={isConnecting.connectionType === 'spouse' ? '8 4' : 'none'}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={hoveredPersonId ? 'animate-pulse' : ''}
            />
            
            {/* Connection preview circle at target */}
            {hoveredPersonId && (
              <circle
                cx={positions[hoveredPersonId]?.x + 128 || 0}
                cy={positions[hoveredPersonId]?.y + 64 || 0}
                r="20"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                className="animate-ping"
              />
            )}
          </svg>
        )}

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
              isHovered={hoveredPersonId === person.id}
              spouseCount={stats.spouseCount}
              childrenCount={stats.childrenCount}
              onDrag={(deltaX, deltaY) => handlePersonDragUpdate(person.id, deltaX, deltaY)}
              onDragStart={() => handlePersonDragStart(person.id)}
              onDragEnd={handlePersonDragEnd}
              onSelect={() => onPersonSelect(person.id)}
              onViewProfile={() => onViewProfile(person.id)}
              onEditPerson={() => onEditPerson(person.id)}
              onAddRelation={(type) => handleAddRelationFromCard(person.id, type)}
              onConnectionStart={(connectionType, mousePos) => handleConnectionStart(person.id, connectionType, mousePos)}
              onConnectionEnd={() => handleConnectionEnd(person.id)}
              onHover={(isHovered) => setHoveredPersonId(isHovered ? person.id : null)}
              showConnectionHotspots={selectedPersonId === person.id}
            />
          )
        })}
      </div>

      {/* Zoom Controls - fixed to bottom right of viewport */}
      <div className="fixed bottom-4 right-4 z-50">
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

      {/* Legend - moved to top-right and fixed to viewport */}
      <div className="fixed top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 text-sm shadow-lg border border-gray-200/50 z-30">
        <div className="font-semibold mb-2 text-gray-700">Connection Types</div>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <svg width="32" height="16" className="mr-2">
                <path 
                  d="M 0 8 L 0 4 L 24 4 L 24 8" 
                  stroke="#6b7280" 
                  strokeWidth="2" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  markerEnd="url(#legend-arrow)" 
                />
                <defs>
                  <marker
                    id="legend-arrow"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="3"
                    markerWidth="4"
                    markerHeight="4"
                    orient="auto"
                  >
                    <path d="M0,0 L0,6 L9,3 z" fill="#6b7280" />
                  </marker>
                </defs>
              </svg>
            </div>
            <span className="text-xs text-gray-600">Parent-Child (L-shaped)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <svg width="32" height="16" className="mr-2">
                <path 
                  d="M 0 8 L 0 4 L 24 4 L 24 8" 
                  stroke="#f59e0b" 
                  strokeWidth="2" 
                  strokeDasharray="4 2"
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-xs text-gray-600">Married/Partner (L-shaped)</span>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
          Hover over lines to delete • Drag from colored hotspots to connect
        </div>
      </div>

      {/* Canvas Info - moved to top-left to avoid overlap with legend */}
      <div className="fixed top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 text-sm text-gray-700 shadow-lg border border-gray-200/50 z-30">
        <div className="space-y-1">
          <div className="font-semibold">Family Tree</div>
          <div>Zoom: {Math.round(zoom * 100)}%</div>
          <div>{people.length} people, {relationships.length} connections</div>
          <div className="text-xs text-gray-500 mt-2">
            {isPanning ? 'Panning...' : 
             isDragging ? `Moving ${getPersonDisplayName(people.find(p => p.id === isDragging)!)}` : 
             isConnecting ? 'Drag to connect people...' :
             'Drag cards to move • Drag from hotspots to connect • Mouse wheel to zoom'}
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