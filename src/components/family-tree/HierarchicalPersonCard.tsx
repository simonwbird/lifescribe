import React from 'react'
import { MoreHorizontal, Mic, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Person } from '@/lib/familyTreeTypes'

interface HierarchicalPersonCardProps {
  person: Person
  x: number
  y: number
  width: number
  height: number
  onPersonClick?: (personId: string) => void
  onPersonEdit?: (personId: string) => void
  onRecordMemoryAbout?: (personId: string, personName: string) => void
  isDragging?: boolean
  isHovered?: boolean
}

export default function HierarchicalPersonCard({
  person,
  x,
  y,
  width,
  height,
  onPersonClick,
  onPersonEdit,
  onRecordMemoryAbout,
  isDragging,
  isHovered
}: HierarchicalPersonCardProps) {
  const displayName = person.full_name || `${person.given_name || ''} ${person.surname || ''}`.trim()
  const birthYear = person.birth_year || (person.birth_date ? new Date(person.birth_date).getFullYear() : null)
  const deathYear = person.death_year || (person.death_date ? new Date(person.death_date).getFullYear() : null)
  const years = deathYear ? `${birthYear || '?'} - ${deathYear}` : (birthYear ? `${birthYear} - Living` : 'Living')

  // Determine card background color based on gender
  const getCardColor = () => {
    if (person.gender === 'male') return '#93C5FD' // Light blue
    if (person.gender === 'female') return '#FCA5A5' // Light pink/salmon
    return '#D1D5DB' // Light gray for unknown
  }

  const cardColor = getCardColor()

  return (
    <g
      transform={`translate(${x - width/2}, ${y})`}
      className={`cursor-pointer transition-all duration-200 ${isDragging ? 'opacity-75' : ''}`}
    >
      {/* Card background with rounded corners */}
      <rect
        width={width}
        height={height}
        rx="8"
        ry="8"
        fill={cardColor}
        stroke={isHovered ? '#374151' : '#9CA3AF'}
        strokeWidth={isHovered ? 2 : 1}
        className="drop-shadow-lg"
      />
      
      {/* Profile photo circle */}
      <circle
        cx={width / 2}
        cy={35}
        r="25"
        fill="white"
        stroke="#6B7280"
        strokeWidth="2"
      />
      
      {/* Profile image or initials */}
      {person.avatar_url ? (
        <image
          href={person.avatar_url}
          x={width / 2 - 25}
          y={10}
          width="50"
          height="50"
          clipPath={`circle(25px at ${width / 2}px 35px)`}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <text
          x={width / 2}
          y={40}
          textAnchor="middle"
          className="fill-gray-600 text-sm font-bold"
          fontSize="14"
        >
          {displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
        </text>
      )}
      
      {/* Name */}
      <text
        x={width / 2}
        y={75}
        textAnchor="middle"
        className="fill-gray-900 font-semibold"
        fontSize="12"
      >
        {displayName.length > 14 ? displayName.substring(0, 14) + '...' : displayName}
      </text>
      
      {/* Years */}
      <text
        x={width / 2}
        y={90}
        textAnchor="middle"
        className="fill-gray-700 text-xs"
        fontSize="10"
      >
        {years}
      </text>

      {/* Action dropdown - only visible on hover */}
      {isHovered && (
        <foreignObject x={width - 25} y={5} width="20" height="20">
          <div className="pointer-events-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost" 
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-gray-200/50 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="bg-white border border-gray-200 shadow-lg z-[100] min-w-[180px]"
                sideOffset={5}
              >
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    onRecordMemoryAbout?.(person.id, displayName)
                  }}
                  className="hover:bg-gray-100 cursor-pointer"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Record about {displayName.split(' ')[0]}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    onPersonEdit?.(person.id)
                  }}
                  className="hover:bg-gray-100 cursor-pointer"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </foreignObject>
      )}

      {/* Clickable overlay */}
      <rect
        width={width}
        height={height}
        rx="8"
        ry="8"
        fill="transparent"
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          onPersonClick?.(person.id)
        }}
      />
    </g>
  )
}