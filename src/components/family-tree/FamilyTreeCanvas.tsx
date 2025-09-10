import React from 'react'
import type { Person, Relationship } from '@/lib/familyTreeTypes'

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

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Debug Panel */}
      <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-40 max-w-sm">
        <h3 className="font-bold mb-2">Family Tree Debug</h3>
        <p>Total People: {people.length}</p>
        <p>Total Relationships: {relationships.length}</p>
        <div className="mt-2 space-y-1">
          {people.map((person, idx) => (
            <div key={person.id} className="text-xs p-1 bg-gray-50 rounded">
              {idx + 1}. {person.full_name}
            </div>
          ))}
        </div>
      </div>

      {/* Simple Family Display */}
      <div className="p-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Your Family Tree
        </h1>
        
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {people.map((person, index) => (
              <div
                key={person.id}
                className="bg-white rounded-xl shadow-lg p-6 border hover:shadow-xl transition-all duration-200 cursor-pointer"
                onClick={() => onPersonSelect(person.id)}
              >
                {/* Avatar */}
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {person.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                  </div>
                </div>
                
                {/* Info */}
                <div className="text-center">
                  <h3 className="font-bold text-lg mb-2">{person.full_name}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    {person.gender && <p>Gender: {person.gender}</p>}
                    {person.birth_year && <p>Born: {person.birth_year}</p>}
                    <p className="text-xs text-gray-400">ID: ...{person.id.slice(-8)}</p>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="mt-4 flex justify-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewProfile(person.id)
                    }}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs hover:bg-blue-200 transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditPerson(person.id)
                    }}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-xs hover:bg-gray-200 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Add Person Button */}
          <div className="text-center mt-8">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Add New Family Member
            </button>
          </div>
          
          {/* Status */}
          <div className="text-center mt-6 p-4 bg-white/50 rounded-lg">
            <p className="text-gray-600">
              Showing {people.length} family members • {relationships.length} relationships
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Drag-and-drop editor is being rebuilt for better performance
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}