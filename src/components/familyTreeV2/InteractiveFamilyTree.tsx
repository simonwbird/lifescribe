import { useEffect, useMemo, useRef, useState, useCallback, memo } from "react";
import { FamilyGraph, Person, Relationship } from "../../lib/familyTreeV2Types";
import { buildGraph, layoutGraph } from "../../lib/familyTreeLayoutEngine";
import { DraggablePersonCard } from "./DraggablePersonCard";
import DynamicConnections from "./DynamicConnections";
import { GridOverlay } from "./GridOverlay";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Grid3X3, Eye, EyeOff, Plus, Minus, RotateCcw, History, Undo } from "lucide-react";
import { FamilyTreeService } from "../../lib/familyTreeV2Service";
import { supabase } from "../../integrations/supabase/client";
import { toast } from "sonner";

const BG: React.CSSProperties = {
  background: "#3B3C41",
  backgroundImage:
    "radial-gradient(rgba(255,255,255,.04) 1px, transparent 1px), radial-gradient(rgba(255,255,255,.04) 1px, transparent 1px)",
  backgroundSize: "24px 24px, 24px 24px",
  backgroundPosition: "0 0, 12px 12px",
};

interface InteractiveFamilyTreeProps {
  people: Person[];
  relationships: Relationship[]; // Use internal relationship type
  focusPersonId: string;
  showCaptions?: boolean;
  onAddRequested?: (type: 'parent'|'sibling'|'child'|'spouse', personId: string) => void;
  familyId?: string; // Add family ID for saving positions
}

