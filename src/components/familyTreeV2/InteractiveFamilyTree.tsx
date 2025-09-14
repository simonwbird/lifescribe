import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { FamilyGraph, Person, Relationship } from "../../lib/familyTreeV2Types";
import { buildGraph, layoutGraph } from "../../lib/familyTreeLayoutEngine";
import { DraggablePersonCard } from "./DraggablePersonCard";
import DynamicConnections from "./DynamicConnections";
import { GridOverlay } from "./GridOverlay";
import { Button } from "@/components/ui/button";
import { Grid3X3, Eye, EyeOff } from "lucide-react";

const BG: React.CSSProperties = {
  background: "#3B3C41",
  backgroundImage:
    "radial-gradient(rgba(255,255,255,.04) 1px, transparent 1px), radial-gradient(rgba(255,255,255,.04) 1px, transparent 1px)",
  backgroundSize: "24px 24px, 24px 24px",
  backgroundPosition: "0 0, 12px 12px",
};

interface InteractiveFamilyTreeProps {
  people: Person[];
  relationships: Relationship[];
  focusPersonId: string;
  showCaptions?: boolean;
  onAddRequested?: (type: 'parent'|'sibling'|'child'|'spouse', personId: string) => void;
}

export default function InteractiveFamilyTree({
  people, relationships, focusPersonId, showCaptions = false, onAddRequested,
}: InteractiveFamilyTreeProps) {
  const graph: FamilyGraph = useMemo(() => buildGraph(people, relationships, focusPersonId), [people, relationships, focusPersonId]);
  const initialLayout = useMemo(() => layoutGraph(graph, focusPersonId), [graph, focusPersonId]);
  
  // State for interactive positions
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [draggingPersonId, setDraggingPersonId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize] = useState(30);
  const [bounds, setBounds] = useState({ width: 1600, height: 1200 });
  
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Initialize positions from layout
  useEffect(() => {
    const newPositions = new Map<string, { x: number; y: number }>();
    Array.from(initialLayout.rects.values()).forEach(rect => {
      newPositions.set(rect.id, { x: rect.x, y: rect.y });
    });
    setPositions(newPositions);
    
    // Update bounds based on layout
    setBounds({
      width: Math.max(initialLayout.bounds.width, 1600),
      height: Math.max(initialLayout.bounds.height, 1200)
    });
  }, [initialLayout]);

  // Set up SVG viewBox
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    
    const PADDING = 80;
    const viewW = bounds.width + PADDING * 2;
    const viewH = bounds.height + PADDING * 2;
    const startX = -PADDING;
    const startY = -PADDING;
    
    svg.setAttribute("viewBox", `${startX} ${startY} ${viewW} ${viewH}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  }, [bounds]);

  const handleDrag = useCallback((personId: string, x: number, y: number) => {
    setPositions(prev => {
      const newPositions = new Map(prev);
      newPositions.set(personId, { x, y });
      return newPositions;
    });
  }, []);

  const handleDragStart = useCallback((personId: string) => {
    setDraggingPersonId(personId);
  }, []);

  const handleDragEnd = useCallback((personId: string, x: number, y: number) => {
    setDraggingPersonId(null);
    setPositions(prev => {
      const newPositions = new Map(prev);
      newPositions.set(personId, { x, y });
      return newPositions;
    });
    
    // Update bounds if necessary
    setBounds(prev => ({
      width: Math.max(prev.width, x + 200),
      height: Math.max(prev.height, y + 250)
    }));
  }, []);

  const resetLayout = () => {
    const newPositions = new Map<string, { x: number; y: number }>();
    Array.from(initialLayout.rects.values()).forEach(rect => {
      newPositions.set(rect.id, { x: rect.x, y: rect.y });
    });
    setPositions(newPositions);
    setBounds({
      width: Math.max(initialLayout.bounds.width, 1600),
      height: Math.max(initialLayout.bounds.height, 1200)
    });
  };

  return (
    <div className="relative w-full h-full">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowGrid(!showGrid)}
          className="bg-white/90 backdrop-blur-sm"
        >
          {showGrid ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showGrid ? 'Hide Grid' : 'Show Grid'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={resetLayout}
          className="bg-white/90 backdrop-blur-sm"
        >
          <Grid3X3 className="h-4 w-4 mr-2" />
          Reset Layout
        </Button>
      </div>

      {/* Main SVG */}
      <div style={{ width: "100%", height: "100%", ...BG }}>
        <svg 
          ref={svgRef} 
          width="100%" 
          height="100%" 
          role="img" 
          aria-label="Interactive family tree"
          style={{ cursor: draggingPersonId ? 'grabbing' : 'default' }}
        >
          <defs>
            <filter id="feCardShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="black" floodOpacity="0.20" />
            </filter>
          </defs>

          {/* Grid overlay */}
          <GridOverlay 
            width={bounds.width} 
            height={bounds.height} 
            gridSize={gridSize} 
            showGrid={showGrid} 
          />

          {/* Dynamic connections */}
          <DynamicConnections graph={graph} positions={positions} />

          {/* Draggable person cards */}
          <g>
            {Array.from(positions.entries()).map(([personId, pos]) => {
              const person = graph.peopleById.get(personId);
              if (!person) return null;

              const rect = {
                id: personId,
                x: pos.x,
                y: pos.y,
                w: 140,
                h: 180,
                depth: 0
              };

              return (
                <DraggablePersonCard
                  key={personId}
                  rect={rect}
                  person={person}
                  onAddRequested={onAddRequested}
                  graph={graph}
                  onDrag={handleDrag}
                  onDragEnd={handleDragEnd}
                  gridSize={gridSize}
                  isDragging={draggingPersonId === personId}
                />
              );
            })}
          </g>
        </svg>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-sm text-gray-600 max-w-xs">
        <p><strong>Interactive Family Tree</strong></p>
        <p>• Drag any person to reposition them</p>
        <p>• Cards snap to an invisible grid</p>
        <p>• Connections update automatically</p>
        <p>• Click persons to view their profile</p>
      </div>
    </div>
  );
}