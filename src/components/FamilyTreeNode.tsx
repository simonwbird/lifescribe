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
  Calendar
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
}

export default function FamilyTreeNode({
  node,
  onViewPerson,
  onAddParent,
  onAddChild,
  onAddSpouse,
  onEditPerson,
  onPositionChange
}: FamilyTreeNodeProps) {
  const navigate = useNavigate()
  const { person, children, spouses } = node
  const displayName = getPersonDisplayName(person)
  const years = formatPersonYears(person)
  
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
      } ${isDragging ? 'opacity-90' : ''} transition-all duration-200`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging ? 'none' : 'transform 0.2s ease'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Main Person Card */}
      <Card className={`w-48 hover:shadow-lg transition-all duration-200 ${
        isDragging ? 'shadow-xl ring-2 ring-primary' : ''
      }`}>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 dropdown-trigger">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
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
        </CardContent>
      </Card>

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
            />
          ))}
        </div>
      )}
    </div>
  )
}