const InteractiveFamilyTree = memo(function InteractiveFamilyTree({
  people, relationships, focusPersonId, showCaptions = false, onAddRequested, familyId,
}: InteractiveFamilyTreeProps) {
  const graph: FamilyGraph = useMemo(() => buildGraph(people, relationships, focusPersonId), [people, relationships, focusPersonId]);
  const initialLayout = useMemo(() => layoutGraph(graph, focusPersonId), [graph, focusPersonId]);
  
  // State for interactive positions
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [draggingPersonId, setDraggingPersonId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize] = useState(30);
  const [bounds, setBounds] = useState({ width: 1600, height: 1200 });
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Version history state
  const [versionHistory, setVersionHistory] = useState<Array<{
    id: string;
    name: string;
    timestamp: Date;
    positions: Map<string, { x: number; y: number }>;
  }>>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState<number>(-1);
  
  // Instructions panel dragging state
  const [instructionsPos, setInstructionsPos] = useState({ x: 0, y: 0 });
  const [isDraggingInstructions, setIsDraggingInstructions] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Get current user for position saving
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  // Load saved positions and merge with layout positions
  const loadPositions = useCallback(async () => {
    if (!familyId || !currentUser?.id) return;
    
    try {
      const savedPositions = await FamilyTreeService.loadPersonPositions(familyId, currentUser.id);
      
      // Start with layout positions
      const newPositions = new Map<string, { x: number; y: number }>();
      Array.from(initialLayout.rects.values()).forEach(rect => {
        // Use saved position if available, otherwise use layout position
        const savedPos = savedPositions.get(rect.id);
        newPositions.set(rect.id, savedPos || { x: rect.x, y: rect.y });
      });
      
      setPositions(newPositions);
    } catch (error) {
      console.error('Failed to load saved positions:', error);
      // Fallback to layout positions
      const fallbackPositions = new Map<string, { x: number; y: number }>();
      Array.from(initialLayout.rects.values()).forEach(rect => {
        fallbackPositions.set(rect.id, { x: rect.x, y: rect.y });
      });
      setPositions(fallbackPositions);
    }
  }, [initialLayout, familyId, currentUser?.id]);

  // Initialize positions from layout and saved positions
  useEffect(() => {
    loadPositions();
    
    // Update bounds based on layout
    setBounds({
      width: Math.max(initialLayout.bounds.width, 1600),
      height: Math.max(initialLayout.bounds.height, 1200)
    });
  }, [loadPositions, initialLayout]);

  // Set up SVG viewBox with zoom and pan
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    
    const PADDING = 80;
    const viewW = (bounds.width + PADDING * 2) / zoom;
    const viewH = (bounds.height + PADDING * 2) / zoom;
    const startX = -PADDING / zoom + panX;
    const startY = -PADDING / zoom + panY;
    
    svg.setAttribute("viewBox", `${startX} ${startY} ${viewW} ${viewH}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  }, [bounds, zoom, panX, panY]);

  const handleDrag = useCallback((personId: string, x: number, y: number) => {
    setPositions(prev => {
      const newPositions = new Map(prev);
      newPositions.set(personId, { x, y });
      return newPositions;
    });
    // Expand bounds during drag so you can move beyond current viewport
    setBounds(prev => ({
      width: Math.max(prev.width, x + 200),
      height: Math.max(prev.height, y + 250)
    }));
  }, []);

  const handleDragStart = useCallback((personId: string) => {
    setDraggingPersonId(personId);
  }, []);

  const handleDragEnd = useCallback(async (personId: string, x: number, y: number) => {
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

    // Auto-save version after drag
    const versionName = `Auto-save ${new Date().toLocaleTimeString()}`;
    const newVersion = {
      id: Date.now().toString(),
      name: versionName,
      timestamp: new Date(),
      positions: new Map(positions)
    };
    
    setVersionHistory(prev => {
      const updated = [...prev, newVersion];
      // Keep only last 10 versions to avoid clutter
      return updated.slice(-10);
    });

    // Save position to database
    if (familyId && currentUser?.id) {
      try {
        await FamilyTreeService.savePersonPosition(familyId, currentUser.id, personId, x, y);
      } catch (error) {
        console.error('Failed to save position:', error);
        toast.error('Failed to save position');
      }
    }
  }, [familyId, currentUser?.id, positions]);

  const saveCurrentVersion = useCallback(() => {
    const versionName = `Version ${versionHistory.length + 1}`;
    const newVersion = {
      id: Date.now().toString(),
      name: versionName,
      timestamp: new Date(),
      positions: new Map(positions)
    };
    
    setVersionHistory(prev => [...prev, newVersion]);
    setCurrentVersionIndex(versionHistory.length);
    toast.success(`Saved ${versionName}`);
  }, [positions, versionHistory.length]);

  const restoreVersion = useCallback((versionIndex: number) => {
    if (versionIndex >= 0 && versionIndex < versionHistory.length) {
      const version = versionHistory[versionIndex];
      setPositions(new Map(version.positions));
      setCurrentVersionIndex(versionIndex);
      toast.success(`Restored to ${version.name}`);
    }
  }, [versionHistory]);

  const undoLastChange = useCallback(() => {
    if (versionHistory.length > 0) {
      const lastVersionIndex = versionHistory.length - 1;
      restoreVersion(lastVersionIndex);
    } else {
      // If no versions saved, reset to original layout
      const newPositions = new Map<string, { x: number; y: number }>();
      Array.from(initialLayout.rects.values()).forEach(rect => {
        newPositions.set(rect.id, { x: rect.x, y: rect.y });
      });
      setPositions(newPositions);
      setBounds({
        width: Math.max(initialLayout.bounds.width, 1600),
        height: Math.max(initialLayout.bounds.height, 1200)
      });
      setZoom(1);
      setPanX(0);
      setPanY(0);
    }
  }, [versionHistory.length, restoreVersion, initialLayout]);

  const resetLayout = async () => {
    const newPositions = new Map<string, { x: number; y: number }>();
    Array.from(initialLayout.rects.values()).forEach(rect => {
      newPositions.set(rect.id, { x: rect.x, y: rect.y });
    });
    setPositions(newPositions);
    setBounds({
      width: Math.max(initialLayout.bounds.width, 1600),
      height: Math.max(initialLayout.bounds.height, 1200)
    });
    // Reset zoom and pan
    setZoom(1);
    setPanX(0);
    setPanY(0);

    // Clear saved positions from database
    if (familyId && currentUser?.id) {
      try {
        await FamilyTreeService.clearPersonPositions(familyId, currentUser.id);
        toast.success('Layout reset and saved positions cleared');
      } catch (error) {
        console.error('Failed to clear saved positions:', error);
        toast.error('Failed to clear saved positions');
      }
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3)); // Max zoom 3x
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.2)); // Min zoom 0.2x
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  // Instructions panel drag handlers
  const handleInstructionsMouseDown = (e: React.MouseEvent) => {
    setIsDraggingInstructions(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleInstructionsMouseMove = (e: MouseEvent) => {
    if (!isDraggingInstructions) return;
    
    const container = e.target as Element;
    const containerRect = container.closest('.relative')?.getBoundingClientRect();
    if (!containerRect) return;
    
    setInstructionsPos({
      x: e.clientX - containerRect.left - dragOffset.x,
      y: e.clientY - containerRect.top - dragOffset.y
    });
  };

  const handleInstructionsMouseUp = () => {
    setIsDraggingInstructions(false);
  };

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDraggingInstructions) {
      document.addEventListener('mousemove', handleInstructionsMouseMove);
      document.addEventListener('mouseup', handleInstructionsMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleInstructionsMouseMove);
        document.removeEventListener('mouseup', handleInstructionsMouseUp);
      };
    }
  }, [isDraggingInstructions, dragOffset]);

  return (
    <div className="relative w-full h-full">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {/* Zoom Controls */}
        <div className="flex gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="h-8 w-8 p-0"
            title="Zoom Out"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="flex items-center px-2 text-sm font-medium min-w-[3rem] justify-center">
            {Math.round(zoom * 100)}%
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="h-8 w-8 p-0"
            title="Zoom In"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetZoom}
            className="h-8 w-8 p-0"
            title="Reset Zoom"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
        
        {/* Other Controls */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowGrid(!showGrid)}
          className="bg-white/90 backdrop-blur-sm"
        >
          {showGrid ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showGrid ? 'Hide Grid' : 'Show Grid'}
        </Button>
        
        {/* Version History Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm"
            >
              <History className="h-4 w-4 mr-2" />
              Tree Versions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white/95 backdrop-blur-sm z-50">
            <DropdownMenuItem onClick={saveCurrentVersion}>
              Save Current Version
            </DropdownMenuItem>
            <DropdownMenuItem onClick={resetLayout}>
              <Grid3X3 className="h-4 w-4 mr-2" />
              Reset to Original
            </DropdownMenuItem>
            {versionHistory.length > 0 && (
              <>
                <div className="border-t my-1" />
                {versionHistory.map((version, index) => (
                  <DropdownMenuItem
                    key={version.id}
                    onClick={() => restoreVersion(index)}
                    className={currentVersionIndex === index ? "bg-accent" : ""}
                  >
                    <span className="flex-1">{version.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {version.timestamp.toLocaleTimeString()}
                    </span>
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Undo Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={undoLastChange}
          className="bg-white/90 backdrop-blur-sm"
          title="Undo last change"
        >
          <Undo className="h-4 w-4" />
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
                  positions={positions}
                />
              );
            })}
          </g>
        </svg>
      </div>

      {/* Instructions Panel - Now draggable */}
      <div 
        className="absolute bg-white/90 backdrop-blur-sm rounded-lg p-3 text-sm text-gray-600 max-w-xs cursor-move select-none shadow-lg"
        style={{
          bottom: instructionsPos.y === 0 ? '16px' : 'auto',
          right: instructionsPos.y === 0 ? '16px' : 'auto',
          left: instructionsPos.x || (instructionsPos.y === 0 ? 'auto' : '16px'),
          top: instructionsPos.y || 'auto',
          transform: instructionsPos.x || instructionsPos.y ? `translate(${instructionsPos.x}px, ${instructionsPos.y}px)` : 'none'
        }}
        onMouseDown={handleInstructionsMouseDown}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <p className="font-semibold">Interactive Family Tree</p>
        </div>
        <p>• Drag any person to reposition them</p>
        <p>• Use zoom controls (+/-) to get closer or see more</p>
        <p>• Cards snap to an invisible grid (hold Shift or Alt to disable)</p>
        <p>• Connections update automatically</p>
        <p>• Click persons to view their profile</p>
      </div>
    </div>
  );
});

export default InteractiveFamilyTree;