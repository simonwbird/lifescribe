import { NodeRect, Union } from "../../lib/familyTreeV2Types";
import { CARD_W, CARD_H } from "./PersonCard";

/** Geometry constants (pixel-perfect) */
export const ROW_HEIGHT   = 220;
export const SIB_GAP      = 48;
export const SPOUSE_GAP   = 16;

export const PORT_INSET   = 8;   // pull connectors off card edge
export const STEM_LEN     = 10;  // short vertical stems into union bar
export const CORNER_RAD   = 12;  // rounded elbows radius

export const EDGE_W       = 2;   // connector stroke width
export const BAR_W        = 3;   // spouse bar width

/** Ports */
export const topPort = (r: NodeRect)    => ({ x: Math.round(r.x + CARD_W / 2), y: Math.round(r.y - PORT_INSET) });
export const bottomPort = (r: NodeRect) => ({ x: Math.round(r.x + CARD_W / 2), y: Math.round(r.y + CARD_H + PORT_INSET) });

/** Bar position: slight below center of card row (Ancestry look) */
export const unionYForRow = (rowTopY: number) => Math.round(rowTopY + CARD_H * 0.52);

/** Build the union bar geometry from partner rects + row Y */
export function unionBar(a: NodeRect, b: NodeRect, rowTopY: number) {
  const y = unionYForRow(rowTopY);
  const ax = Math.round(a.x + CARD_W / 2);
  const bx = Math.round(b.x + CARD_W / 2);
  const [x1, x2] = ax < bx ? [ax, bx] : [bx, ax];
  return { x1, x2, y, ax, bx };
}

/** Rounded orthogonal path through a set of points (H/V segments only) */
type Pt = { x: number; y: number };
const sign = (n: number) => (n < 0 ? -1 : n > 0 ? 1 : 0);

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
    const vx = sign(p1.x - prev.x);
    const vy = sign(p1.y - prev.y);
    const nx = sign(next.x - p1.x);
    const ny = sign(next.y - p1.y);

    const preLen  = Math.abs(vx ? p1.x - prev.x : p1.y - prev.y);
    const postLen = Math.abs(nx ? next.x - p1.x : next.y - p1.y);
    const rr = Math.min(r, preLen / 2, postLen / 2);

    const bx = p1.x - vx * rr;
    const by = p1.y - vy * rr;
    segs.push(`L${Math.round(bx)},${Math.round(by)}`);

    const ax = p1.x + nx * rr;
    const ay = p1.y + ny * rr;
    segs.push(`Q${Math.round(p1.x)},${Math.round(p1.y)} ${Math.round(ax)},${Math.round(ay)}`);
  }
  return segs.join(" ");
}

/** Path from a union midpoint to a child top port (Ancestry elbows) */
export function pathUnionToChild(xm: number, yBar: number, childTop: Pt, r = CORNER_RAD) {
  const midY = Math.round((yBar + childTop.y) / 2);
  return roundedOrthogonal(
    [{ x: xm, y: yBar }, { x: xm, y: midY }, { x: childTop.x, y: midY }, { x: childTop.x, y: childTop.y }],
    r
  );
}

/** Path from a single parent bottom port to a child top port (no spouse) */
export function pathParentToChild(bp: Pt, childTop: Pt, r = CORNER_RAD) {
  const midY = Math.round((bp.y + childTop.y) / 2);
  return roundedOrthogonal(
    [{ x: bp.x, y: bp.y }, { x: bp.x, y: midY }, { x: childTop.x, y: midY }, { x: childTop.x, y: childTop.y }],
    r
  );
}