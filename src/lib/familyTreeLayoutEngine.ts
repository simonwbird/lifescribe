// src/lib/familyTreeLayoutEngine.ts
import { FamilyGraph, Person, Relationship, TreeLayout, NodeRect, Union } from "./familyTreeV2Types";
import { CARD_W, CARD_H } from "../components/familyTreeV2/PersonCard";
import { ROW_HEIGHT, SIB_GAP, SPOUSE_GAP, unionYForRow } from "../components/familyTreeV2/AncestryConnectors";

export function buildGraph(people: Person[], rels: Relationship[], focusId: string): FamilyGraph {
  const peopleById = new Map(people.map(p => [p.id, p]));
  const childrenOf = new Map<string, string[]>();
  const parentsOf  = new Map<string, string[]>();
  const spouses    = new Map<string, Set<string>>();

  for (const r of rels) {
    if (r.type === "parent") {
      (childrenOf.get(r.parent_id!) ?? childrenOf.set(r.parent_id!, []).get(r.parent_id!)!) .push(r.child_id!);
      (parentsOf.get(r.child_id!)  ?? parentsOf.set(r.child_id!,  []).get(r.child_id!)!)  .push(r.parent_id!);
    } else {
      (spouses.get(r.a!) ?? spouses.set(r.a!, new Set()).get(r.a!)!).add(r.b!);
      (spouses.get(r.b!) ?? spouses.set(r.b!, new Set()).get(r.b!)!).add(r.a!);
    }
  }

  // Depth: siblings=0, parents=+1, children=-1, spouses=same
  const depth = new Map<string, number>();
  const q: { id: string; d: number }[] = [{ id: focusId, d: 0 }];
  depth.set(focusId, 0);
  while (q.length) {
    const { id, d } = q.shift()!;
    for (const p of (parentsOf.get(id)   ?? [])) if (!depth.has(p)) depth.set(p, d + 1), q.push({ id: p, d: d + 1 });
    for (const c of (childrenOf.get(id)  ?? [])) if (!depth.has(c)) depth.set(c, d - 1), q.push({ id: c, d: d - 1 });
    for (const s of (spouses.get(id)     ?? [])) if (!depth.has(s)) depth.set(s, d),     q.push({ id: s, d });
    for (const p of (parentsOf.get(id)   ?? []))
      for (const sib of (childrenOf.get(p) ?? [])) if (!depth.has(sib)) depth.set(sib, d), q.push({ id: sib, d });
  }

  // Couples: from shared children + explicit spouse links (childless)
  const couples = new Map<string, { a: string; b: string; children: string[] }>();
  for (const [child, ps] of parentsOf) if (ps.length === 2) {
    const [a, b] = ps[0] < ps[1] ? [ps[0], ps[1]] : [ps[1], ps[0]];
    const key = `${a}::${b}`;
    (couples.get(key) ?? couples.set(key, { a, b, children: [] }).get(key)!).children.push(child);
  }
  for (const [a, set] of spouses) for (const b of set) {
    const [x, y] = a < b ? [a, b] : [b, a];
    const key = `${x}::${y}`;
    if (!couples.has(key)) couples.set(key, { a: x, b: y, children: [] });
  }

  const unions: Union[] = [];
  let i = 0;
  couples.forEach(({ a, b, children }) =>
    unions.push({ id: `U${i++}`, a, b, children, depth: Math.round(((depth.get(a) ?? 0) + (depth.get(b) ?? 0)) / 2), y: 0 })
  );

  return { peopleById, childrenOf, parentsOf, spouses, unions };
}

