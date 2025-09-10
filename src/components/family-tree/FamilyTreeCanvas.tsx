import React, { useRef, useCallback, useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import PersonCard from './PersonCard'
import ConnectionLine from './ConnectionLine'
import ZoomControls from './ZoomControls'
import GridOverlay from './GridOverlay'
import type { Person, Relationship } from '@/lib/familyTreeTypes'
import { getPersonDisplayName } from '@/utils/familyTreeUtils'

interface PersonPosition {
  id: string
  x: number
  y: number
}

interface FamilyTreeCanvasProps {
  people: Person[]
  relationships: Relationship[]
  onPersonMove: (personId: string, x: number, y: number) => void
  onPersonSelect: (personId: string) => void
  onAddRelation: (fromPersonId: string, toPersonId: string, type: 'parent' | 'child' | 'spouse') => void
  onViewProfile: (personId: string) => void
  onEditPerson: (personId: string) => void
  positions: Record<string, { x: number; y: number }>
  selectedPersonId?: string
}

export default function FamilyTreeCanvas({
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

  const CANVAS_SIZE = 4000 // Large canvas for big family trees
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
  }, [positions, zoom, onPersonMove])

  const handlePersonDragStart = useCallback((personId: string) => {
    setIsDragging(personId)
  }, [])

  const handlePersonDragEnd = useCallback(() => {
    setIsDragging(null)
  }, [])

  // Auto-arrange functions
  const handleAutoArrange = useCallback(() => {
    // Simple generational layout
    const generations = new Map<number, Person[]>()
    const personLevels = new Map<string, number>()
    
    // Calculate generations (simplified)
    people.forEach((person, index) => {
      const level = Math.floor(index / 3) // Simple grouping for demo
      if (!generations.has(level)) {
        generations.set(level, [])
      }
      generations.get(level)!.push(person)
      personLevels.set(person.id, level)
    })

    // Position people by generation
    Array.from(generations.entries()).forEach(([level, levelPeople]) => {
      levelPeople.forEach((person, index) => {
        const x = (index - levelPeople.length / 2) * 300 + CANVAS_SIZE / 2
        const y = level * 200 + 100
        onPersonMove(person.id, x, y)
      })
    })
  }, [people, onPersonMove])

  const handleFitToScreen = useCallback(() => {
    if (people.length === 0) return

    const personPositions = Object.values(positions)
    if (personPositions.length === 0) return

    const minX = Math.min(...personPositions.map(p => p.x))
    const maxX = Math.max(...personPositions.map(p => p.x))
    const minY = Math.min(...personPositions.map(p => p.y))
    const maxY = Math.max(...personPositions.map(p => p.y))

    const contentWidth = maxX - minX + 400 // Add padding
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

  // Get relationships for rendering connections
  const getPersonRelationships = useCallback((personId: string) => {
    return relationships.filter(rel => 
      rel.from_person_id === personId || rel.to_person_id === personId
    )
  }, [relationships])

  // Get spouse count and children count for each person
  const getPersonStats = useCallback((personId: string) => {
    const personRels = getPersonRelationships(personId)
    const spouses = personRels
      .filter(rel => rel.relationship_type === 'spouse')
      .map(rel => {
        const spouseId = rel.from_person_id === personId ? rel.to_person_id : rel.from_person_id
        return people.find(p => p.id === spouseId)
      })
      .filter(Boolean) as Person[]

    const childrenCount = personRels
      .filter(rel => rel.relationship_type === 'parent' && rel.from_person_id === personId)
      .length

    return { spouses, childrenCount }
  }, [people, getPersonRelationships])

  // Auto-center on people when they first load
  useEffect(() => {
    console.log('FamilyTreeCanvas: people.length =', people.length)
    console.log('FamilyTreeCanvas: positions keys =', Object.keys(positions))
    console.log('FamilyTreeCanvas: positions =', positions)
    
    if (people.length > 0 && Object.keys(positions).length > 0) {
      console.log('FamilyTreeCanvas: Auto-centering triggered')
      // Small delay to ensure canvas is rendered
      setTimeout(() => {
        handleFitToScreen()
      }, 100)
    } else if (people.length > 0 && Object.keys(positions).length === 0) {
      console.log('FamilyTreeCanvas: People exist but no positions - creating default positions')
      // Create default positions if none exist
      people.forEach((person, index) => {
        const x = (index % 4) * 300 + 200
        const y = Math.floor(index / 4) * 200 + 200
        onPersonMove(person.id, x, y)
      })
    }
  }, [people.length, positions, handleFitToScreen, people, onPersonMove])

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
    <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden">
      {/* Debug Panel */}
      <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-40 max-w-sm">
        <h3 className="font-bold mb-2">Debug Info:</h3>
        <p>People: {people.length}</p>
        <p>Positions: {Object.keys(positions).length}</p>
        <div className="mt-2 max-h-32 overflow-y-auto">
          <p className="text-sm font-semibold">People:</p>
          {people.map(person => (
            <div key={person.id} className="text-xs">
              {person.full_name}
            </div>
          ))}
        </div>
      </div>

      {/* Simple Family Tree Layout - No Complex Transforms */}
      <div className="absolute inset-0 p-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Your Family Tree</h2>
        
        {/* Simple Grid Layout for People */}
        <div className="grid grid-cols-4 gap-6 max-w-6xl mx-auto">
          {people.map((person, index) => (
            <div
              key={person.id}
              className="bg-white rounded-lg shadow-lg p-4 border-2 border-blue-200 hover:border-blue-400 transition-all hover:shadow-xl"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold">
                  {person.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                </div>
                <h3 className="font-semibold text-sm mb-1">{person.full_name}</h3>
                <p className="text-xs text-gray-600">Person #{index + 1}</p>
                <p className="text-xs text-gray-500">{person.gender || 'Unknown'}</p>
                {person.birth_year && (
                  <p className="text-xs text-gray-500">Born: {person.birth_year}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Instructions */}
        <div className="text-center mt-8">
          <p className="text-gray-600">Your {people.length} family members are displayed above</p>
          <p className="text-sm text-gray-500 mt-2">The drag-and-drop editor is being fixed - this is a simplified view for now</p>
        </div>
      </div>
    </div>
  )
}