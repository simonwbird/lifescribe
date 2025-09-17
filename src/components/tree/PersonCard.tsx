import React, { memo } from 'react'
import { cn } from '@/lib/utils'
import type { Person } from '@/lib/familyTreeTypes'
import maleDefaultAvatar from '@/assets/avatar-male-default.png'
import femaleDefaultAvatar from '@/assets/avatar-female-default.png'

interface PersonCardProps {
  person: Person
  x: number
  y: number
  selected?: boolean
  isDragging?: boolean
  onDragStart?: (e: React.PointerEvent, personId: string) => void
  onClick?: (personId: string) => void
  onDoubleClick?: (personId: string) => void
}

function PersonCardBase({
  person,
  x,
  y,
  selected = false,
  isDragging = false,
  onDragStart,
  onClick,
  onDoubleClick
}: PersonCardProps) {
  const displayName = person.full_name || `${person.given_name || ''} ${person.surname || ''}`.trim()
  const birthYear = person.birth_year || (person.birth_date ? new Date(person.birth_date).getFullYear() : null)
  const deathYear = person.death_year || (person.death_date ? new Date(person.death_date).getFullYear() : null)
  
  const lifespan = person.is_living !== false && !deathYear 
    ? birthYear ? `${birthYear}–Living` : 'Living'
    : `${birthYear || '?'}–${deathYear || '?'}`

  const isDeceased = person.is_living === false || !!deathYear

  // Get default avatar based on gender
  const getDefaultAvatar = () => {
    if (person.gender?.toLowerCase() === 'female' || person.gender?.toLowerCase() === 'f') {
      return femaleDefaultAvatar
    }
    return maleDefaultAvatar // Default to male avatar for unknown/male genders
  }

  return (
    <div
      className="absolute"
      style={{
        left: 0,
        top: 0,
        width: '150px',
        height: '180px',
        transform: `translate3d(${x - 75}px, ${y - 90}px, 0)`,
        willChange: 'transform'
      }}
    >
      <article
        role="button"
        aria-label={`${displayName} ${lifespan}`}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className={cn(
          "w-full h-full rounded-xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-all duration-200",
          "cursor-grab active:cursor-grabbing select-none touch-none",
          selected && "ring-2 ring-sky-400 ring-opacity-75",
          isDragging && "cursor-grabbing shadow-lg"
         )}
        onPointerDown={(e) => {
          // Prevent drag on right click or if already dragging
          if (e.button !== 0 || isDragging) return
          onDragStart?.(e, person.id)
        }}
        onClick={(e) => {
          e.stopPropagation()
          // Only click if not dragging
          if (!isDragging) {
            onClick?.(person.id)
          }
        }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          // Only double-click if not dragging
          if (!isDragging) {
            onDoubleClick?.(person.id)
          }
        }}
      >
        <div className="p-2.5 flex flex-col items-center gap-1.5 h-full">
          {/* Avatar area */}
          <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-neutral-200">
            {person.avatar_url ? (
              <img
                src={person.avatar_url}
                alt={displayName}
                className="w-full h-full object-cover object-center"
                draggable={false}
              />
            ) : (
              <img
                src={getDefaultAvatar()}
                alt={`${displayName} avatar`}
                className="w-full h-full object-cover object-center"
                draggable={false}
              />
            )}
          </div>
          
          {/* Name */}
          <h3 className={cn(
            "text-sm font-semibold text-center leading-tight line-clamp-2 min-h-[2.5rem] flex items-center justify-center px-1",
            isDeceased ? "text-neutral-600" : "text-neutral-800"
          )}>
            {displayName}
          </h3>
          
          {/* Life span */}
          <div className="text-xs text-neutral-500 flex-shrink-0 font-medium">
            {lifespan}
          </div>
        </div>
      </article>
    </div>
  )
}

export const PersonCard = memo(PersonCardBase, (prev, next) => {
  return (
    prev.person.id === next.person.id &&
    prev.x === next.x &&
    prev.y === next.y &&
    prev.selected === next.selected &&
    prev.isDragging === next.isDragging
  )
})

export type { PersonCardProps }