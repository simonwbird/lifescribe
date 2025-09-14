import { NodeRect } from "../../lib/familyTreeV2Types";
import { CARD_W, CARD_H } from "./PersonCard";

/** ===== Ancestry geometry + tokens (final) ===== */
export const ROW_HEIGHT = 294;   // row vertical pitch (adjusted for ~150px union→rail drop)
export const SIB_GAP    = 48;    // gap between siblings
export const SPOUSE_GAP = 16;    // gap between spouses within a couple

export const PORT_INSET = 8;     // lift ports off card edges to avoid touching borders
export const STEM_LEN   = 10;    // short stems from partner centers into the union bar
export const CORNER_RAD = 12;    // radius when using rounded elbows (kept for future)

export const EDGE_W = 2;         // normal link width (rails, child drops)
export const BAR_W  = 3;         // union bar width

export const COLORS = {
  link:   "#C9CCD4",             // rails + child drops
  strong: "#AEB3BE",             // stems + union bar + bar→rail drop
};

/** Shared rail sits a fixed distance above the child cards (per child row) */
export const RAIL_GAP_ABOVE_CHILD = 50; // 50px gap from rail to child cards

/** Union bar sits slightly below card midline (tighter to Ancestry) */
export const unionYForRow = (rowTopY: number) =>
  Math.round(rowTopY + CARD_H * 0.52);

/** Ports */
export const topPort = (r: NodeRect) =>
  ({ x: Math.round(r.x + CARD_W / 2), y: Math.round(r.y - PORT_INSET) });

export const bottomPort = (r: NodeRect) =>
  ({ x: Math.round(r.x + CARD_W / 2), y: Math.round(r.y + CARD_H + PORT_INSET) });

/** Union bar geometry between two partner rects */
export function unionBar(a: NodeRect, b: NodeRect, rowTopY: number) {
  const y = unionYForRow(rowTopY);
  const ax = Math.round(a.x + CARD_W / 2);
  const bx = Math.round(b.x + CARD_W / 2);
  const [x1, x2] = ax < bx ? [ax, bx] : [bx, ax];
  return { x1, x2, y, ax, bx, xm: Math.round((x1 + x2) / 2) };
}