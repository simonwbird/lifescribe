import React from 'react'

// Ancestry-style card dimensions and connector geometry
export const CARD_W = 156;
export const CARD_H = 208;  
export const CARD_R = 12;

// Gender tile (left side)
export const TILE_X = 10;
export const TILE_Y = 10;
export const TILE_W = 56;
export const TILE_H = 76;
export const TILE_R = 8;

// Text positioning
export const NAME_X = TILE_X + TILE_W + 10;
export const NAME_Y = 30;
export const DATES_Y = 50;

// Optional media preview
export const MEDIA_W = 52;
export const MEDIA_H = 66;
export const MEDIA_X = NAME_X;
export const MEDIA_Y = 64;
export const MEDIA_R = 8;

// Layout spacing (Ancestry-style)
export const ROW_HEIGHT = 220;      // vertical distance between generational rows
export const SIB_GAP = 48;          // horizontal gap between siblings
export const SPOUSE_GAP = 16;       // empty space between spouse card edges

// Connector geometry
export const PORT_INSET = 8;        // pull connectors slightly off the card edge
export const STEM_LEN = 10;         // short vertical stems into the marriage bar
export const CORNER_RAD = 12;       // rounded elbows radius for orthogonal paths
export const STROKE_W = 2;          // connector thickness

const year = (iso?: string) => iso ? iso.slice(0,4) : '';

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export interface PersonCardProps {
  x: number; 
  y: number;
  person: { 
    id: string; 
    full_name: string; 
    birth_date?: string; 
    death_date?: string; 
    gender?: 'male'|'female'|'other'|'unknown'; 
    avatar_url?: string|null; 
  };
  onClick?: () => void;
  onQuickAdd?: (type: 'partner' | 'child' | 'parent') => void;
}

export const PersonCard: React.FC<PersonCardProps> = ({ 
  x, 
  y, 
  person, 
  onClick, 
  onQuickAdd 
}) => {
  const birthYear = year(person.birth_date);
  const deathYear = year(person.death_date);
  
  // Ancestry-style date formatting
  const dates = deathYear 
    ? `${birthYear}–${deathYear}`
    : birthYear 
    ? `${birthYear}–Living`
    : 'Living';
    
  const initials = getInitials(person.full_name);
  
  // Gender color mapping
  const genderColor = person.gender === 'male' 
    ? 'var(--fe-male)' 
    : person.gender === 'female' 
    ? 'var(--fe-female)' 
    : 'var(--fe-unknown)';

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Card background */}
      <rect 
        width={CARD_W} 
        height={CARD_H} 
        rx={CARD_R}
        fill="var(--fe-card)" 
        stroke="var(--fe-card-border)"
        strokeWidth="1"
        filter="url(#feCardShadow)"
        className="cursor-pointer"
        onClick={onClick}
      />

      {/* Gender tile */}
      <rect
        x={TILE_X}
        y={TILE_Y} 
        width={TILE_W}
        height={TILE_H}
        rx={TILE_R}
        fill={genderColor}
      />

      {/* Initials badge in top-left corner */}
      <rect
        x={8}
        y={8}
        width={24}
        height={16}
        rx={6}
        fill="rgba(0,0,0,.06)"
      />
      <text 
        x={20} 
        y={19} 
        textAnchor="middle"
        style={{ font: '600 11px Inter, system-ui', fill: 'var(--fe-ink)' }}
      >
        {initials}
      </text>

      {/* White silhouette icon in gender tile center */}
      <circle
        cx={TILE_X + TILE_W/2}
        cy={TILE_Y + TILE_H/2 - 8}
        r={12}
        fill="white"
        opacity={0.8}
      />
      <rect
        x={TILE_X + TILE_W/2 - 8}
        y={TILE_Y + TILE_H/2 + 2}
        width={16}
        height={12}
        rx={2}
        fill="white"
        opacity={0.8}
      />

      {/* Optional media preview */}
      {person.avatar_url ? (
        <>
          <clipPath id={`clip-${person.id}`}>
            <rect x={MEDIA_X} y={MEDIA_Y} width={MEDIA_W} height={MEDIA_H} rx={MEDIA_R}/>
          </clipPath>
          <image 
            href={person.avatar_url} 
            x={MEDIA_X} 
            y={MEDIA_Y} 
            width={MEDIA_W} 
            height={MEDIA_H}
            clipPath={`url(#clip-${person.id})`}
            preserveAspectRatio="xMidYMid slice"
          />
        </>
      ) : null}

      {/* Name */}
      <text 
        x={NAME_X} 
        y={NAME_Y} 
        className="fe-name"
      >
        {person.full_name}
      </text>
      
      {/* Dates */}
      <text 
        x={NAME_X} 
        y={DATES_Y} 
        className="fe-dates"
      >
        {dates}
      </text>
    </g>
  );
};