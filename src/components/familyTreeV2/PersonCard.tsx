import React from "react";
import { NodeRect, Person } from "../../lib/familyTreeV2Types";

/** Card constants (Ancestry proportions) */
export const CARD_W = 156;
export const CARD_H = 208;
export const CARD_R = 12;

const TILE_X = 10, TILE_Y = 10, TILE_W = 56, TILE_H = 76, TILE_R = 8;

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

export function PersonCard({ rect, person }: { rect: NodeRect; person: Person }) {
  const b = yr(person.birth_date), d = yr(person.death_date);
  const dates = d ? `${b}–${d}` : b ? `${b}–Living` : "Living";
  const name = fullName(person);
  
  // Truncate long names to fit card width
  const maxNameChars = 16; // Adjust based on card width and font size
  const displayName = name.length > maxNameChars ? `${name.slice(0, maxNameChars - 1)}…` : name;

  return (
    <g transform={`translate(${Math.round(rect.x)},${Math.round(rect.y)})`}>
      <rect width={CARD_W} height={CARD_H} rx={CARD_R} fill={TOKENS.card} stroke={TOKENS.cardBorder}
            filter="url(#feCardShadow)" />
      <rect x={TILE_X} y={TILE_Y} width={TILE_W} height={TILE_H} rx={TILE_R} fill={genderFill(person.sex)} />
      <path
        d="M36 28c0 7.18-5.82 13-13 13s-13-5.82-13-13S15.82 15 23 15s13 5.82 13 13zm10 38c0-11.7-10.3-21-23-21S0 54.3 0 66v8h46v-8z"
        transform="translate(14,12)" fill="#fff" opacity="0.95"
      />
      <text x={TILE_X + TILE_W + 10} y={30}
            style={{ fontFamily: font, fontSize: 13, fontWeight: 600, fill: TOKENS.name }}>
        <tspan>{displayName}</tspan>
      </text>
      <text x={TILE_X + TILE_W + 10} y={50}
            style={{ fontFamily: font, fontSize: 12, fill: TOKENS.dates }}>
        {dates}
      </text>
    </g>
  );
}