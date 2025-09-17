import React from 'react'
import { cn } from '@/lib/utils'
import type { Person } from '@/lib/familyTreeTypes'

interface PersonCardProps {
  person: Person
  x: number
  y: number
  selected?: boolean
  onDragStart?: (e: React.MouseEvent, personId: string) => void
  onClick?: (personId: string) => void
}

export function PersonCard({
  person,
  x,
  y,
  selected = false,
  onDragStart,
  onClick
}: PersonCardProps) {
  const displayName = person.full_name || `${person.given_name || ''} ${person.surname || ''}`.trim()
  const birthYear = person.birth_year || (person.birth_date ? new Date(person.birth_date).getFullYear() : null)
  const deathYear = person.death_year || (person.death_date ? new Date(person.death_date).getFullYear() : null)
  
  const lifespan = person.is_living !== false && !deathYear 
    ? birthYear ? `${birthYear}–Living` : 'Living'
    : `${birthYear || '?'}–${deathYear || '?'}`

  const isDeceased = person.is_living === false || !!deathYear

  return (
    <div
      className="absolute cursor-pointer"
      style={{
        left: x - 75, // Center the 150px card
        top: y - 90,  // Center the 180px card
        width: '150px',
        height: '180px',
      }}
    >
      <article
        role="button"
        aria-label={`${displayName} ${lifespan}`}
        className={cn(
          "w-full h-full rounded-xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-all duration-200",
          "cursor-grab active:cursor-grabbing",
          selected && "ring-2 ring-sky-400 ring-opacity-75"
        )}
        onMouseDown={(e) => onDragStart?.(e, person.id)}
        onClick={(e) => {
          e.stopPropagation()
          onClick?.(person.id)
        }}
      >
        <div className="p-3 flex flex-col items-center gap-2 h-full">
          {/* Avatar area */}
          <div className="w-20 h-20 rounded-md bg-neutral-100 overflow-hidden flex-shrink-0 border border-neutral-200">
            {person.avatar_url ? (
              <img
                src={person.avatar_url}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            )}
          </div>
          
          {/* Name */}
          <h3 className={cn(
            "text-[15px] font-semibold text-center leading-tight line-clamp-2 flex-1 flex items-center justify-center",
            isDeceased ? "text-neutral-600" : "text-neutral-800"
          )}>
            {displayName}
          </h3>
          
          {/* Life span */}
          <div className="text-xs text-neutral-500 flex-shrink-0">
            {lifespan}
          </div>
        </div>
      </article>
    </div>
  )
}