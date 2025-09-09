import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Eye, 
  Plus, 
  UserPlus, 
  Heart,
  Edit,
  MoreVertical,
  PenTool,
  Calendar,
  Link2,
  Unlink,
  Minus
} from 'lucide-react'
import { TreeNode } from '@/lib/familyTreeTypes'
import { getPersonDisplayName, formatPersonYears } from '@/utils/familyTreeUtils'

interface FamilyTreeNodeProps {
  node: TreeNode
  onViewPerson: (personId: string) => void
  onAddParent: (personId: string) => void
  onAddChild: (personId: string) => void
  onAddSpouse: (personId: string) => void
  onEditPerson: (personId: string) => void
  onPositionChange?: (nodeId: string, x: number, y: number) => void
  onConnectPeople?: (fromPersonId: string, toPersonId: string, relationshipType: 'parent' | 'spouse') => void
  onRemoveRelationship?: (relationshipId: string) => void
  allPeople?: any[]
  relationships?: any[]
}

export default function FamilyTreeNode({
  node,
  onViewPerson,
  onAddParent,
  onAddChild,
  onAddSpouse,
  onEditPerson,
  onPositionChange,
  onConnectPeople,
  onRemoveRelationship,
  allPeople = [],
  relationships = []
}: FamilyTreeNodeProps) {
  const navigate = useNavigate()
  const { person, children, spouses } = node
  const displayName = getPersonDisplayName(person)
  const years = formatPersonYears(person)
  
  const [showConnectionPanel, setShowConnectionPanel] = useState(false)
  const [hoveredBorder, setHoveredBorder] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null)
  
  // Get existing relationships for this person
  const personRelationships = relationships.filter(rel => 
    rel.from_person_id === person.id || rel.to_person_id === person.id
  )
  
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState({ 
    x: node.x || 0, 
    y: node.y || 0 
  })

  const GRID_SIZE = 50 // Snap to 50px grid

  const snapToGrid = (value: number) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.dropdown-trigger')) {
      return // Don't drag if clicking dropdown
    }
    
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
    e.preventDefault()
    e.stopPropagation()
  }

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        const rawX = e.clientX - dragStart.x
        const rawY = e.clientY - dragStart.y
        const newX = snapToGrid(rawX)
        const newY = snapToGrid(rawY)
        
        setPosition({ x: newX, y: newY })
        
        if (onPositionChange) {
          onPositionChange(node.id, newX, newY)
        }
      }

      const handleGlobalMouseUp = () => {
        setIsDragging(false)
      }

      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove)
        document.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [isDragging, dragStart, onPositionChange, node.id])

  return (
    <div 
      className={`family-tree-node flex flex-col items-center space-y-2 absolute ${
        isDragging ? 'cursor-grabbing z-50 scale-105' : 'cursor-grab'
      } ${isDragging ? 'opacity-90' : ''} transition-all duration-200 group`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging ? 'none' : 'transform 0.2s ease'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Border hover zones */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top border */}
        <div 
          className="absolute top-0 left-1/4 right-1/4 h-3 -translate-y-1/2 pointer-events-auto z-20"
          onMouseEnter={() => setHoveredBorder('top')}
          onMouseLeave={() => setHoveredBorder(null)}
        >
          {hoveredBorder === 'top' && (
            <div className="flex items-center justify-center space-x-2 bg-primary/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg">
              <button 
                className="text-white hover:text-primary-foreground p-1 rounded-full hover:bg-white/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddParent(person.id)
                }}
                title="Add Parent"
              >
                <Plus className="h-3 w-3" />
              </button>
              {personRelationships.some(rel => rel.relationship_type === 'parent') && (
                <button 
                  className="text-white hover:text-primary-foreground p-1 rounded-full hover:bg-white/20 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    const parentRel = personRelationships.find(rel => rel.relationship_type === 'parent')
                    if (parentRel) onRemoveRelationship?.(parentRel.id)
                  }}
                  title="Remove Parent Connection"
                >
                  <Minus className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom border */}
        <div 
          className="absolute bottom-0 left-1/4 right-1/4 h-3 translate-y-1/2 pointer-events-auto z-20"
          onMouseEnter={() => setHoveredBorder('bottom')}
          onMouseLeave={() => setHoveredBorder(null)}
        >
          {hoveredBorder === 'bottom' && (
            <div className="flex items-center justify-center space-x-2 bg-primary/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg">
              <button 
                className="text-white hover:text-primary-foreground p-1 rounded-full hover:bg-white/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddChild(person.id)
                }}
                title="Add Child"
              >
                <Plus className="h-3 w-3" />
              </button>
              {children.length > 0 && (
                <button 
                  className="text-white hover:text-primary-foreground p-1 rounded-full hover:bg-white/20 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    const childRel = personRelationships.find(rel => 
                      rel.relationship_type === 'parent' && rel.to_person_id === person.id
                    )
                    if (childRel) onRemoveRelationship?.(childRel.id)
                  }}
                  title="Remove Child Connection"
                >
                  <Minus className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Left border */}
        <div 
          className="absolute left-0 top-1/4 bottom-1/4 w-3 -translate-x-1/2 pointer-events-auto z-20"
          onMouseEnter={() => setHoveredBorder('left')}
          onMouseLeave={() => setHoveredBorder(null)}
        >
          {hoveredBorder === 'left' && (
            <div className="flex flex-col items-center justify-center space-y-2 bg-primary/90 backdrop-blur-sm rounded-full px-1 py-3 shadow-lg">
              <button 
                className="text-white hover:text-primary-foreground p-1 rounded-full hover:bg-white/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddSpouse(person.id)
                }}
                title="Add Spouse"
              >
                <Plus className="h-3 w-3" />
              </button>
              {spouses.length > 0 && (
                <button 
                  className="text-white hover:text-primary-foreground p-1 rounded-full hover:bg-white/20 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    const spouseRel = personRelationships.find(rel => rel.relationship_type === 'spouse')
                    if (spouseRel) onRemoveRelationship?.(spouseRel.id)
                  }}
                  title="Remove Spouse Connection"
                >
                  <Minus className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right border */}
        <div 
          className="absolute right-0 top-1/4 bottom-1/4 w-3 translate-x-1/2 pointer-events-auto z-20"
          onMouseEnter={() => setHoveredBorder('right')}
          onMouseLeave={() => setHoveredBorder(null)}
        >
          {hoveredBorder === 'right' && (
            <div className="flex flex-col items-center justify-center space-y-2 bg-primary/90 backdrop-blur-sm rounded-full px-1 py-3 shadow-lg">
              <button 
                className="text-white hover:text-primary-foreground p-1 rounded-full hover:bg-white/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowConnectionPanel(!showConnectionPanel)
                }}
                title="Manage All Connections"
              >
                <Link2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Main Person Card */}
      <Card className={`w-48 hover:shadow-lg transition-all duration-200 relative z-10 ${
        isDragging ? 'shadow-xl ring-2 ring-primary' : ''
      } ${hoveredBorder ? 'ring-2 ring-primary/50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={person.avatar_url || undefined} />
              <AvatarFallback>{displayName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{displayName}</h3>
              {years && (
                <p className="text-xs text-muted-foreground">{years}</p>
              )}
              <div className="flex items-center space-x-1 mt-1">
                {children.length > 0 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {children.length} child{children.length !== 1 ? 'ren' : ''}
                  </Badge>
                )}
                {spouses.length > 0 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    <Heart className="w-3 h-3 mr-1" />
                    {spouses.length}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 dropdown-trigger">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background border shadow-lg z-50">
                  <DropdownMenuItem onClick={() => onViewPerson(person.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/people/${person.id}/timeline`)}>
                    <Calendar className="mr-2 h-4 w-4" />
                    View Timeline
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEditPerson(person.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/stories/new?person=${person.id}&personName=${encodeURIComponent(displayName)}`)}>
                    <PenTool className="mr-2 h-4 w-4" />
                    Add Story About {displayName}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onAddParent(person.id)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Parent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAddChild(person.id)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Child
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAddSpouse(person.id)}>
                    <Heart className="mr-2 h-4 w-4" />
                    Add Spouse
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Panel */}
      {showConnectionPanel && (
        <Card className="w-64 mt-2 z-50 bg-background border-2 border-primary shadow-xl backdrop-blur-sm">
          <CardContent className="p-3">
            <h4 className="font-medium text-sm mb-3 flex items-center">
              <Link2 className="h-4 w-4 mr-2" />
              Manage Connections
            </h4>
            
            {/* Add New Connection */}
            <div className="space-y-2 mb-4">
              <p className="text-xs text-muted-foreground">Connect to:</p>
              {allPeople
                .filter(p => p.id !== person.id && 
                  !relationships.some(rel => 
                    (rel.from_person_id === person.id && rel.to_person_id === p.id) ||
                    (rel.to_person_id === person.id && rel.from_person_id === p.id)
                  )
                )
                .slice(0, 3)
                .map(otherPerson => (
                  <div key={otherPerson.id} className="flex items-center justify-between text-xs">
                    <span className="truncate flex-1 mr-2">{getPersonDisplayName(otherPerson)}</span>
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => onConnectPeople?.(person.id, otherPerson.id, 'parent')}
                      >
                        Parent
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => onConnectPeople?.(person.id, otherPerson.id, 'spouse')}
                      >
                        Spouse
                      </Button>
                    </div>
                  </div>
                ))
              }
            </div>

            {/* Remove Existing Connections */}
            {personRelationships.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Remove connections:</p>
                {personRelationships.slice(0, 3).map(rel => {
                  const connectedPersonId = rel.from_person_id === person.id ? rel.to_person_id : rel.from_person_id
                  const connectedPerson = allPeople.find(p => p.id === connectedPersonId)
                  return (
                    <div key={rel.id} className="flex items-center justify-between text-xs">
                      <span className="truncate flex-1 mr-2">
                        {connectedPerson ? getPersonDisplayName(connectedPerson) : 'Unknown'} ({rel.relationship_type})
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => onRemoveRelationship?.(rel.id)}
                      >
                        <Unlink className="h-3 w-3" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-xs"
              onClick={() => setShowConnectionPanel(false)}
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Spouses */}
      {spouses.map((spouse) => (
        <Card key={spouse.id} className="w-48 ml-4 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={spouse.avatar_url || undefined} />
                <AvatarFallback>{getPersonDisplayName(spouse).split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{getPersonDisplayName(spouse)}</h4>
                <p className="text-xs text-muted-foreground">{formatPersonYears(spouse)}</p>
                <Badge variant="outline" className="text-xs px-1.5 py-0.5 mt-1">
                  <Heart className="w-3 h-3 mr-1" />
                  Spouse
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Children - positioned relatively for now */}
      {children.length > 0 && (
        <div className="flex space-x-8 mt-8 relative">
          {children.map((child) => (
            <FamilyTreeNode
              key={child.id}
              node={child}
              onViewPerson={onViewPerson}
              onAddParent={onAddParent}
              onAddChild={onAddChild}
              onAddSpouse={onAddSpouse}
              onEditPerson={onEditPerson}
              onPositionChange={onPositionChange}
              onConnectPeople={onConnectPeople}
              onRemoveRelationship={onRemoveRelationship}
              allPeople={allPeople}
              relationships={relationships}
            />
          ))}
        </div>
      )}
    </div>
  )
}