import React from 'react'
import { TreePerson } from '../../lib/familyTreeV2Types'

// Card dimensions and layout constants (matching Ancestry.com style)
export const CARD_W = 156
export const CARD_H = 208
export const CARD_R = 12
export const TILE_W = 56
export const TILE_H = 76
export const TILE_R = 8
export const TILE_X = 10
export const TILE_Y = 10

// Layout constants - row spacing and gaps
export const ROW_HEIGHT = 220   // Total row height including spacing
export const SIB_GAP = 48       // Gap between siblings
export const SPOUSE_GAP = 16    // Gap between spouses

// Media preview dimensions
export const PREVIEW_W = 32
export const PREVIEW_H = 32
export const MEDIA_GAP = 6

// Connector geometry constants
export const PORT_INSET = 8     // Distance from card edge to connector port
export const STEM_LEN = 10      // Length of vertical stems into union bar
export const CORNER_RAD = 12    // Radius for rounded connector elbows

// Typography and positioning
export const NAME_Y = 30
export const DATES_Y = 50
const font = 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial'

// Helper functions
function year(iso?: string | null): string {
  return iso ? iso.slice(0, 4) : ''
}

function getInitials(name: string): string {
  const words = name.split(' ').filter(w => w.length > 0)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return words[0] ? words[0][0].toUpperCase() : '?'
}

interface PersonCardProps {
  person: TreePerson
  x: number
  y: number
  onClick?: (person: TreePerson) => void
  onAddClick?: (person: TreePerson, type: 'parent' | 'partner' | 'child') => void
}

const PersonCard: React.FC<PersonCardProps> = ({ person, x, y, onClick, onAddClick }) => {
  const birthYear = year(person.birth_date)
  const deathYear = year(person.death_date)
  const isLiving = person.is_living !== false && !deathYear
  
  const dates = deathYear 
    ? `${birthYear}–${deathYear}`
    : birthYear 
      ? `${birthYear}–Living`
      : 'Living'
  
  const fullName = `${person.given_name || ''} ${person.surname || ''}`.trim() || 'Unknown'
  const initials = getInitials(fullName)
  
  // Gender-based tile color (Ancestry style)
  const genderFill = person.sex === 'M' ? '#8DA9C4' : 
                    person.sex === 'F' ? '#E6B0A0' : 
                    '#C3C7CF'

  return (
    <g transform={`translate(${Math.round(x)}, ${Math.round(y)})`}>
      {/* Card background with shadow */}
      <rect 
        width={CARD_W} 
        height={CARD_H} 
        rx={CARD_R} 
        fill="#FFFFFF"
        stroke="#D9D9DF"
        strokeWidth="1"
        filter="url(#feCardShadow)"
        style={{ cursor: onClick ? 'pointer' : 'default' }}
        onClick={() => onClick?.(person)}
      />
      
      {/* Left gender tile */}
      <rect 
        x={TILE_X} 
        y={TILE_Y} 
        width={TILE_W} 
        height={TILE_H} 
        rx={TILE_R}
        fill={genderFill}
      />
      
      {/* Person silhouette icon (white) */}
      <g transform={`translate(${TILE_X + 14}, ${TILE_Y + 12})`}>
        <path
          d="M14 7A7 7 0 1 0 0 7a7 7 0 0 0 14 0zM2.5 21.5C2.5 16.8 6.3 13 11 13h2c4.7 0 8.5 3.8 8.5 8.5V23H2.5v-1.5z"
          fill="white"
          opacity="0.95"
          transform="scale(0.65)"
        />
      </g>
      
      {/* Avatar image (if available) */}
      {person.avatar_url && (
        <image
          x={TILE_X + 4}
          y={TILE_Y + 4}
          width={TILE_W - 8}
          height={TILE_H - 8}
          href={person.avatar_url}
          clipPath="url(#avatarClip)"
          preserveAspectRatio="xMidYMid slice"
        />
      )}
      
      {/* Name */}
      <text 
        x={TILE_X + TILE_W + 10} 
        y={NAME_Y}
        style={{
          fontFamily: font,
          fontSize: '13px',
          fontWeight: 600,
          fill: '#1F2328'
        }}
      >
        {fullName}
      </text>
      
      {/* Birth/Death dates */}
      <text 
        x={TILE_X + TILE_W + 10} 
        y={DATES_Y}
        style={{
          fontFamily: font,
          fontSize: '12px',
          fill: '#6B7280'
        }}
      >
        {dates}
      </text>
      
      {/* Initials overlay (fallback when no avatar) */}
      {!person.avatar_url && (
        <text 
          x={TILE_X + TILE_W / 2} 
          y={TILE_Y + TILE_H / 2 + 5}
          textAnchor="middle"
          style={{
            fontFamily: font,
            fontSize: '18px',
            fontWeight: 700,
            fill: 'white'
          }}
        >
          {initials}
        </text>
      )}
      
      {/* SVG Definitions for clipping */}
      <defs>
        <clipPath id="avatarClip">
          <rect x={TILE_X + 4} y={TILE_Y + 4} width={TILE_W - 8} height={TILE_H - 8} rx={TILE_R - 4} />
        </clipPath>
        <filter id="feCardShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="black" floodOpacity="0.20" />
        </filter>
      </defs>
    </g>
  )
}

export default PersonCard
export { PersonCard }