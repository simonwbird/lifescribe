import React from 'react'

export const CARD_W = 140;
export const CARD_H = 180;
export const CARD_R = 8;

export const PHOTO_X = 12;
export const PHOTO_Y = 12;
export const PHOTO_W = CARD_W - 24;
export const PHOTO_H = 100;
export const PHOTO_R = 6;

export const NAME_X = CARD_W / 2;
export const NAME_Y = PHOTO_Y + PHOTO_H + 20;
export const DATES_Y = NAME_Y + 18;

/* Layout spacing */
export const H_SPACING = 48;        // siblings
export const ROW_HEIGHT = 220;      // generations
export const MARRIAGE_GAP = 16;     // space between spouses
export const COMPONENT_GAP = 220;   // between disconnected groups

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
  const b = year(person.birth_date);
  const d = year(person.death_date);
  const dates = d ? `${b}–${d}` : (b ? `b. ${b}` : '');
  const initials = getInitials(person.full_name);

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Card */}
      <rect 
        width={CARD_W} 
        height={CARD_H} 
        rx={CARD_R}
        fill="var(--fe-card)" 
        stroke="var(--fe-card-border)"
        strokeWidth="1"
        filter="url(#feCardShadow)"
        className="cursor-pointer hover:stroke-primary transition-colors"
        onClick={onClick}
      />

      {/* Photo area */}
      <rect
        x={PHOTO_X}
        y={PHOTO_Y} 
        width={PHOTO_W}
        height={PHOTO_H}
        rx={PHOTO_R}
        fill="#f0f0f0"
        stroke="var(--fe-card-border)"
        strokeWidth="1"
      />

      {/* Photo or avatar */}
      {person.avatar_url ? (
        <>
          <clipPath id={`clip-${person.id}`}>
            <rect x={PHOTO_X} y={PHOTO_Y} width={PHOTO_W} height={PHOTO_H} rx={PHOTO_R}/>
          </clipPath>
          <image 
            href={person.avatar_url} 
            x={PHOTO_X} 
            y={PHOTO_Y} 
            width={PHOTO_W} 
            height={PHOTO_H}
            clipPath={`url(#clip-${person.id})`}
            preserveAspectRatio="xMidYMid slice"
          />
        </>
      ) : (
        /* Initials fallback */
        <text 
          x={PHOTO_X + PHOTO_W / 2} 
          y={PHOTO_Y + PHOTO_H / 2 + 6} 
          textAnchor="middle"
          className="fill-muted-foreground text-xl font-semibold"
        >
          {initials}
        </text>
      )}

      {/* Name */}
      <text 
        x={NAME_X} 
        y={NAME_Y} 
        textAnchor="middle"
        className="fe-name"
      >
        {person.full_name}
      </text>
      
      {/* Dates */}
      {dates && (
        <text 
          x={NAME_X} 
          y={DATES_Y} 
          textAnchor="middle"
          className="fe-dates"
        >
          {dates}
        </text>
      )}

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