import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NodeRect, Person, FamilyGraph } from "../../lib/familyTreeV2Types";
import { supabase } from '@/lib/supabase';
import { snapToGrid } from "./GridOverlay";

/** Card constants */
export const CARD_W = 140;
export const CARD_H = 180;
export const CARD_R = 12;

const PHOTO_X = 10, PHOTO_Y = 10, PHOTO_W = 120, PHOTO_H = 90, PHOTO_R = 8;

const TOKENS = {
  card: "#FFFFFF",
  cardBorder: "#D9D9DF",
  cardBorderDragging: "#3B82F6",
  name: "#1F2328",
  dates: "#6B7280",
  male: "#8DA9C4",
  female: "#E6B0A0",
  unknown: "#C3C7CF",
};

const font = 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial';
const genderFill = (s?: "M"|"F"|"X") => s==="M" ? TOKENS.male : s==="F" ? TOKENS.female : TOKENS.unknown;
const yr = (v?: string|number|null) => v==null ? "" : String(v).slice(0,4);
const fullName = (p: Person) => (p.given_name + " " + (p.surname ?? "")).trim();

interface DraggablePersonCardProps {
  rect: NodeRect;
  person: Person;
  onAddRequested?: (type: 'parent'|'sibling'|'child'|'spouse', personId: string) => void;
  graph?: FamilyGraph;
  onDrag?: (personId: string, x: number, y: number) => void;
  onDragEnd?: (personId: string, x: number, y: number) => void;
  gridSize?: number;
  isDragging?: boolean;
  positions?: Map<string, { x: number; y: number }>;
}

