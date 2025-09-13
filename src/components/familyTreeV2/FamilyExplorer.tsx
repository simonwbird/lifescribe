import React, { useEffect, useMemo, useRef } from "react";
import { FamilyGraph, Person, Relationship } from "../../lib/familyTreeV2Types";
import { buildGraph, layoutGraph } from "../../lib/familyTreeLayoutEngine";
import { PersonCard } from "./PersonCard";
import ConnectionRenderer from "./ConnectionRenderer";

const BG: React.CSSProperties = {
  background: "#3B3C41",
  backgroundImage:
    "radial-gradient(rgba(255,255,255,.04) 1px, transparent 1px), radial-gradient(rgba(255,255,255,.04) 1px, transparent 1px)",
  backgroundSize: "24px 24px, 24px 24px",
  backgroundPosition: "0 0, 12px 12px",
};

function DebugHUD({ people, relationships, graph, layout, focusId }:{
  people:any[], relationships:any[], graph:any, layout:any, focusId:string
}){
  const ids = new Set(people.map((p:any)=>String(p.id)));
  const bad = relationships.filter((r:any)=>{
    if (r.type==='parent') return !ids.has(String(r.parent_id)) || !ids.has(String(r.child_id));
    return !ids.has(String(r.a)) || !ids.has(String(r.b));
  });
  const line = `people:${people.length}  rects:${layout.rects.size}  rels:${relationships.length}  unions:${layout.unions.length}  focusOk:${ids.has(String(focusId))}  badRels:${bad.length}`;
  return (
    <g>
      <rect x={16} y={16} width={760} height={40} rx={8} fill="rgba(0,0,0,.55)"/>
      <text x={28} y={42} fontFamily="ui-monospace, SFMono-Regular" fontSize="13" fill="#fff">{line}</text>
    </g>
  );
}

export default function FamilyExplorer({
  people, relationships, focusPersonId, showCaptions = true,
}:{
  people: Person[];
  relationships: Relationship[];
  focusPersonId: string;
  showCaptions?: boolean;
}) {
  const graph: FamilyGraph = useMemo(()=>buildGraph(people, relationships, focusPersonId),[people,relationships,focusPersonId]);
  const layout = useMemo(()=>layoutGraph(graph, focusPersonId),[graph,focusPersonId]);

  const svgRef = useRef<SVGSVGElement|null>(null);
  useEffect(()=>{ const svg=svgRef.current; if(!svg) return; svg.setAttribute("viewBox",`0 0 ${layout.bounds.width} ${layout.bounds.height}`); },[layout.bounds]);

  const font = 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial';
  const captions = showCaptions ? (() => {
    const map = new Map<number,string>([
      [3,"Simon's great-grandparents"],
      [2,"Simon's grandparents"],
      [1,"Simon's parents"],
      [0,"Simon's siblings"],
      [-1,"Simon's children"],
    ]);
    return Array.from(layout.rows.entries()).map(([depth,rowY])=>{
      const label = map.get(depth); if(!label) return null;
      return (
        <text key={`cap-${depth}`} x={layout.bounds.width/2} y={rowY + 208 + 34}
              style={{fontFamily:font,fontSize:12,fontWeight:600,fill:"rgba(255,255,255,.85)"}}
              textAnchor="middle">{label}</text>
      );
    });
  })() : null;

  return (
    <div style={{ width:"100%", height:"100%", ...BG }}>
      <svg ref={svgRef} width="100%" height="100%" role="img" aria-label="Family tree">
        <defs>
          <filter id="feCardShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="black" floodOpacity="0.20" />
          </filter>
        </defs>

        {/* edges behind cards */}
        <ConnectionRenderer graph={graph} layout={layout} />
        {/* cards */}
        <g>{Array.from(layout.rects.values()).map(r => <PersonCard key={r.id} rect={r} person={graph.peopleById.get(r.id)!} />)}</g>
        {/* captions */}
        <g>{captions}</g>
        {/* debug HUD - leave on until IDs are verified */}
        <DebugHUD people={people} relationships={relationships} graph={graph} layout={layout} focusId={focusPersonId}/>
      </svg>
    </div>
  );
}