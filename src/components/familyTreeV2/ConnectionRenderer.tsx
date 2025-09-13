import React, { Fragment } from "react";
import { FamilyGraph, TreeLayout } from "../../lib/familyTreeV2Types";
import {
  BAR_W, EDGE_W, STEM_LEN, COLORS,
  topPort, bottomPort, unionBar
} from "./AncestryConnectors";

/**
 * Ancestry-style connectors:
 *  - For every union with children:
 *      stems ↓ into a bar (between partners) → vertical down to a shared child-rail → verticals down to each child.
 *  - For single-parent groups (children not covered by any union):
 *      parent bottom ↓ to a child-rail → verticals down to each child.
 *  - All strokes are non-scaling, rounded caps/joins.
 */
export default function ConnectionRenderer({ graph, layout }: { graph: FamilyGraph; layout: TreeLayout }) {
  /** -------- UNIONS WITH CHILDREN (Ancestry rail) -------- */
  const unionGroups = layout.unions
    .map(u => {
      const a = layout.rects.get(u.a);
      const b = layout.rects.get(u.b);
      if (!a || !b) return null;

      const rowY = layout.rows.get(u.depth)!;
      const { x1, x2, y, ax, bx, xm } = unionBar(a, b, rowY);

      // Collect children that are actually placed in the row below
      const kids = u.children
        .map(id => ({ id, r: layout.rects.get(id)! }))
        .filter(k => !!k.r);

      if (!kids.length) {
        return {
          u, a, b, bar: { x1, x2, y, ax, bx, xm },
          rail: null,
          children: [] as { id: string; tx: number; ty: number }[]
        };
      }

      // Shared rail Y: between bar and the *closest* child row (visually matches Ancestry)
      const childTopYs = kids.map(k => topPort(k.r).y);
      const closestTop = Math.min(...childTopYs);
      const railY = Math.round((y + closestTop) / 2);

      // Rail extents: span from min(childTopX) to max(childTopX), also include xm for the vertical drop
      const childTopXs = kids.map(k => topPort(k.r).x);
      const minX = Math.min(...childTopXs, xm);
      const maxX = Math.max(...childTopXs, xm);

      return {
        u, a, b,
        bar: { x1, x2, y, ax, bx, xm },
        rail: { y: railY, x1: minX, x2: maxX },
        children: kids.map(k => ({ id: k.id, tx: topPort(k.r).x, ty: topPort(k.r).y }))
      };
    })
    .filter(Boolean) as Array<{
      u: any;
      a: any; b: any;
      bar: { x1: number; x2: number; y: number; ax: number; bx: number; xm: number };
      rail: { y: number; x1: number; x2: number } | null;
      children: { id: string; tx: number; ty: number }[];
    }>;

  /** -------- SINGLE-PARENT GROUPS (no union for those children) -------- */
  // Mark children already handled via unions
  const childInUnion = new Set<string>();
  unionGroups.forEach(g => g.children.forEach(c => childInUnion.add(c.id)));

  // Group remaining children by parent + child depth row
  type SPKey = string;
  type SPGroup = { parentId: string; parentRect: any; railY: number; x1: number; x2: number; kids: { id: string; tx: number; ty: number }[] };
  const singleParentGroups = new Map<SPKey, SPGroup>();

  Array.from(layout.rects.values()).forEach(r => {
    const kids = (graph.childrenOf.get(r.id) ?? []).filter(cid => !childInUnion.has(cid));
    if (!kids.length) return;

    const childrenRects = kids
      .map(id => ({ id, rect: layout.rects.get(id)! }))
      .filter(k => !!k.rect);
    if (!childrenRects.length) return;

    // All these children should be in a row directly below the parent (depth - 1)
    const tops = childrenRects.map(k => topPort(k.rect));
    const closestTopY = Math.min(...tops.map(t => t.y));
    // Rail halfway between parent bottom and nearest child top
    const parentBottom = bottomPort(r);
    const railY = Math.round((parentBottom.y + closestTopY) / 2);
    const minX = Math.min(...tops.map(t => t.x), parentBottom.x);
    const maxX = Math.max(...tops.map(t => t.x), parentBottom.x);

    const key = `${r.id}::${railY}`;
    if (!singleParentGroups.has(key)) {
      singleParentGroups.set(key, {
        parentId: r.id,
        parentRect: r,
        railY,
        x1: minX,
        x2: maxX,
        kids: tops.map(t => ({ id: childrenRects.find(c => topPort(c.rect).x === t.x)?.id!, tx: t.x, ty: t.y }))
      });
    }
  });

  return (
    <g>
      {/* ===== UNIONS ===== */}
      {unionGroups.map(g => (
        <Fragment key={`u-${g.u.id}`}>
          {/* stems into the bar */}
          <path d={`M${g.bar.ax},${g.bar.y - STEM_LEN} V${g.bar.y}`} stroke={COLORS.strong} strokeWidth={EDGE_W}
                fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <path d={`M${g.bar.bx},${g.bar.y - STEM_LEN} V${g.bar.y}`} stroke={COLORS.strong} strokeWidth={EDGE_W}
                fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {/* bar */}
          <path d={`M${g.bar.x1},${g.bar.y} L${g.bar.x2},${g.bar.y}`} stroke={COLORS.strong} strokeWidth={BAR_W}
                fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

          {/* children rail (Ancestry) */}
          {g.rail && (
            <>
              {/* vertical drop from bar midpoint to rail */}
              <path d={`M${g.bar.xm},${g.bar.y} V${g.rail.y}`} stroke={COLORS.strong} strokeWidth={EDGE_W}
                    fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

              {/* horizontal rail across all children */}
              <path d={`M${g.rail.x1},${g.rail.y} L${g.rail.x2},${g.rail.y}`} stroke={COLORS.link} strokeWidth={EDGE_W}
                    fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

              {/* verticals down to each child top */}
              {g.children.map(c => (
                <path key={`uc-${g.u.id}-${c.id}`} d={`M${c.tx},${g.rail!.y} V${c.ty}`} stroke={COLORS.link} strokeWidth={EDGE_W}
                      fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              ))}
            </>
          )}
        </Fragment>
      ))}

      {/* ===== SINGLE-PARENT GROUPS ===== */}
      {Array.from(singleParentGroups.values()).map(sp => {
        const parentBottom = bottomPort(sp.parentRect);
        return (
          <g key={`sp-${sp.parentId}-${sp.railY}`}>
            {/* parent vertical to rail */}
            <path d={`M${parentBottom.x},${parentBottom.y} V${sp.railY}`} stroke={COLORS.strong} strokeWidth={EDGE_W}
                  fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            {/* rail */}
            <path d={`M${sp.x1},${sp.railY} L${sp.x2},${sp.railY}`} stroke={COLORS.link} strokeWidth={EDGE_W}
                  fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            {/* children verticals */}
            {sp.kids.map(k => (
              <path key={`spc-${sp.parentId}-${k.id}`} d={`M${k.tx},${sp.railY} V${k.ty}`} stroke={COLORS.link} strokeWidth={EDGE_W}
                    fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            ))}
          </g>
        );
      })}
    </g>
  );
}