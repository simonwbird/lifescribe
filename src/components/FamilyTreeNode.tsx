import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Eye, 
  Plus, 
  UserPlus, 
  Heart,
  Edit,
  MoreVertical
} from 'lucide-react'
import type { TreeNode } from '@/lib/familyTreeTypes'
import { formatPersonYears, getPersonDisplayName } from '@/utils/familyTreeUtils'

interface FamilyTreeNodeProps {
  node: TreeNode
  onViewPerson: (personId: string) => void
  onAddParent: (personId: string) => void
  onAddChild: (personId: string) => void
  onAddSpouse: (personId: string) => void
  onEditPerson: (personId: string) => void
}

export default function FamilyTreeNode({
  node,
  onViewPerson,
  onAddParent,
  onAddChild,
  onAddSpouse,
  onEditPerson
}: FamilyTreeNodeProps) {
  const { person, children, spouses } = node
  const displayName = getPersonDisplayName(person)
  const years = formatPersonYears(person)
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="family-tree-node flex flex-col items-center space-y-2">
      {/* Main person card */}
      <Card className="bg-white shadow-md border-2 hover:border-primary/50 transition-colors min-w-[200px] max-w-[250px]">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={person.avatar_url} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
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
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onViewPerson(person.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEditPerson(person.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddParent(person.id)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Parent
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddChild(person.id)}>
                  <Plus className="mr-2 h-4 w-4" />
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
      {spouses.length > 0 && (
        <div className="flex space-x-2">
          {spouses.map((spouse) => (
            <Card key={spouse.id} className="bg-rose-50 border-rose-200 shadow-sm">
              <CardContent className="p-2">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={spouse.avatar_url} alt={getPersonDisplayName(spouse)} />
                    <AvatarFallback className="bg-rose-100 text-rose-700 text-xs">
                      {getPersonDisplayName(spouse).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{getPersonDisplayName(spouse)}</p>
                    {formatPersonYears(spouse) && (
                      <p className="text-xs text-muted-foreground">{formatPersonYears(spouse)}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Connection line to children */}
      {children.length > 0 && (
        <div className="w-0.5 h-6 bg-border"></div>
      )}

      {/* Children */}
      {children.length > 0 && (
        <div className="flex space-x-8">
          {children.map((child) => (
            <div key={child.id} className="relative">
              {/* Connection line from parent */}
              {children.length > 1 && (
                <div className="absolute -top-6 left-1/2 w-0.5 h-6 bg-border -translate-x-0.5"></div>
              )}
              <FamilyTreeNode
                node={child}
                onViewPerson={onViewPerson}
                onAddParent={onAddParent}
                onAddChild={onAddChild}
                onAddSpouse={onAddSpouse}
                onEditPerson={onEditPerson}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}