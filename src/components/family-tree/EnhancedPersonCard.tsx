import React, { useState, useRef, useCallback, useEffect } from 'react'
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
  Users,
  GripVertical,
  MapPin,
  Trash2,
  Mic
} from 'lucide-react'
import { getPersonDisplayName, formatPersonYears } from '@/utils/familyTreeUtils'
import type { Person } from '@/lib/familyTreeTypes'
import { supabase } from '@/lib/supabase'

interface EnhancedPersonCardProps {
  person: Person
  x: number
  y: number
  isDragging?: boolean
  isSelected?: boolean
  isHovered?: boolean
  spouseCount?: number
  childrenCount?: number
  onDrag: (deltaX: number, deltaY: number) => void
  onDragStart: () => void
  onDragEnd: () => void
  onSelect: () => void
  onViewProfile: () => void
  onEditPerson: () => void
  onDeletePerson: () => void
  onAddRelation: (type: 'parent' | 'child' | 'spouse') => void
  onConnectionStart?: (connectionType: 'parent' | 'child' | 'spouse', mousePos: { x: number; y: number }) => void
  onConnectionEnd?: () => void
  onHover?: (isHovered: boolean) => void
  showConnectionHotspots?: boolean
  onRecordMemoryAbout?: () => void
}

export default function EnhancedPersonCard({
  person,
  x,
  y,
  isDragging = false,
  isSelected = false,
  isHovered = false,
  spouseCount = 0,
  childrenCount = 0,
  onDrag,
  onDragStart,
  onDragEnd,
  onSelect,
  onViewProfile,
  onEditPerson,
  onDeletePerson,
  onAddRelation,
  onConnectionStart,
  onConnectionEnd,
  onHover,
  showConnectionHotspots = false,
  onRecordMemoryAbout
}: EnhancedPersonCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [showHotspots, setShowHotspots] = useState(false)
  
  const displayName = getPersonDisplayName(person)
  const years = formatPersonYears(person)
  
  // Resolve and refresh signed avatar URLs (Supabase signed URLs expire)
  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState<string | undefined>(person.avatar_url || undefined)
  useEffect(() => {
    let isMounted = true
    async function refresh() {
      if (!person.avatar_url) { setResolvedAvatarUrl(undefined); return }
      let url = person.avatar_url as string
      const m = url.match(/object\/sign\/([^/]+)\/([^?]+)/)
      if (m) {
        const bucket = m[1]
        const objectPath = decodeURIComponent(m[2])
        const { data } = await supabase.storage.from(bucket).createSignedUrl(objectPath, 3600)
        if (data?.signedUrl) url = data.signedUrl
      }
      if (!isMounted) return
      setResolvedAvatarUrl(url)
    }
    refresh()
    return () => { isMounted = false }
  }, [person.avatar_url])
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) {
      return
    }

    e.preventDefault()
    e.stopPropagation()
    
    onSelect()
    onDragStart()
    
    const startX = e.clientX
    const startY = e.clientY
    let hasMoved = false

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY
      
      // Start dragging after minimal movement to distinguish from clicks
      if (!hasMoved && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
        hasMoved = true
      }
      
      if (hasMoved) {
        // Smooth continuous movement without grid snapping
        onDrag(deltaX, deltaY)
      }
    }

    const handleMouseUp = () => {
      onDragEnd()
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove, { passive: false })
    document.addEventListener('mouseup', handleMouseUp)
  }, [onDrag, onDragStart, onDragEnd, onSelect])

  const handleConnectionStart = (e: React.MouseEvent, connectionType: 'parent' | 'child' | 'spouse') => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Connection start:', connectionType, person.full_name)
    
    if (onConnectionStart) {
      const rect = cardRef.current?.getBoundingClientRect()
      if (rect) {
        onConnectionStart(connectionType, { 
          x: e.clientX - rect.left + rect.width / 2,
          y: e.clientY - rect.top + rect.height / 2
        })
      }
    }
  }

  const handleHotspotClick = (e: React.MouseEvent, type: 'parent' | 'child' | 'spouse') => {
    e.stopPropagation()
    onAddRelation(type)
  }

  return (
    <div 
      ref={cardRef}
      className={`absolute cursor-grab active:cursor-grabbing select-none ${
        isDragging ? 'scale-105 z-50 shadow-2xl rotate-1' : 'z-10'
      } ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
      style={{
        transform: `translate(${x}px, ${y}px)`,
        transition: isDragging ? 'none' : 'transform 0.2s ease-out, box-shadow 0.2s ease-out'
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => {
        setShowHotspots(true)
        onHover?.(true)
      }}
      onMouseLeave={() => {
        setShowHotspots(false)
        onHover?.(false)
      }}
    >
      {/* Connection Hotspots */}
      {(showHotspots || showConnectionHotspots) && (
        <>
          {/* Top hotspot - for parents */}
          <div 
            className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg transition-all hover:scale-110 z-30 no-drag border-2 border-white"
            onMouseDown={(e) => {
              console.log('Parent hotspot mousedown')
              handleConnectionStart(e, 'parent')
            }}
            onClick={(e) => handleHotspotClick(e, 'parent')}
            title="Drag to connect parent or click to add"
          >
            <Plus className="w-4 h-4 text-white" />
          </div>
          
          {/* Bottom hotspot - for children */}
          <div 
            className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg transition-all hover:scale-110 z-30 no-drag border-2 border-white"
            onMouseDown={(e) => {
              console.log('Child hotspot mousedown')
              handleConnectionStart(e, 'child')
            }}
            onClick={(e) => handleHotspotClick(e, 'child')}
            title="Drag to connect child or click to add"
          >
            <Plus className="w-4 h-4 text-white" />
          </div>
          
          {/* Left hotspot - for spouse */}
          <div 
            className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-pink-500 hover:bg-pink-600 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg transition-all hover:scale-110 z-30 no-drag border-2 border-white"
            onMouseDown={(e) => {
              console.log('Spouse hotspot mousedown')
              handleConnectionStart(e, 'spouse')
            }}
            onClick={(e) => handleHotspotClick(e, 'spouse')}
            title="Drag to connect spouse/partner or click to add"
          >
            <Heart className="w-4 h-4 text-white" />
          </div>
          
          {/* Right hotspot - for spouse */}
          <div 
            className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-pink-500 hover:bg-pink-600 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg transition-all hover:scale-110 z-30 no-drag border-2 border-white"
            onMouseDown={(e) => {
              console.log('Spouse hotspot mousedown')
              handleConnectionStart(e, 'spouse')
            }}
            onClick={(e) => handleHotspotClick(e, 'spouse')}
            title="Drag to connect spouse/partner or click to add"
          >
            <Heart className="w-4 h-4 text-white" />
          </div>
        </>
      )}

      {/* Drag Handle */}
      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors z-30 border-2 border-white shadow-lg">
        <GripVertical className="w-3 h-3 text-white" />
      </div>

      {/* Main Card */}
      <Card className={`w-64 hover:shadow-xl transition-all duration-300 bg-white/95 backdrop-blur-sm ${
        isDragging ? 'shadow-2xl ring-2 ring-blue-400' : 'shadow-lg'
      } ${isSelected ? 'ring-1 ring-blue-400/50' : ''} ${
        isHovered ? 'ring-4 ring-green-400 ring-opacity-60 shadow-2xl scale-105' : ''
      } border-2 border-gray-100`}>
        <CardContent className="p-5">
          <div className="space-y-4">
            {/* Header with Avatar and Info */}
            <div className="flex items-start space-x-4">
              <Avatar className="h-16 w-16 ring-3 ring-white shadow-lg">
                <AvatarImage src={resolvedAvatarUrl || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 text-white font-bold text-lg">
                  {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0 space-y-2">
                <h3 className="font-bold text-lg leading-tight text-gray-900 truncate">
                  {displayName}
                </h3>
                {years && (
                  <p className="text-sm text-gray-600 font-medium">{years}</p>
                )}
                {person.gender && (
                  <Badge variant="outline" className="text-xs">
                    {person.gender}
                  </Badge>
                )}
              </div>
            </div>

            {/* Stats and Info */}
            <div className="space-y-3">
              {/* Family stats */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {childrenCount > 0 && (
                    <Badge variant="secondary" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200">
                      <Users className="w-3 h-3 mr-1" />
                      {childrenCount} {childrenCount === 1 ? 'child' : 'children'}
                    </Badge>
                  )}
                  {spouseCount > 0 && (
                    <Badge variant="outline" className="text-xs px-2 py-1 border-pink-200 text-pink-700 bg-pink-50">
                      <Heart className="w-3 h-3 mr-1" />
                      {spouseCount === 1 ? 'married' : `${spouseCount} spouses`}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Additional info */}
              {(person.birth_year || person.death_year) && (
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>
                      {person.birth_year && `Born ${person.birth_year}`}
                      {person.birth_year && person.death_year && ' • '}
                      {person.death_year && `Died ${person.death_year}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 no-drag gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs hover:bg-blue-50 text-blue-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewProfile()
                  }}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs hover:bg-gray-50 text-gray-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditPerson()
                  }}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs hover:bg-emerald-50 text-emerald-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRecordMemoryAbout?.()
                  }}
                  title={`Record about ${displayName.split(' ')[0]}`}
                >
                  <Mic className="h-3 w-3 mr-1" />
                  Record
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs hover:bg-red-50 text-red-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Are you sure you want to remove ${displayName} from the family tree? This will also delete all their relationships.`)) {
                      onDeletePerson()
                    }
                  }}
                  title="Remove from tree"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}