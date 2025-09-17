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

  const photoWidth = width - 16
  const photoHeight = 50

  return (
    <g
      transform={`translate(${x - width/2}, ${y})`}
      className={`cursor-pointer transition-all duration-200 ${isDragging ? 'opacity-75' : ''}`}
    >
      {/* Card background - clean white */}
      <rect
        width={width}
        height={height}
        rx="12"
        ry="12"
        fill="white"
        stroke={isHovered ? '#6B7280' : '#E5E7EB'}
        strokeWidth={isHovered ? 2 : 1}
        className="drop-shadow-lg"
      />
      
      {/* Photo background area */}
      <rect
        x={8}
        y={8}
        width={photoWidth}
        height={photoHeight}
        rx="8"
        ry="8"
        fill="#F3F4F6"
        stroke="#E5E7EB"
        strokeWidth="1"
      />
      
      {/* Profile image or initials background */}
      {person.avatar_url ? (
        <g>
          <defs>
            <clipPath id={`photo-clip-${person.id}`}>
              <rect
                x={8}
                y={8}
                width={photoWidth}
                height={photoHeight}
                rx="8"
                ry="8"
              />
            </clipPath>
          </defs>
          <image
            href={person.avatar_url}
            x={8}
            y={8}
            width={photoWidth}
            height={photoHeight}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#photo-clip-${person.id})`}
          />
        </g>
      ) : (
        <text
          x={width / 2}
          y={35}
          textAnchor="middle"
          className="fill-gray-500 font-bold"
          fontSize="16"
        >
          {displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
        </text>
      )}
      
      {/* Name */}
      <text
        x={width / 2}
        y={78}
        textAnchor="middle"
        className="fill-gray-900 font-semibold"
        fontSize="13"
      >
        {displayName.length > 16 ? displayName.substring(0, 16) + '...' : displayName}
      </text>
      
      {/* Years in lighter color */}
      <text
        x={width / 2}
        y={94}
        textAnchor="middle"
        className="fill-gray-500"
        fontSize="11"
      >
        {years}
      </text>

      {/* Connection buttons around the card */}
      {isHovered && (
        <>
          {/* Top connection button */}
          <circle
            cx={width / 2}
            cy={-8}
            r="8"
            fill="white"
            stroke="#9CA3AF"
            strokeWidth="2"
            className="cursor-pointer hover:fill-gray-100"
          />
          <text
            x={width / 2}
            y={-4}
            textAnchor="middle"
            className="fill-gray-600 text-xs font-bold pointer-events-none"
            fontSize="12"
          >
            +
          </text>
          
          {/* Right connection button */}
          <circle
            cx={width + 8}
            cy={height / 2}
            r="8"
            fill="white"
            stroke="#9CA3AF"
            strokeWidth="2"
            className="cursor-pointer hover:fill-gray-100"
          />
          <text
            x={width + 8}
            y={height / 2 + 4}
            textAnchor="middle"
            className="fill-gray-600 text-xs font-bold pointer-events-none"
            fontSize="12"
          >
            +
          </text>
          
          {/* Bottom connection button */}
          <circle
            cx={width / 2}
            cy={height + 8}
            r="8"
            fill="white"
            stroke="#9CA3AF"
            strokeWidth="2"
            className="cursor-pointer hover:fill-gray-100"
          />
          <text
            x={width / 2}
            y={height + 12}
            textAnchor="middle"
            className="fill-gray-600 text-xs font-bold pointer-events-none"
            fontSize="12"
          >
            +
          </text>
          
          {/* Left connection button */}
          <circle
            cx={-8}
            cy={height / 2}
            r="8"
            fill="white"
            stroke="#9CA3AF"
            strokeWidth="2"
            className="cursor-pointer hover:fill-gray-100"
          />
          <text
            x={-8}
            y={height / 2 + 4}
            textAnchor="middle"
            className="fill-gray-600 text-xs font-bold pointer-events-none"
            fontSize="12"
          >
            +
          </text>
        </>
      )}

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
        rx="12"
        ry="12"
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