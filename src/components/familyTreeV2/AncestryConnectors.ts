import { NodeRect } from "../../lib/familyTreeV2Types";
import { CARD_W, CARD_H } from "./PersonCard";

export const ROW_HEIGHT = 220;
export const SIB_GAP = 48;
export const SPOUSE_GAP = 16;

export const PORT_INSET = 8;
export const STEM_LEN  = 10;
export const CORNER_RAD = 12;

export const EDGE_W = 2;
export const BAR_W  = 3;

export const RAIL_GAP_ABOVE_CHILD = 18; // px above child card top for the shared rail

export const COLORS = {
  link:   "#C9CCD4",  // rails + child links
  strong: "#AEB3BE",  // stems + union bar + bar→rail drop
};

export const unionYForRow = (rowTopY: number) => Math.round(rowTopY + CARD_H * 0.52);

export const topPort    = (r: NodeRect) => ({ x: Math.round(r.x + CARD_W / 2), y: Math.round(r.y - PORT_INSET) });
export const bottomPort = (r: NodeRect) => ({ x: Math.round(r.x + CARD_W / 2), y: Math.round(r.y + CARD_H + PORT_INSET) });

export function unionBar(a: NodeRect, b: NodeRect, rowTopY: number) {
  const y = unionYForRow(rowTopY);
  const ax = Math.round(a.x + CARD_W / 2);
  const bx = Math.round(b.x + CARD_W / 2);
  const [x1, x2] = ax < bx ? [ax, bx] : [bx, ax];
  return { x1, x2, y, ax, bx, xm: Math.round((x1 + x2) / 2) };
}