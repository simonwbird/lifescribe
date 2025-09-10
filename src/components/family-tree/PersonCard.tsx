import React, { useState, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Plus, 
  Heart, 
  Eye, 
  Edit, 
  Calendar,
  PenTool,
  GripVertical
} from 'lucide-react'
import { getPersonDisplayName, formatPersonYears } from '@/utils/familyTreeUtils'
import type { Person } from '@/lib/familyTreeTypes'

interface PersonCardProps {
  person: Person
  x: number
  y: number
  isDragging?: boolean
  isSelected?: boolean
  onDrag: (deltaX: number, deltaY: number) => void
  onDragStart: () => void
  onDragEnd: () => void
  onSelect: () => void
  onViewProfile: () => void
  onEditPerson: () => void
  onAddRelation: (type: 'parent' | 'child' | 'spouse') => void
  onConnectionStart?: (personId: string, hotspot: 'top' | 'bottom' | 'left' | 'right') => void
  children?: React.ReactNode
  spouses?: Person[]
  childrenCount?: number
}

export default function PersonCard({
  person,
  x,
  y,
  isDragging = false,
  isSelected = false,
  onDrag,
  onDragStart,
  onDragEnd,
  onSelect,
  onViewProfile,
  onEditPerson,
  onAddRelation,
  onConnectionStart,
  spouses = [],
  childrenCount = 0
}: PersonCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 })
  const [showHotspots, setShowHotspots] = useState(false)
  
  const displayName = getPersonDisplayName(person)
  const years = formatPersonYears(person)
  
  const GRID_SIZE = 40

  const snapToGrid = (value: number) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) {
      return
    }
    
    e.preventDefault()
    e.stopPropagation()
    
    onSelect()
    onDragStart()
    
    setDragStartPos({
      x: e.clientX,
      y: e.clientY
    })

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = snapToGrid(moveEvent.clientX - dragStartPos.x)
      const deltaY = snapToGrid(moveEvent.clientY - dragStartPos.y)
      
      if (Math.abs(deltaX) >= GRID_SIZE || Math.abs(deltaY) >= GRID_SIZE) {
        onDrag(deltaX, deltaY)
        setDragStartPos({
          x: moveEvent.clientX,
          y: moveEvent.clientY
        })
      }
    }

    const handleMouseUp = () => {
      onDragEnd()
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [dragStartPos, onDrag, onDragStart, onDragEnd, onSelect])

  const handleHotspotClick = (e: React.MouseEvent, hotspot: 'top' | 'bottom' | 'left' | 'right') => {
    e.stopPropagation()
    if (onConnectionStart) {
      onConnectionStart(person.id, hotspot)
    } else {
      // Fallback to direct relation adding
      const relationMap = {
        top: 'parent' as const,
        bottom: 'child' as const,
        left: 'spouse' as const,
        right: 'spouse' as const
      }
      onAddRelation(relationMap[hotspot])
    }
  }

  return (
    <div 
      ref={cardRef}
      className={`absolute cursor-grab active:cursor-grabbing transition-all duration-200 ${
        isDragging ? 'scale-105 z-50 shadow-2xl' : 'z-10'
      } ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
      style={{
        transform: `translate(${x}px, ${y}px)`,
        transition: isDragging ? 'none' : 'transform 0.2s ease-out, scale 0.2s ease-out'
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setShowHotspots(true)}
      onMouseLeave={() => setShowHotspots(false)}
    >
      {/* Connection Hotspots */}
      {(showHotspots || isDragging) && (
        <>
          {/* Top hotspot - for parents */}
          <div 
            className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all hover:scale-110 z-20 no-drag"
            onClick={(e) => handleHotspotClick(e, 'top')}
            title="Add Parent"
          >
            <Plus className="w-3 h-3 text-white" />
          </div>
          
          {/* Bottom hotspot - for children */}
          <div 
            className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all hover:scale-110 z-20 no-drag"
            onClick={(e) => handleHotspotClick(e, 'bottom')}
            title="Add Child"
          >
            <Plus className="w-3 h-3 text-white" />
          </div>
          
          {/* Left hotspot - for spouse */}
          <div 
            className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-pink-500 hover:bg-pink-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all hover:scale-110 z-20 no-drag"
            onClick={(e) => handleHotspotClick(e, 'left')}
            title="Add Spouse/Partner"
          >
            <Heart className="w-3 h-3 text-white" />
          </div>
          
          {/* Right hotspot - for connections */}
          <div 
            className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all hover:scale-110 z-20 no-drag"
            onClick={(e) => handleHotspotClick(e, 'right')}
            title="Connect to Family Member"
          >
            <Plus className="w-3 h-3 text-white" />
          </div>
        </>
      )}

      {/* Drag Handle */}
      <div className="absolute -top-2 -right-2 w-5 h-5 bg-gray-500 hover:bg-gray-600 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors z-20">
        <GripVertical className="w-2 h-2 text-white" />
      </div>

      {/* Main Card */}
      <Card className={`w-52 hover:shadow-lg transition-all duration-200 bg-white/95 backdrop-blur-sm ${
        isDragging ? 'shadow-2xl ring-2 ring-primary' : ''
      } ${isSelected ? 'ring-1 ring-primary/50' : ''}`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header with Avatar and Actions */}
            <div className="flex items-start space-x-3">
              <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                <AvatarImage src={person.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold">
                  {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="font-semibold text-base leading-tight text-gray-900 truncate">
                  {displayName}
                </h3>
                {years && (
                  <p className="text-sm text-gray-600 leading-tight">{years}</p>
                )}
              </div>
              
              <div className="flex flex-col space-y-1 no-drag">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewProfile()
                  }}
                  title="View Profile"
                >
                  <Eye className="h-3.5 w-3.5 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-gray-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditPerson()
                  }}
                  title="Edit Details"
                >
                  <Edit className="h-3.5 w-3.5 text-gray-600" />
                </Button>
              </div>
            </div>

            {/* Stats and Badges */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {childrenCount > 0 && (
                  <Badge variant="secondary" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200">
                    {childrenCount} {childrenCount === 1 ? 'child' : 'children'}
                  </Badge>
                )}
                {spouses.length > 0 && (
                  <Badge variant="outline" className="text-xs px-2 py-1 border-pink-200 text-pink-700 bg-pink-50">
                    <Heart className="w-3 h-3 mr-1" />
                    {spouses.length === 1 ? 'married' : `${spouses.length} spouses`}
                  </Badge>
                )}
              </div>
              
              <div className="flex space-x-1 no-drag">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs hover:bg-green-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    // Navigate to add story about this person
                  }}
                  title="Add Story"
                >
                  <PenTool className="w-3 h-3 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs hover:bg-purple-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    // Navigate to timeline
                  }}
                  title="Timeline"
                >
                  <Calendar className="w-3 h-3 text-purple-600" />
                </Button>
              </div>
            </div>

            {/* Additional Info */}
            {person.gender && (
              <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                {person.gender}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}