import { FamilyGraph, Person, Relationship, TreeLayout, NodeRect, Union } from "./familyTreeV2Types";
import { CARD_W, CARD_H } from "../components/familyTreeV2/PersonCard";
import { ROW_HEIGHT, SIB_GAP, SPOUSE_GAP, unionYForRow } from "../components/familyTreeV2/AncestryConnectors";

/** Build graph with depth, unions (shared-children + explicit childless spouses) */
export function buildGraph(people: Person[], rels: Relationship[], focusId: string): FamilyGraph {
  const peopleById = new Map(people.map(p => [p.id, p]));
  const childrenOf = new Map<string, string[]>();
  const parentsOf  = new Map<string, string[]>();
  const spouses    = new Map<string, Set<string>>();
  const divorced   = new Map<string, Set<string>>();

  for (const r of rels) {
    if (r.type === "parent") {
      if (!childrenOf.has(r.parent_id)) childrenOf.set(r.parent_id, []);
      childrenOf.get(r.parent_id)!.push(r.child_id);
      if (!parentsOf.has(r.child_id)) parentsOf.set(r.child_id, []);
      parentsOf.get(r.child_id)!.push(r.parent_id);
    } else if (r.type === "spouse") {
      if (!spouses.has(r.a)) spouses.set(r.a, new Set());
      if (!spouses.has(r.b)) spouses.set(r.b, new Set());
      spouses.get(r.a)!.add(r.b);
      spouses.get(r.b)!.add(r.a);
    } else if (r.type === "divorced") {
      if (!divorced.has(r.a)) divorced.set(r.a, new Set());
      if (!divorced.has(r.b)) divorced.set(r.b, new Set());
      divorced.get(r.a)!.add(r.b);
      divorced.get(r.b)!.add(r.a);
    }
  }

  // Depth BFS
  const depth = new Map<string, number>();
  const q: {id:string; d:number}[] = [{ id: focusId, d: 0 }];
  depth.set(focusId, 0);
  while (q.length) {
    const { id, d } = q.shift()!;
    for (const p of (parentsOf.get(id) ?? [])) if (!depth.has(p)) depth.set(p, d+1), q.push({ id:p, d:d+1 });
    for (const c of (childrenOf.get(id) ?? [])) if (!depth.has(c)) depth.set(c, d-1), q.push({ id:c, d:d-1 });
    for (const s of (spouses.get(id) ?? [])) if (!depth.has(s)) depth.set(s, d),   q.push({ id:s, d });
    for (const p of (parentsOf.get(id) ?? []))
      for (const sib of (childrenOf.get(p) ?? [])) if (!depth.has(sib)) depth.set(sib, d), q.push({ id:sib, d });
  }

  // Couples: shared-children unions
  const couples = new Map<string, { a:string; b:string; children:string[] }>();
  for (const [child, ps] of parentsOf) if (ps.length === 2) {
    const [a,b] = ps[0] < ps[1] ? [ps[0], ps[1]] : [ps[1], ps[0]];
    const key = `${a}::${b}`;
    if (!couples.has(key)) couples.set(key, { a, b, children: [] });
    couples.get(key)!.children.push(child);
  }
  // Explicit childless spouses and divorced couples
  for (const [a,set] of spouses) for (const b of set) {
    const [x,y] = a < b ? [a,b] : [b,a];
    const key = `${x}::${y}`;
    if (!couples.has(key)) couples.set(key, { a:x, b:y, children: [] });
  }
  for (const [a,set] of divorced) for (const b of set) {
    const [x,y] = a < b ? [a,b] : [b,a];
    const key = `${x}::${y}`;
    if (!couples.has(key)) couples.set(key, { a:x, b:y, children: [] });
  }

  const unions: Union[] = [];
  let i=0;
  couples.forEach(({a,b,children}) => {
    const d = Math.round(((depth.get(a) ?? 0) + (depth.get(b) ?? 0)) / 2);
    unions.push({ id:`U${i++}`, a, b, children, depth:d, y:0 });
  });

  return { peopleById, childrenOf, parentsOf, spouses, divorced, unions };
}