export function DraggablePersonCard({ 
  rect, 
  person, 
  onAddRequested, 
  graph,
  onDrag,
  onDragEnd,
  gridSize = 30,
  isDragging = false,
  positions = new Map<string, { x: number; y: number }>()
}: DraggablePersonCardProps) {
  const navigate = useNavigate();
  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState<string | undefined>(person.avatar_url || undefined);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [localIsDragging, setLocalIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const cardRef = useRef<SVGGElement>(null);

  // Refresh signed URLs
  useEffect(() => {
    let isMounted = true;
    async function refresh() {
      if (!person.avatar_url) { setResolvedAvatarUrl(undefined); return; }
      let url = person.avatar_url as string;
      const match = url.match(/object\/sign\/([^/]+)\/([^?]+)/);
      if (match) {
        const bucket = match[1];
        const objectPath = decodeURIComponent(match[2]);
        const { data } = await supabase.storage.from(bucket).createSignedUrl(objectPath, 3600);
        if (data?.signedUrl) url = data.signedUrl;
      }
      if (!isMounted) return;
      setResolvedAvatarUrl(url);
    }
    refresh();
    return () => { isMounted = false; };
  }, [person.avatar_url]);

  const b = yr(person.birth_date), d = yr(person.death_date);
  const dates = d ? `${b}–${d}` : b ? `${b}–Living` : "Living";
  const name = fullName(person);
  
  const nameParts = name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as Element).closest('.connector-btn')) return;
    
    e.preventDefault();
    setLocalIsDragging(true);
    setHasDragged(false); // Reset drag flag
    
    const svgElement = (e.target as Element).closest('svg') as SVGSVGElement | null;
    if (!svgElement) return;
    const ctm = svgElement.getScreenCTM();
    if (!ctm) return;
    
    // Convert pointer to SVG coordinates (accounting for viewBox/zoom)
    const pt = svgElement.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const inv = ctm.inverse();
    const svgP = pt.matrixTransform(inv);
    
    // Store drag offset in ref to avoid stale state during listeners
    dragOffsetRef.current = {
      x: svgP.x - rect.x,
      y: svgP.y - rect.y
    };

    const handleMouseMove = (ev: MouseEvent) => {
      const newPt = svgElement.createSVGPoint();
      newPt.x = ev.clientX;
      newPt.y = ev.clientY;
      const newSvgP = newPt.matrixTransform(inv);
      
      const dx = dragOffsetRef.current.x;
      const dy = dragOffsetRef.current.y;
      const newX = newSvgP.x - dx;
      const newY = newSvgP.y - dy;
      
      // Mark as dragged if moved more than a few pixels
      const distance = Math.sqrt((newX - rect.x) ** 2 + (newY - rect.y) ** 2);
      if (distance > 5) {
        setHasDragged(true);
      }
      
      // Do not snap while dragging for smooth movement; snap on drop instead
      onDrag?.(person.id, newX, newY);
    };

    const handleMouseUp = (ev: MouseEvent) => {
      setLocalIsDragging(false);
      
      const finalPt = svgElement.createSVGPoint();
      finalPt.x = ev.clientX;
      finalPt.y = ev.clientY;
      const finalSvgP = finalPt.matrixTransform(inv);
      
      const dx = dragOffsetRef.current.x;
      const dy = dragOffsetRef.current.y;
      const finalX = finalSvgP.x - dx;
      const finalY = finalSvgP.y - dy;
      
      const shouldSnap = !(ev.altKey || ev.shiftKey);
      const result = shouldSnap ? snapToGrid(finalX, finalY, gridSize) : { x: finalX, y: finalY };
      onDragEnd?.(person.id, result.x, result.y);
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!(e.target as Element).closest('.connector-btn') && !localIsDragging && !hasDragged) {
      navigate(`/people/${person.id}`);
    }
    // Reset drag flag after click
    setTimeout(() => setHasDragged(false), 100);
  };

  const handleAddRelation = (e: React.MouseEvent, type: 'parent' | 'sibling' | 'child' | 'spouse') => {
    e.stopPropagation();
    onAddRequested?.(type, person.id);
  };

  const isMarried = graph?.spouses?.get(person.id)?.size > 0;
  const cardIsDragging = isDragging || localIsDragging;
  
  // Determine which side is "outside" for married couples
  const getOutsideSides = () => {
    if (!isMarried || !graph) return { left: true, right: true };
    
    const spouses = graph.spouses?.get(person.id);
    if (!spouses || spouses.size === 0) return { left: true, right: true };
    
    // Get spouse position to determine which side is "outside"
    const spouseId = Array.from(spouses)[0]; // Get first spouse
    const spousePos = positions.get(spouseId);
    const currentPos = positions.get(person.id);
    
    if (!spousePos || !currentPos) return { left: true, right: true };
    
    // If spouse is to the right, show buttons on the left side only
    // If spouse is to the left, show buttons on the right side only
    const spouseIsToRight = spousePos.x > currentPos.x;
    
    return {
      left: spouseIsToRight, // Show left button if spouse is to the right
      right: !spouseIsToRight // Show right button if spouse is to the left
    };
  };
  
  const outsideSides = getOutsideSides();

  return (
    <g 
      ref={cardRef}
      transform={`translate(${rect.x},${rect.y})`}
      style={{ 
        cursor: cardIsDragging ? 'grabbing' : 'grab',
        opacity: cardIsDragging ? 0.9 : 1,
        filter: cardIsDragging ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'none'
      }}
      className={`person-card ${cardIsDragging ? 'transition-none' : 'transition-all duration-200'}`}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <rect 
        width={CARD_W} 
        height={CARD_H} 
        rx={CARD_R} 
        fill={TOKENS.card} 
        stroke={cardIsDragging ? TOKENS.cardBorderDragging : TOKENS.cardBorder}
        strokeWidth={cardIsDragging ? 2 : 1}
        filter="url(#feCardShadow)" 
      />
      
      {/* Photo area */}
      <rect 
        x={PHOTO_X} 
        y={PHOTO_Y} 
        width={PHOTO_W} 
        height={PHOTO_H} 
        rx={PHOTO_R} 
        fill={genderFill(person.sex)} 
      />
      
      {resolvedAvatarUrl ? (
        <foreignObject x={PHOTO_X} y={PHOTO_Y} width={PHOTO_W} height={PHOTO_H}>
          <img 
            src={resolvedAvatarUrl} 
            alt={name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: `${PHOTO_R}px`,
              pointerEvents: 'none'
            }}
          />
        </foreignObject>
      ) : (
        <g transform={`translate(${PHOTO_X + PHOTO_W/2 - 23}, ${PHOTO_Y + PHOTO_H/2 - 30})`}>
          <path
            d="M23 28c6.627 0 12-5.373 12-12S29.627 4 23 4s-12 5.373-12 12 5.373 12 12 12zm0 4C15.268 32 0 36.268 0 44v4h46v-4c0-7.732-15.268-12-23-12z"
            fill="#fff" 
            opacity="0.9"
          />
        </g>
      )}

      {/* Connection buttons - only show when not dragging */}
      {!cardIsDragging && (
        <>
          <g className="connector-btn" style={{ opacity: 0.7, cursor: 'pointer' }} onClick={(e) => handleAddRelation(e, 'parent')}>
            <circle cx={CARD_W/2} cy={-8} r="8" fill="#6B7280" stroke="#fff" strokeWidth="1" />
            <line x1={CARD_W/2 - 4} y1={-8} x2={CARD_W/2 + 4} y2={-8} stroke="#fff" strokeWidth="1.5" />
            <line x1={CARD_W/2} y1={-12} x2={CARD_W/2} y2={-4} stroke="#fff" strokeWidth="1.5" />
          </g>

          {/* Sibling button - only show on outside */}
          {outsideSides.left && (
            <g className="connector-btn" style={{ opacity: 0.7, cursor: 'pointer' }} onClick={(e) => handleAddRelation(e, 'sibling')}>
              <circle cx={-8} cy={CARD_H/2} r="8" fill="#6B7280" stroke="#fff" strokeWidth="1" />
              <line x1={-12} y1={CARD_H/2} x2={-4} y2={CARD_H/2} stroke="#fff" strokeWidth="1.5" />
              <line x1={-8} y1={CARD_H/2 - 4} x2={-8} y2={CARD_H/2 + 4} stroke="#fff" strokeWidth="1.5" />
            </g>
          )}

          {/* Spouse button - only show on outside if not married, or if no spouse */}
          {(!isMarried && outsideSides.right) && (
            <g className="connector-btn" style={{ opacity: 0.7, cursor: 'pointer' }} onClick={(e) => handleAddRelation(e, 'spouse')}>
              <circle cx={CARD_W + 8} cy={CARD_H/2} r="8" fill="#6B7280" stroke="#fff" strokeWidth="1" />
              <line x1={CARD_W + 4} y1={CARD_H/2} x2={CARD_W + 12} y2={CARD_H/2} stroke="#fff" strokeWidth="1.5" />
              <line x1={CARD_W + 8} y1={CARD_H/2 - 4} x2={CARD_W + 8} y2={CARD_H/2 + 4} stroke="#fff" strokeWidth="1.5" />
            </g>
          )}

          <g className="connector-btn" style={{ opacity: 0.7, cursor: 'pointer' }} onClick={(e) => handleAddRelation(e, 'child')}>
            <circle cx={CARD_W/2} cy={CARD_H + 8} r="8" fill="#6B7280" stroke="#fff" strokeWidth="1" />
            <line x1={CARD_W/2 - 4} y1={CARD_H + 8} x2={CARD_W/2 + 4} y2={CARD_H + 8} stroke="#fff" strokeWidth="1.5" />
            <line x1={CARD_W/2} y1={CARD_H + 4} x2={CARD_W/2} y2={CARD_H + 12} stroke="#fff" strokeWidth="1.5" />
          </g>
        </>
      )}
      
      {/* Name and dates */}
      <text x={CARD_W/2} y={PHOTO_Y + PHOTO_H + 20} textAnchor="middle"
            style={{ fontFamily: font, fontSize: 12, fontWeight: 600, fill: TOKENS.name, pointerEvents: 'none' }}>
        {firstName}
      </text>
      {lastName && (
        <text x={CARD_W/2} y={PHOTO_Y + PHOTO_H + 35} textAnchor="middle"
              style={{ fontFamily: font, fontSize: 12, fontWeight: 600, fill: TOKENS.name, pointerEvents: 'none' }}>
          {lastName}
        </text>
      )}
      
      <text x={CARD_W/2} y={CARD_H - 15} textAnchor="middle"
            style={{ fontFamily: font, fontSize: 11, fill: TOKENS.dates, pointerEvents: 'none' }}>
        {dates}
      </text>

      {/* Hover indicator */}
      <rect 
        x={0} y={0} width={CARD_W} height={CARD_H} rx={CARD_R} 
        fill="transparent" 
        stroke="transparent" 
        strokeWidth={2}
        style={{ opacity: 0, transition: 'all 0.2s', pointerEvents: 'none' }}
        className="hover:stroke-primary hover:opacity-100"
      />
    </g>
  );
}