// src/components/familyTreeV2/AncestryConnectors.ts
import { CARD_W, CARD_H } from "./PersonCard";

export interface NodeRect {
  x: number;
  y: number;
}

/** ======= Pixel constants (Ancestry) ======= */
export const ROW_HEIGHT = 220;
export const SIB_GAP = 48;
export const SPOUSE_GAP = 16;

export const PORT_INSET = 8;   // pull connectors off the card edge
export const STEM_LEN  = 10;   // short stems into union bar
export const CORNER_RAD = 12;  // rounded elbow radius

export const EDGE_W = 2;       // connector width
export const BAR_W  = 3;       // spouse bar width

export const COLORS = {
  link:   "#C9CCD4",   // parent-child links
  strong: "#AEB3BE",   // stems + marriage bar
};

export const unionYForRow = (rowTopY: number) =>
  Math.round(rowTopY + CARD_H * 0.52); // slightly below mid-card

export const topPort = (r: NodeRect)    =>
  ({ x: Math.round(r.x + CARD_W / 2), y: Math.round(r.y - PORT_INSET) });

export const bottomPort = (r: NodeRect) =>
  ({ x: Math.round(r.x + CARD_W / 2), y: Math.round(r.y + CARD_H + PORT_INSET) });

export function unionBar(a: NodeRect, b: NodeRect, rowTopY: number) {
  const y = unionYForRow(rowTopY);
  const ax = Math.round(a.x + CARD_W / 2);
  const bx = Math.round(b.x + CARD_W / 2);
  const [x1, x2] = ax < bx ? [ax, bx] : [bx, ax];
  return { x1, x2, y, ax, bx, xm: Math.round((x1 + x2) / 2) };
}

/** Rounded orthogonal path through H/V points */
type Pt = { x: number; y: number };
const s = (n: number) => (n < 0 ? -1 : n > 0 ? 1 : 0);

export function roundedOrthogonal(points: Pt[], r: number) {
  if (points.length < 2) return "";
  const segs: string[] = [];
  const p0 = points[0];
  segs.push(`M${Math.round(p0.x)},${Math.round(p0.y)}`);
  for (let i = 1; i < points.length; i++) {
    const p1 = points[i];
    const prev = points[i - 1];
    const isCorner = i < points.length - 1;
    if (!isCorner) {
      segs.push(`L${Math.round(p1.x)},${Math.round(p1.y)}`);
      break;
    }
    const next = points[i + 1];
    const vx = s(p1.x - prev.x);
    const vy = s(p1.y - prev.y);
    const nx = s(next.x - p1.x);
    const ny = s(next.y - p1.y);
    const pre  = Math.abs(vx ? p1.x - prev.x : p1.y - prev.y);
    const post = Math.abs(nx ? next.x - p1.x : next.y - p1.y);
    const rr = Math.min(r, pre / 2, post / 2);

    const bx = p1.x - vx * rr, by = p1.y - vy * rr;
    segs.push(`L${Math.round(bx)},${Math.round(by)}`);
    const ax = p1.x + nx * rr, ay = p1.y + ny * rr;
    segs.push(`Q${Math.round(p1.x)},${Math.round(p1.y)} ${Math.round(ax)},${Math.round(ay)}`);
  }
  return segs.join(" ");
}

export const pathUnionToChild = (xm: number, yBar: number, childTop: Pt) => {
  const midY = Math.round((yBar + childTop.y) / 2);
  return roundedOrthogonal(
    [{ x: xm, y: yBar }, { x: xm, y: midY }, { x: childTop.x, y: midY }, { x: childTop.x, y: childTop.y }],
    CORNER_RAD
  );
};

export const pathParentToChild = (bp: Pt, childTop: Pt) => {
  const midY = Math.round((bp.y + childTop.y) / 2);
  return roundedOrthogonal(
    [{ x: bp.x, y: bp.y }, { x: bp.x, y: midY }, { x: childTop.x, y: midY }, { x: childTop.x, y: childTop.y }],
    CORNER_RAD
  );
};