/** Strict generational rows; spouse clusters; children centered under union midpoint */
export function layoutGraph(g: FamilyGraph, focusId: string): TreeLayout {
  const groups = new Map<number, string[]>();
  const dep = new Map<string, number>();
  const seen = new Set<string>();
  const q: {id:string; d:number}[] = [{ id: focusId, d: 0 }];
  seen.add(focusId); dep.set(focusId, 0);
  while (q.length) {
    const { id, d } = q.shift()!;
    (groups.get(d) ?? groups.set(d, []).get(d)!).push(id);
    for (const p of (g.parentsOf.get(id)  ?? [])) if (!seen.has(p)) seen.add(p), dep.set(p, d+1), q.push({ id:p, d:d+1 });
    for (const c of (g.childrenOf.get(id) ?? [])) if (!seen.has(c)) seen.add(c), dep.set(c, d-1), q.push({ id:c, d:d-1 });
    for (const s of (g.spouses.get(id)    ?? [])) if (!seen.has(s)) seen.add(s), dep.set(s, d),   q.push({ id:s, d });
    for (const dx of (g.divorced.get(id)   ?? [])) if (!seen.has(dx)) seen.add(dx), dep.set(dx, d),   q.push({ id:dx, d });
    for (const p of (g.parentsOf.get(id)  ?? []))
      for (const sib of (g.childrenOf.get(p) ?? [])) if (!seen.has(sib)) seen.add(sib), dep.set(sib, d), q.push({ id:sib, d });
  }

  const depths = Array.from(groups.keys()).sort((a,b)=>b-a);
  const rows = new Map<number, number>();
  let y = 40; for (const d of depths) rows.set(d, y), y += ROW_HEIGHT;

  const rects = new Map<string, NodeRect>();
  const centerX = 800;

  const getBirthYear = (id: string) => {
    const p = g.peopleById.get(id);
    if (!p?.birth_date) return 9999;
    const s = String(p.birth_date);
    const m = s.match(/\d{4}/);
    return m ? parseInt(m[0], 10) : 9999;
  };

  const isSpousePair = (a: string, b: string, depth: number) =>
    (dep.get(a) === depth && dep.get(b) === depth) &&
    (g.spouses.get(a)?.has(b) || g.spouses.get(b)?.has(a));

  const isDivorcedPair = (a: string, b: string, depth: number) =>
    (dep.get(a) === depth && dep.get(b) === depth) &&
    (g.divorced.get(a)?.has(b) || g.divorced.get(b)?.has(a));

  for (const d of depths) {
    const ids = groups.get(d) ?? [];
    const clusters: string[][] = [];
    const used = new Set<string>();
    for (const id of ids){
      if (used.has(id)) continue;

      // spouse pair cluster - deterministic ordering
      const spouse = Array.from(g.spouses.get(id) ?? []).find(p => (dep.get(p) ?? -999) === d && !used.has(p));
      if (spouse && isSpousePair(id, spouse, d)) {
        const nameOf = (pid: string) => {
          const pp = g.peopleById.get(pid);
          return ((pp?.given_name || "") + " " + (pp?.surname || "")).trim().toLowerCase();
        };
        // Order by birth year (older on left), then by name (alphabetical)
        const [leftId, rightId] = (getBirthYear(id) <= getBirthYear(spouse))
          ? [id, spouse]
          : [spouse, id];
        const ordered = (getBirthYear(id) === getBirthYear(spouse))
          ? (nameOf(id) <= nameOf(spouse) ? [id, spouse] : [spouse, id]) // alphabetical fallback
          : [leftId, rightId];
        clusters.push([ordered[0], ordered[1]]);
        used.add(ordered[0]); used.add(ordered[1]);
        continue;
      }

      // divorced pair cluster - deterministic order: older on the left (fallback by name)
      const ex = Array.from(g.divorced.get(id) ?? []).find(p => (dep.get(p) ?? -999) === d && !used.has(p));
      if (ex && isDivorcedPair(id, ex, d)) {
        const nameOf = (pid: string) => {
          const pp = g.peopleById.get(pid);
          return ((pp?.given_name || "") + " " + (pp?.surname || "")).trim().toLowerCase();
        };
        const [leftId, rightId] = (getBirthYear(id) <= getBirthYear(ex))
          ? [id, ex]
          : [ex, id];
        // If years equal/unknown, use name to keep stability
        const ordered = (getBirthYear(id) === getBirthYear(ex))
          ? (nameOf(id) >= nameOf(ex) ? [id, ex] : [ex, id]) // fallback: name DESC so 'William' comes before 'Bentley'
          : [leftId, rightId];
        clusters.push([ordered[0], ordered[1]]);
        used.add(ordered[0]); used.add(ordered[1]);
        continue;
      }

      // single
      clusters.push([id]);
      used.add(id);
    }

    const DIVORCED_GAP = 120; // pixels between divorced partners
    const cW = (c:string[]) => {
      if (c.length === 2) {
        return isSpousePair(c[0], c[1], d) ? CARD_W*2 + SPOUSE_GAP : CARD_W*2 + DIVORCED_GAP;
      }
      return CARD_W;
    };

    const total = clusters.reduce((acc,c,i)=> acc + cW(c) + (i? SIB_GAP:0), 0);
    let x = Math.round(centerX - total/2);
    const rowY = rows.get(d)!;

    for (const c of clusters){
      if (c.length===2){
        const [a,b] = c;
        if (isSpousePair(a,b,d)) {
          rects.set(a,{id:a,x,y:rowY,w:CARD_W,h:CARD_H,depth:d});
          rects.set(b,{id:b,x:x+CARD_W+SPOUSE_GAP,y:rowY,w:CARD_W,h:CARD_H,depth:d});
          x += CARD_W*2 + SPOUSE_GAP + SIB_GAP;
        } else {
          // divorced pair placement
          rects.set(a,{id:a,x,y:rowY,w:CARD_W,h:CARD_H,depth:d});
          rects.set(b,{id:b,x:x+CARD_W+DIVORCED_GAP,y:rowY,w:CARD_W,h:CARD_H,depth:d});
          x += CARD_W*2 + DIVORCED_GAP + SIB_GAP;
        }
      } else {
        const id = c[0];
        rects.set(id,{id,x,y:rowY,w:CARD_W,h:CARD_H,depth:d});
        x += CARD_W + SIB_GAP;
      }
    }
  }

  // Center children under union midpoint — keep spouse clusters together to avoid overlaps
  for (const u of g.unions) {
    const a = rects.get(u.a), b = rects.get(u.b);
    if (!a || !b) continue;
    const xm = Math.round((a.x + CARD_W/2 + b.x + CARD_W/2)/2);
    const cd = u.depth - 1;
    const rowY = rows.get(cd); if (!rowY) continue;

    // Only children actually placed at this child depth
    const kids = u.children.filter(id => rects.get(id)?.depth === cd);
    if (!kids.length) continue;

    // Build clusters: child alone, or child+same-depth spouse
    const used = new Set<string>();
    const clusters: string[][] = [];
    for (const id of kids) {
      if (used.has(id)) continue;
      const spouseId = Array.from(g.spouses.get(id) ?? [])
        .find(s => rects.get(s)?.depth === cd);
      if (spouseId && !used.has(spouseId)) {
        clusters.push([id, spouseId]);
        used.add(id); used.add(spouseId);
      } else {
        clusters.push([id]);
        used.add(id);
      }
    }

    const cW = (c: string[]) => c.length === 2 ? CARD_W*2 + SPOUSE_GAP : CARD_W;
    const total = clusters.reduce((sum, c, i) => sum + cW(c) + (i ? SIB_GAP : 0), 0);
    let x = Math.round(xm - total/2);

    for (const c of clusters) {
      if (c.length === 2) {
        const [child, spouse] = c;
        const rc = rects.get(child)!; const rs = rects.get(spouse)!;
        rc.x = x; rc.y = rowY;
        rs.x = x + CARD_W + SPOUSE_GAP; rs.y = rowY;
        x += cW(c) + SIB_GAP;
      } else {
        const rc = rects.get(c[0])!; rc.x = x; rc.y = rowY; x += CARD_W + SIB_GAP;
      }
    }
  }

  const unions = g.unions.map(u => ({ ...u, y: unionYForRow(rows.get(u.depth)!) }));

  // Bounds & normalize
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  rects.forEach(r=>{ minX=Math.min(minX,r.x); minY=Math.min(minY,r.y); maxX=Math.max(maxX,r.x+CARD_W); maxY=Math.max(maxY,r.y+CARD_H); });
  const P=40, dx=P-minX, dy=P-minY;
  rects.forEach(r=>{ r.x+=dx; r.y+=dy; });
  const rows2 = new Map<number, number>(); rows.forEach((yy,d)=>rows2.set(d, yy+dy));
  return {
    rects,
    unions: unions.map(u => ({ ...u, y: u.y + dy })),
    rows: rows2,
    bounds: { width: Math.round(maxX-minX + P*2), height: Math.round(maxY-minY + P*2) }
  };
}