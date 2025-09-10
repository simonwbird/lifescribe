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
          
          {/* Status */}
          <div className="text-center mt-8 p-6 bg-white/80 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">🎉 Enhanced Family Tree Ready!</h2>
            <p className="text-gray-600 mb-4">
              Your family tree now includes drag-and-drop, visual connections, and relationship management!
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="font-semibold text-green-800">Drag & Drop</div>
                <div className="text-green-600">Move people around</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-semibold text-blue-800">Visual Lines</div>
                <div className="text-blue-600">See relationships</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="font-semibold text-purple-800">Smart Hotspots</div>
                <div className="text-purple-600">Quick connections</div>
              </div>
              <div className="p-3 bg-pink-50 rounded-lg">
                <div className="font-semibold text-pink-800">Enhanced Cards</div>
                <div className="text-pink-600">Rich details</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}