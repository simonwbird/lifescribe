import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Heart, Users, ArrowUp, ArrowDown } from 'lucide-react'
import type { Person } from '@/lib/familyTreeTypes'
import { getPersonDisplayName } from '@/utils/familyTreeUtils'

interface RelationshipModalProps {
  isOpen: boolean
  onClose: () => void
  fromPerson: Person | null
  toPerson: Person | null
  people: Person[]
  onCreateRelationship: (fromPersonId: string, toPersonId: string, type: 'parent' | 'spouse' | 'unmarried') => void
  suggestedType?: 'parent' | 'child' | 'spouse' | 'unmarried'
}

export default function RelationshipModal({
  isOpen,
  onClose,
  fromPerson,
  toPerson,
  people,
  onCreateRelationship,
  suggestedType
}: RelationshipModalProps) {
  const [selectedPersonId, setSelectedPersonId] = useState<string>('')
  const [relationshipType, setRelationshipType] = useState<'parent' | 'spouse' | 'unmarried'>(
    suggestedType === 'child' ? 'parent' : (suggestedType as 'parent' | 'spouse' | 'unmarried') || 'spouse'
  )

  const handleCreate = () => {
    if (!fromPerson || !selectedPersonId) return
    
    onCreateRelationship(fromPerson.id, selectedPersonId, relationshipType)
    onClose()
    setSelectedPersonId('')
  }

  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'parent':
        return <ArrowUp className="w-4 h-4" />
      case 'child':
        return <ArrowDown className="w-4 h-4" />
      case 'spouse':
        return <Heart className="w-4 h-4" />
      default:
        return <Users className="w-4 h-4" />
    }
  }

  const getRelationshipDescription = () => {
    if (!fromPerson) return ''
    
    const fromName = getPersonDisplayName(fromPerson)
    
    if (relationshipType === 'parent') {
      return `${fromName} will be added as a child`
    } else if (relationshipType === 'spouse') {
      return `${fromName} will be connected as spouse/partner`
    }
    return ''
  }

  // Filter out the from person and anyone already connected
  const availablePeople = people.filter(person => 
    person.id !== fromPerson?.id
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Create Family Connection
          </DialogTitle>
          <DialogDescription>
            Connect family members to build your family tree
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* From Person */}
          {fromPerson && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src={fromPerson.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold">
                  {getPersonDisplayName(fromPerson).split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{getPersonDisplayName(fromPerson)}</h3>
                <p className="text-sm text-gray-600">Starting person</p>
              </div>
            </div>
          )}

          {/* Relationship Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Relationship Type</label>
            <Select value={relationshipType} onValueChange={(value: 'parent' | 'spouse' | 'unmarried') => setRelationshipType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parent">
                  <div className="flex items-center gap-2">
                    <ArrowUp className="w-4 h-4" />
                    Parent/Child
                  </div>
                </SelectItem>
                <SelectItem value="spouse">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Married Couple
                  </div>
                </SelectItem>
                <SelectItem value="unmarried">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-gray-400" />
                    Unmarried Partners
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">{getRelationshipDescription()}</p>
          </div>

          {/* Person Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Connect to</label>
            <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a family member" />
              </SelectTrigger>
              <SelectContent>
                {availablePeople.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={person.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs">
                          {getPersonDisplayName(person).split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{getPersonDisplayName(person)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {selectedPersonId && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-center gap-3">
                <span className="text-sm font-medium">
                  {getPersonDisplayName(fromPerson!)}
                </span>
                <div className="flex items-center gap-1">
                  {getRelationshipIcon(relationshipType)}
                  <span className="text-xs text-gray-600">{relationshipType}</span>
                </div>
                <span className="text-sm font-medium">
                  {getPersonDisplayName(availablePeople.find(p => p.id === selectedPersonId)!)}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!selectedPersonId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Connection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}