import React, { Fragment } from "react";
import { FamilyGraph, TreeLayout } from "../../lib/familyTreeV2Types";
import {
  BAR_W, EDGE_W, STEM_LEN, COLORS,
  topPort, bottomPort, unionBar, RAIL_GAP_ABOVE_CHILD
} from "./AncestryConnectors";

/**
 * Ancestry-style, de-spaghetti:
 *  • One fixed rail Y per child depth: railY = rows(childDepth) - RAIL_GAP_ABOVE_CHILD
 *  • Unions: stems → bar → single vertical to rail → verticals to each child.
 *  • Single parent: parent bottom → single vertical to rail → verticals to each child.
 */
export default function ConnectionRenderer({ graph, layout }: { graph: FamilyGraph; layout: TreeLayout }) {
  /** ---------- UNIONS (group children by depth; one rail per depth) ---------- */
  const unionGroups = layout.unions.flatMap(u => {
    const a = layout.rects.get(u.a);
    const b = layout.rects.get(u.b);
    if (!a || !b) return [];

    const rowY = layout.rows.get(u.depth)!;
    const { x1, x2, y, ax, bx, xm } = unionBar(a, b, rowY);

    // keep only children that exist in layout
    const kids = u.children
      .map(id => ({ id, r: layout.rects.get(id)! }))
      .filter(k => !!k.r);

    // group children by their depth (usually all d-1, but be robust)
    const byDepth = new Map<number, { id: string; tx: number; ty: number }[]>();
    for (const k of kids) {
      const d = k.r.depth; // child depth
      const tp = topPort(k.r);
      (byDepth.get(d) ?? byDepth.set(d, []).get(d)!).push({ id: k.id, tx: tp.x, ty: tp.y });
    }

    const out: Array<{
      key: string;
      bar: { x1: number; x2: number; y: number; ax: number; bx: number; xm: number };
      rail: { y: number; x1: number; x2: number };
      children: { id: string; tx: number; ty: number }[];
    }> = [];

    byDepth.forEach((children, childDepth) => {
      const railY = (layout.rows.get(childDepth) ?? (y + 60)) - RAIL_GAP_ABOVE_CHILD;
      const xs = children.map(c => c.tx).concat([xm]); // span includes union midpoint
      const rail = { y: railY, x1: Math.min(...xs), x2: Math.max(...xs) };
      out.push({ key: `${u.id}-${childDepth}`, bar: { x1, x2, y, ax, bx, xm }, rail, children });
    });

    return out;
  });

  /** ---------- SINGLE-PARENT GROUPS (no union covering those children) ---------- */
  const childInUnion = new Set<string>();
  unionGroups.forEach(g => g.children.forEach(c => childInUnion.add(c.id)));

  type SPGroup = {
    key: string;
    parentBottomX: number;
    rail: { y: number; x1: number; x2: number };
    children: { id: string; tx: number; ty: number }[];
  };
  const singleParentGroups: SPGroup[] = [];

  // For each parent, group remaining children by child depth (one rail per depth)
  Array.from(layout.rects.values()).forEach(parentRect => {
    const rawKids = (graph.childrenOf.get(parentRect.id) ?? []).filter(id => !childInUnion.has(id));
    if (!rawKids.length) return;

    const kidRects = rawKids
      .map(id => ({ id, r: layout.rects.get(id)! }))
      .filter(k => !!k.r);
    if (!kidRects.length) return;

    const byDepth = new Map<number, { id: string; tx: number; ty: number }[]>();
    for (const k of kidRects) {
      const d = k.r.depth;
      const tp = topPort(k.r);
      (byDepth.get(d) ?? byDepth.set(d, []).get(d)!).push({ id: k.id, tx: tp.x, ty: tp.y });
    }

    const pBottom = bottomPort(parentRect);

    byDepth.forEach((children, childDepth) => {
      const railY = (layout.rows.get(childDepth) ?? (pBottom.y + 40)) - RAIL_GAP_ABOVE_CHILD;
      const xs = children.map(c => c.tx).concat([pBottom.x]); // span includes parent bottom
      const rail = { y: railY, x1: Math.min(...xs), x2: Math.max(...xs) };
      singleParentGroups.push({
        key: `${parentRect.id}-${childDepth}`,
        parentBottomX: pBottom.x,
        rail,
        children
      });
    });
  });

  return (
    <g>
      {/* ===== unions (bar + stems + single drop + shared rail + child drops) ===== */}
      {unionGroups.map(g => (
        <Fragment key={g.key}>
          {/* stems */}
          <path d={`M${g.bar.ax},${g.bar.y - STEM_LEN} V${g.bar.y}`} stroke={COLORS.strong} strokeWidth={EDGE_W}
                fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <path d={`M${g.bar.bx},${g.bar.y - STEM_LEN} V${g.bar.y}`} stroke={COLORS.strong} strokeWidth={EDGE_W}
                fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {/* bar */}
          <path d={`M${g.bar.x1},${g.bar.y} L${g.bar.x2},${g.bar.y}`} stroke={COLORS.strong} strokeWidth={BAR_W}
                fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {/* drop from bar midpoint to rail (strong) */}
          <path d={`M${g.bar.xm},${g.bar.y} V${g.rail.y}`} stroke={COLORS.strong} strokeWidth={EDGE_W}
                fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {/* shared rail (link color) */}
          <path d={`M${g.rail.x1},${g.rail.y} L${g.rail.x2},${g.rail.y}`} stroke={COLORS.link} strokeWidth={EDGE_W}
                fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {/* verticals to each child */}
          {g.children.map(c => (
            <path key={`${g.key}-${c.id}`} d={`M${c.tx},${g.rail.y} V${c.ty}`} stroke={COLORS.link} strokeWidth={EDGE_W}
                  fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          ))}
        </Fragment>
      ))}

      {/* ===== single-parent rails ===== */}
      {singleParentGroups.map(sp => (
        <g key={sp.key}>
          {/* parent drop to rail (strong) */}
          <path d={`M${sp.parentBottomX},${sp.rail.y - 24} V${sp.rail.y}`} stroke={COLORS.strong} strokeWidth={EDGE_W}
                fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {/* rail */}
          <path d={`M${sp.rail.x1},${sp.rail.y} L${sp.rail.x2},${sp.rail.y}`} stroke={COLORS.link} strokeWidth={EDGE_W}
                fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {/* child drops */}
          {sp.children.map(c => (
            <path key={`${sp.key}-${c.id}`} d={`M${c.tx},${sp.rail.y} V${c.ty}`} stroke={COLORS.link} strokeWidth={EDGE_W}
                  fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      ))}
    </g>
  );
}
