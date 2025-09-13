import React from 'react'

export const CARD_W = 156;
export const CARD_H = 208;
export const CARD_R = 12;

export const TILE_X = 10;
export const TILE_Y = 10;
export const TILE_W = 56;
export const TILE_H = 76;
export const TILE_R = 8;

export const AVATAR_SIZE = 32;
export const AVATAR_X = CARD_W - 10 - AVATAR_SIZE;
export const AVATAR_Y = 10;

export const NAME_X = TILE_X + TILE_W + 10;
export const NAME_Y = 30;
export const DATES_Y = NAME_Y + 20;

/* Layout spacing */
export const H_SPACING = 48;        // siblings
export const ROW_HEIGHT = 220;      // generations
export const MARRIAGE_GAP = 16;     // space between spouses
export const COMPONENT_GAP = 220;   // between disconnected groups

const genderFill = (g?: string) =>
  g === 'male' ? 'var(--fe-male)'
: g === 'female' ? 'var(--fe-female)'
: 'var(--fe-unknown)';

const year = (iso?: string) => iso ? iso.slice(0,4) : '';

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
  const b = year(person.birth_date);
  const d = year(person.death_date);
  const dates = d ? `${b}–${d}` : (b ? `${b}–Living` : 'Living');

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Card */}
      <rect 
        width={CARD_W} 
        height={CARD_H} 
        rx={CARD_R}
        fill="var(--fe-card)" 
        stroke="var(--fe-card-border)"
        filter="url(#feCardShadow)"
        className="cursor-pointer hover:stroke-primary transition-colors"
        onClick={onClick}
      />

      {/* Left gender tile */}
      <rect 
        x={TILE_X} 
        y={TILE_Y} 
        width={TILE_W} 
        height={TILE_H} 
        rx={TILE_R}
        fill={genderFill(person.gender)}
      />

      {/* White silhouette */}
      <g transform={`translate(${TILE_X+6},${TILE_Y+6})`}>
        <path
          d="M30 18c0 5.5-4.5 10-10 10S10 23.5 10 18 14.5 8 20 8s10 4.5 10 10z M40 54c0-9-9-16-20-16S0 45 0 54v6h40v-6z"
          fill="#fff" 
          opacity=".95"
        />
      </g>

      {/* Round avatar (optional) */}
      {person.avatar_url && (
        <>
          <clipPath id={`clip-${person.id}`}>
            <circle cx={AVATAR_X + AVATAR_SIZE/2} cy={AVATAR_Y + AVATAR_SIZE/2} r={AVATAR_SIZE/2}/>
          </clipPath>
          <image 
            href={person.avatar_url} 
            x={AVATAR_X} 
            y={AVATAR_Y} 
            width={AVATAR_SIZE} 
            height={AVATAR_SIZE}
            clipPath={`url(#clip-${person.id})`}
          />
          <circle 
            cx={AVATAR_X + AVATAR_SIZE/2} 
            cy={AVATAR_Y + AVATAR_SIZE/2} 
            r={AVATAR_SIZE/2} 
            fill="none" 
            stroke="#fff" 
            strokeWidth="2"
          />
        </>
      )}

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

      {/* Quick add zones */}
      {onQuickAdd && (
        <>
          {/* Add partner */}
          <circle
            cx={CARD_W + 20}
            cy={CARD_H / 2}
            r={12}
            className="fill-primary/20 stroke-primary stroke-2 cursor-pointer hover:fill-primary/40 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              onQuickAdd('partner')
            }}
          />
          <text 
            x={CARD_W + 20} 
            y={CARD_H / 2 + 4} 
            textAnchor="middle" 
            className="fill-primary text-xs font-bold pointer-events-none"
          >
            +
          </text>

          {/* Add child */}
          <circle
            cx={CARD_W / 2}
            cy={CARD_H + 20}
            r={12}
            className="fill-primary/20 stroke-primary stroke-2 cursor-pointer hover:fill-primary/40 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              onQuickAdd('child')
            }}
          />
          <text 
            x={CARD_W / 2} 
            y={CARD_H + 20 + 4} 
            textAnchor="middle" 
            className="fill-primary text-xs font-bold pointer-events-none"
          >
            +
          </text>

          {/* Add parent */}
          <circle
            cx={CARD_W / 2}
            cy={-20}
            r={12}
            className="fill-primary/20 stroke-primary stroke-2 cursor-pointer hover:fill-primary/40 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              onQuickAdd('parent')
            }}
          />
          <text 
            x={CARD_W / 2} 
            y={-20 + 4} 
            textAnchor="middle" 
            className="fill-primary text-xs font-bold pointer-events-none"
          >
            +
          </text>
        </>
      )}
    </g>
  );
};