export function layoutGraph(g: FamilyGraph, focusId: string): TreeLayout {
  // Group by depth
  const groups = new Map<number, string[]>();
  const dep = new Map<string, number>();
  const seen = new Set<string>();
  const q: { id: string; d: number }[] = [{ id: focusId, d: 0 }];
  seen.add(focusId); dep.set(focusId, 0);
  while (q.length) {
    const { id, d } = q.shift()!;
    (groups.get(d) ?? groups.set(d, []).get(d)!).push(id);
    for (const p of (g.parentsOf.get(id)  ?? [])) if (!seen.has(p)) seen.add(p), dep.set(p, d + 1), q.push({ id: p, d: d + 1 });
    for (const c of (g.childrenOf.get(id) ?? [])) if (!seen.has(c)) seen.add(c), dep.set(c, d - 1), q.push({ id: c, d: d - 1 });
    for (const s of (g.spouses.get(id)    ?? [])) if (!seen.has(s)) seen.add(s), dep.set(s, d),     q.push({ id: s, d });
    for (const p of (g.parentsOf.get(id)  ?? []))
      for (const sib of (g.childrenOf.get(p) ?? [])) if (!seen.has(sib)) seen.add(sib), dep.set(sib, d), q.push({ id: sib, d });
  }

  // Rows top-down
  const depths = Array.from(groups.keys()).sort((a, b) => b - a);
  const rows = new Map<number, number>();
  let y = 40;
  for (const d of depths) rows.set(d, y), y += ROW_HEIGHT;

  const rects = new Map<string, NodeRect>();
  const centerX = 800;

  // Place each row as spouse clusters
  for (const d of depths) {
    const ids = groups.get(d) ?? [];
    const clusters: string[][] = [];
    const used = new Set<string>();
    for (const id of ids) {
      if (used.has(id)) continue;
      const partner = Array.from(g.spouses.get(id) ?? []).find(p => (dep.get(p) ?? -999) === d);
      if (partner && !used.has(partner)) clusters.push([id, partner].sort()), used.add(id), used.add(partner);
      else clusters.push([id]), used.add(id);
    }
    const cW = (c: string[]) => (c.length === 2 ? CARD_W * 2 + SPOUSE_GAP : CARD_W);
    const total = clusters.reduce((acc, c, i) => acc + cW(c) + (i ? SIB_GAP : 0), 0);
    let x = Math.round(centerX - total / 2);
    const rowY = rows.get(d)!;

    for (const c of clusters) {
      if (c.length === 2) {
        const [a, b] = c;
        rects.set(a, { id: a, x, y: rowY, w: CARD_W, h: CARD_H, depth: d });
        rects.set(b, { id: b, x: x + CARD_W + SPOUSE_GAP, y: rowY, w: CARD_W, h: CARD_H, depth: d });
        x += cW(c) + SIB_GAP;
      } else {
        rects.set(c[0], { id: c[0], x, y: rowY, w: CARD_W, h: CARD_H, depth: d });
        x += CARD_W + SIB_GAP;
      }
    }
  }

  // Local reflow: children under union midpoint
  for (const u of g.unions) {
    const a = rects.get(u.a), b = rects.get(u.b);
    if (!a || !b) continue;
    const xm = Math.round((a.x + CARD_W / 2 + b.x + CARD_W / 2) / 2);
    const cd = u.depth - 1;
    const rowY = rows.get(cd); if (!rowY) continue;
    const kids = u.children.filter(id => rects.get(id)?.depth === cd);
    if (!kids.length) continue;
    const total = kids.length * CARD_W + (kids.length - 1) * SIB_GAP;
    let x = Math.round(xm - total / 2);
    for (const id of kids) { const r = rects.get(id)!; r.x = x; r.y = rowY; x += CARD_W + SIB_GAP; }
  }

  // Fill union Y
  const unions = g.unions.map(u => ({ ...u, y: unionYForRow(rows.get(u.depth)!) }));

  // Bounds & normalize
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  rects.forEach(r => { minX = Math.min(minX, r.x); minY = Math.min(minY, r.y); maxX = Math.max(maxX, r.x + CARD_W); maxY = Math.max(maxY, r.y + CARD_H); });
  const P = 40, dx = P - minX, dy = P - minY;
  rects.forEach(r => { r.x += dx; r.y += dy; });
  const rowsShift = new Map<number, number>(); rows.forEach((yy, d) => rowsShift.set(d, yy + dy));
  return { rects, unions: unions.map(u => ({ ...u, y: u.y + dy })), rows: rowsShift,
           bounds: { width: Math.round(maxX - minX + P * 2), height: Math.round(maxY - minY + P * 2) } };
}