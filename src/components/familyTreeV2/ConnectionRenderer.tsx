// src/components/familyTreeV2/ConnectionRenderer.tsx
import React from "react";
import { FamilyGraph, TreeLayout } from "../../lib/familyTreeV2Types";
import {
  BAR_W, EDGE_W, STEM_LEN, COLORS,
  topPort, bottomPort, unionBar, pathUnionToChild, pathParentToChild
} from "./AncestryConnectors";

export default function ConnectionRenderer({ graph, layout }: { graph: FamilyGraph; layout: TreeLayout }) {
  return (
    <g>
      {layout.unions.map(u => {
        const a = layout.rects.get(u.a)!;
        const b = layout.rects.get(u.b)!;
        const rowY = layout.rows.get(u.depth)!;
        const { x1, x2, y, ax, bx, xm } = unionBar(a, b, rowY);

        return (
          <g key={`u-${u.id}`}>
            {/* stems */}
            <path d={`M${ax},${y - STEM_LEN} V${y}`} stroke={COLORS.strong} strokeWidth={EDGE_W}
                  fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <path d={`M${bx},${y - STEM_LEN} V${y}`} stroke={COLORS.strong} strokeWidth={EDGE_W}
                  fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            {/* bar */}
            <path d={`M${x1},${y} L${x2},${y}`} stroke={COLORS.strong} strokeWidth={BAR_W}
                  fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            {/* children */}
            {u.children.map(cid => {
              const c = layout.rects.get(cid);
              if (!c) return null;
              const tp = topPort(c);
              const d = pathUnionToChild(xm, y, tp);
              return <path key={`uc-${u.id}-${cid}`} d={d} stroke={COLORS.link} strokeWidth={EDGE_W}
                           fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />;
            })}
          </g>
        );
      })}

      {/* Single-parent edges (child not in any union) */}
      {Array.from(layout.rects.values()).map(r => {
        const viaUnion = new Set<string>();
        for (const u of layout.unions) if (u.children.length && (u.a === r.id || u.b === r.id)) u.children.forEach(id => viaUnion.add(id));
        return (graph.childrenOf.get(r.id) ?? []).map(cid => {
          if (viaUnion.has(cid)) return null;
          const c = layout.rects.get(cid); if (!c) return null;
          const d = pathParentToChild(bottomPort(r), topPort(c));
          return <path key={`pc-${r.id}-${cid}`} d={d} stroke={COLORS.link} strokeWidth={EDGE_W}
                       fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />;
        });
      })}
    </g>
  );
}