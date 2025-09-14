import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NodeRect, Person, FamilyGraph } from "../../lib/familyTreeV2Types";
import { supabase } from '@/lib/supabase'

/** Card constants (Ancestry proportions - redesigned for vertical layout) */
export const CARD_W = 140;
export const CARD_H = 180;
export const CARD_R = 12;

const PHOTO_X = 10, PHOTO_Y = 10, PHOTO_W = 120, PHOTO_H = 90, PHOTO_R = 8;

const TOKENS = {
  card: "#FFFFFF",
  cardBorder: "#D9D9DF",
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

export function PersonCard({ rect, person, onAddRequested, graph }: { 
  rect: NodeRect; 
  person: Person; 
  onAddRequested?: (type: 'parent'|'sibling'|'child'|'spouse', personId: string) => void;
  graph?: FamilyGraph;
}) {
  const navigate = useNavigate();
  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState<string | undefined>(person.avatar_url || undefined)

  // Refresh signed URLs so they don't expire
  useEffect(() => {
    let isMounted = true
    async function refresh() {
      if (!person.avatar_url) { setResolvedAvatarUrl(undefined); return }
      let url = person.avatar_url as string
      // If it's a Supabase signed URL, re-sign it to ensure freshness
      const match = url.match(/object\/sign\/([^/]+)\/([^?]+)/)
      if (match) {
        const bucket = match[1]
        const objectPath = decodeURIComponent(match[2])
        const { data } = await supabase.storage.from(bucket).createSignedUrl(objectPath, 3600)
        if (data?.signedUrl) url = data.signedUrl
      }
      if (!isMounted) return
      setResolvedAvatarUrl(url)
    }
    refresh()
    return () => { isMounted = false }
  }, [person.avatar_url])

  const b = yr(person.birth_date), d = yr(person.death_date);
  const dates = d ? `${b}–${d}` : b ? `${b}–Living` : "Living";
  const name = fullName(person);
  
  // Split name for better fitting
  const nameParts = name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const handleClick = (e: React.MouseEvent) => {
    // Only navigate if not clicking on a connector button
    if (!(e.target as Element).closest('.connector-btn')) {
      navigate(`/people/${person.id}`);
    }
  };

  const handleAddRelation = (e: React.MouseEvent, type: 'parent' | 'sibling' | 'child' | 'spouse') => {
    e.stopPropagation();
    onAddRequested?.(type, person.id);
  };

  // Check if this person is already married
  const isMarried = graph?.spouses?.get(person.id)?.size > 0;
  
  // Debug log to check spouse detection
  console.log(`${person.given_name} married:`, isMarried, 'spouses:', graph?.spouses?.get(person.id));

  return (
    <g 
      transform={`translate(${Math.round(rect.x)},${Math.round(rect.y)})`}
      style={{ cursor: 'pointer' }}
      onClick={handleClick}
    >
      <rect width={CARD_W} height={CARD_H} rx={CARD_R} fill={TOKENS.card} stroke={TOKENS.cardBorder}
            filter="url(#feCardShadow)" />
      
      {/* Photo area at top */}
      <rect x={PHOTO_X} y={PHOTO_Y} width={PHOTO_W} height={PHOTO_H} rx={PHOTO_R} 
            fill={genderFill(person.sex)} />
      
      {/* Display uploaded image if available, otherwise show silhouette */}
      {resolvedAvatarUrl ? (
        <foreignObject x={PHOTO_X} y={PHOTO_Y} width={PHOTO_W} height={PHOTO_H}>
          <img 
            src={resolvedAvatarUrl} 
            alt={name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: `${PHOTO_R}px`
            }}
          />
        </foreignObject>
      ) : (
        // Default person silhouette icon
        <g transform={`translate(${PHOTO_X + PHOTO_W/2 - 23}, ${PHOTO_Y + PHOTO_H/2 - 30})`}>
          <path
            d="M23 28c6.627 0 12-5.373 12-12S29.627 4 23 4s-12 5.373-12 12 5.373 12 12 12zm0 4C15.268 32 0 36.268 0 44v4h46v-4c0-7.732-15.268-12-23-12z"
            fill="#fff" opacity="0.9"
          />
        </g>
      )}

      {/* Subtle connector buttons */}
      {/* Add Parent - Top */}
      <g className="connector-btn" style={{ opacity: 0.7, cursor: 'pointer' }} onClick={(e) => handleAddRelation(e, 'parent')}>
        <circle 
          cx={CARD_W/2} 
          cy={-8} 
          r="8" 
          fill="#6B7280" 
          stroke="#fff" 
          strokeWidth="1"
        />
        <line x1={CARD_W/2 - 4} y1={-8} x2={CARD_W/2 + 4} y2={-8} stroke="#fff" strokeWidth="1.5" />
        <line x1={CARD_W/2} y1={-12} x2={CARD_W/2} y2={-4} stroke="#fff" strokeWidth="1.5" />
      </g>

      {/* Add Sibling - Left */}
      <g className="connector-btn" style={{ opacity: 0.7, cursor: 'pointer' }} onClick={(e) => handleAddRelation(e, 'sibling')}>
        <circle 
          cx={-8} 
          cy={CARD_H/2} 
          r="8" 
          fill="#6B7280" 
          stroke="#fff" 
          strokeWidth="1"
        />
        <line x1={-12} y1={CARD_H/2} x2={-4} y2={CARD_H/2} stroke="#fff" strokeWidth="1.5" />
        <line x1={-8} y1={CARD_H/2 - 4} x2={-8} y2={CARD_H/2 + 4} stroke="#fff" strokeWidth="1.5" />
      </g>

      {/* Add Spouse - Right (only show if not already married) */}
      {!isMarried && (
        <g className="connector-btn" style={{ opacity: 0.7, cursor: 'pointer' }} onClick={(e) => handleAddRelation(e, 'spouse')}>
          <circle 
            cx={CARD_W + 8} 
            cy={CARD_H/2} 
            r="8" 
            fill="#6B7280" 
            stroke="#fff" 
            strokeWidth="1"
          />
          <line x1={CARD_W + 4} y1={CARD_H/2} x2={CARD_W + 12} y2={CARD_H/2} stroke="#fff" strokeWidth="1.5" />
          <line x1={CARD_W + 8} y1={CARD_H/2 - 4} x2={CARD_W + 8} y2={CARD_H/2 + 4} stroke="#fff" strokeWidth="1.5" />
        </g>
      )}

      {/* Add Child - Bottom */}
      <g className="connector-btn" style={{ opacity: 0.7, cursor: 'pointer' }} onClick={(e) => handleAddRelation(e, 'child')}>
        <circle 
          cx={CARD_W/2} 
          cy={CARD_H + 8} 
          r="8" 
          fill="#6B7280" 
          stroke="#fff" 
          strokeWidth="1"
        />
        <line x1={CARD_W/2 - 4} y1={CARD_H + 8} x2={CARD_W/2 + 4} y2={CARD_H + 8} stroke="#fff" strokeWidth="1.5" />
        <line x1={CARD_W/2} y1={CARD_H + 4} x2={CARD_W/2} y2={CARD_H + 12} stroke="#fff" strokeWidth="1.5" />
      </g>
      
      {/* Name below photo - centered and wrapped */}
      <text x={CARD_W/2} y={PHOTO_Y + PHOTO_H + 20} textAnchor="middle"
            style={{ fontFamily: font, fontSize: 12, fontWeight: 600, fill: TOKENS.name }}>
        {firstName}
      </text>
      {lastName && (
        <text x={CARD_W/2} y={PHOTO_Y + PHOTO_H + 35} textAnchor="middle"
              style={{ fontFamily: font, fontSize: 12, fontWeight: 600, fill: TOKENS.name }}>
          {lastName}
        </text>
      )}
      
      {/* Dates at bottom - centered */}
      <text x={CARD_W/2} y={CARD_H - 15} textAnchor="middle"
            style={{ fontFamily: font, fontSize: 11, fill: TOKENS.dates }}>
        {dates}
      </text>

      {/* Hover indicator */}
      <rect 
        x={0} y={0} width={CARD_W} height={CARD_H} rx={CARD_R} 
        fill="transparent" 
        stroke="transparent" 
        strokeWidth={2}
        style={{ opacity: 0, transition: 'all 0.2s' }}
        className="hover:stroke-primary hover:opacity-100"
      />
    </g>
  );
}