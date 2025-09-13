import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Heart,
  Settings
} from 'lucide-react'
import { buildGraph, layoutGraph } from '@/lib/familyTreeLayoutEngine'
import { FamilyTreeService } from '@/lib/familyTreeV2Service'
import type { TreePerson, TreeFamily, TreeFamilyChild, FamilyGraph, TreeLayout, NodeRect } from '@/lib/familyTreeV2Types'
import { QuickAddModal } from './QuickAddModal'
import { PersonDrawer } from './PersonDrawer'
import { PersonCard, CARD_W, CARD_H } from './PersonCard'
import ConnectionRenderer from './ConnectionRenderer'
import { toast } from 'sonner'

interface FamilyExplorerProps {
  familyId: string
  focusPersonId?: string
  onPersonFocus?: (personId: string) => void
}

export const FamilyExplorer: React.FC<FamilyExplorerProps> = ({
  familyId,
  focusPersonId,
  onPersonFocus
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  const [nodes, setNodes] = useState<NodeRect[]>([])
  const [layout, setLayout] = useState<TreeLayout | null>(null)
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickAddContext, setQuickAddContext] = useState<{
    type: 'partner' | 'child' | 'parent'
    targetPersonId: string
  } | null>(null)
  const [autoLayout, setAutoLayout] = useState(true)
  const [generations, setGenerations] = useState(5)

  const [people, setPeople] = useState<TreePerson[]>([])
  const [families, setFamilies] = useState<TreeFamily[]>([])
  const [children, setChildren] = useState<TreeFamilyChild[]>([])
  
  // Make visibleGraph a view filter using useMemo - Generations control is a view filter only
  const visibleGraph = React.useMemo(() => {
    if (!people.length) return { focusPersonId: '', people: [], families: [], children: [] }
    
    const baseGraph = { focusPersonId: focusPersonId || people[0]?.id || '', people, families, children }
    
    // If generations is "All" (999+) show everything, otherwise use pruneByDepth  
    if (generations >= 999) return baseGraph
    
    return FamilyTreeService.pruneByDepth(baseGraph, focusPersonId || people[0]?.id, generations)
  }, [people, families, children, generations, focusPersonId])

  useEffect(() => {
    loadTreeData()
  }, [familyId, focusPersonId])

  // Recalculate layout when Auto Layout mode changes or visible graph changes
  useEffect(() => {
    if (visibleGraph.people.length > 0 && (focusPersonId || visibleGraph.people[0])) {
      calculateLayout(visibleGraph.people, visibleGraph.families, visibleGraph.children, focusPersonId || visibleGraph.people[0].id, generations)
    }
  }, [autoLayout, visibleGraph])

  const loadTreeData = async () => {
    try {
      const data = await FamilyTreeService.getTreeData(familyId, focusPersonId)
      setPeople(data.people)
      setFamilies(data.families)
      setChildren(data.children)
      
      // 1) Quick diagnostics - prove where the 3 is coming from
      console.table({
        fetched_people: data.people?.length ?? 0,
        fetched_relationships: data.relationships?.length ?? 0,
        fetched_families: data.families?.length ?? 0,
        fetched_children: data.children?.length ?? 0,
        components: data.components?.length ?? 0,
        focus_person: focusPersonId ?? 'none',
        source: data.meta?.source ?? 'unknown'
      });
      
      if (data.people.length > 0 && data.focusPersonId) {
        console.debug('Tree data:', { people: data.people.length, families: data.families.length, children: data.children.length })
        calculateLayout(data.people, data.families, data.children, data.focusPersonId)
      }
    } catch (error) {
      console.error('Error loading tree data:', error)
      toast.error('Failed to load family tree')
    }
  }

  const calculateLayout = (
    people: TreePerson[],
    families: TreeFamily[],
    children: TreeFamilyChild[],
    focusId: string,
    gen: number = generations
  ) => {
    // Convert to new API format
    const rels = []
    
    // Add parent-child relationships from families
    for (const family of families) {
      const familyChildren = children.filter(c => c.family_id === family.id)
      for (const child of familyChildren) {
        if (family.partner1_id) {
          rels.push({ type: 'parent' as const, parent_id: family.partner1_id, child_id: child.child_id })
        }
        if (family.partner2_id) {
          rels.push({ type: 'parent' as const, parent_id: family.partner2_id, child_id: child.child_id })
        }
      }
      
      // Add spouse relationships
      if (family.partner1_id && family.partner2_id) {
        rels.push({ type: 'spouse' as const, a: family.partner1_id, b: family.partner2_id })
      }
    }

    const graph = buildGraph(people, rels, focusId)
    const newLayout = layoutGraph(graph, focusId)
    
    setLayout(newLayout)
    
    // Convert rects to nodes array for backward compatibility
    const nodeRects = Array.from(newLayout.rects.values())
    setNodes(nodeRects)

  }

  const handleZoomOut = () => {
        xOffset = maxX + 200
      }

      // Helper to compute bounds
      const getBounds = (nodes: LayoutNode[]) => {
        if (nodes.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
        const minX = Math.min(...nodes.map(n => n.x))
        const maxX = Math.max(...nodes.map(n => n.x))
        const minY = Math.min(...nodes.map(n => n.y))
        const maxY = Math.max(...nodes.map(n => n.y))
        return { minX, maxX, minY, maxY }
      }

      // Place each remaining connected component side-by-side preserving relationships
      for (const person of people) {
        if (processed.has(person.id)) continue

        const subEngine = new FamilyTreeLayoutEngine(people, families, children, defaultLayoutConfig)
        const sub = subEngine.calculateLayout(person.id, gen)

        // Offset this component so it doesn't overlap the current layout
        const { minX: sMinX, maxX: sMaxX, minY: sMinY } = getBounds(sub.nodes)
        const dx = xOffset - sMinX
        const dy = 0 - sMinY

        sub.nodes.forEach(sn => {
          if (!processed.has(sn.id)) {
            layout.nodes.push({ ...sn, x: sn.x + dx, y: sn.y + dy })
            processed.add(sn.id)
          }
        })
        sub.unions.forEach(su => {
          if (!addedUnionIds.has(su.id)) {
            layout.unions.push({ ...su, x: su.x + dx, y: su.y + dy })
            addedUnionIds.add(su.id)
          }
        })

        xOffset += (sMaxX - sMinX) + 200
      }
    }

    // REMOVED: Fallback grid layout that was capping nodes at 3-5
    // Always use the proper generational layout from the engine
    
    console.debug('Layout nodes:', layout.nodes.length)
    setNodes(layout.nodes)
    setUnions(layout.unions)
    
    // Auto-fit view to show all nodes on screen
    setTimeout(() => {
      if (layout.nodes.length > 0) {
        const minX = Math.min(...layout.nodes.map(n => n.x))
        const maxX = Math.max(...layout.nodes.map(n => n.x))
        const minY = Math.min(...layout.nodes.map(n => n.y))
        const maxY = Math.max(...layout.nodes.map(n => n.y))
        
        const width = maxX - minX + 200
        const height = maxY - minY + 200
        
        const svgWidth = svgRef.current?.clientWidth || 800
        const svgHeight = svgRef.current?.clientHeight || 600
        
        const scaleX = svgWidth / width
        const scaleY = svgHeight / height
        const scale = Math.min(scaleX, scaleY, 1)
        
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.3))
  }

  const handleFitView = () => {
    if (nodes.length === 0) return
    
    const minX = Math.min(...nodes.map(n => n.x))
    const maxX = Math.max(...nodes.map(n => n.x))
    const minY = Math.min(...nodes.map(n => n.y))
    const maxY = Math.max(...nodes.map(n => n.y))
    
    const width = maxX - minX + 200
    const height = maxY - minY + 200
    
    const svgWidth = svgRef.current?.clientWidth || 800
    const svgHeight = svgRef.current?.clientHeight || 600
    
    const scaleX = svgWidth / width
    const scaleY = svgHeight / height
    const scale = Math.min(scaleX, scaleY, 1)
    
    setZoom(scale)
    setPan({
      x: svgWidth / 2 - (minX + maxX) / 2,
      y: svgHeight / 2 - (minY + maxY) / 2
    })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handlePersonClick = (personId: string) => {
    setSelectedPersonId(personId)
    onPersonFocus?.(personId)
  }

  const handleQuickAdd = (type: 'partner' | 'child' | 'parent', targetPersonId: string) => {
    setQuickAddContext({ type, targetPersonId })
    setShowQuickAdd(true)
  }

  const handleQuickAddSuccess = () => {
    setShowQuickAdd(false)
    setQuickAddContext(null)
    loadTreeData() // Refresh tree
  }

  const renderPersonNode = (node: NodeRect) => {
    const person = people.find(p => p.id === node.id)
    if (!person) return null
    
    return (
      <PersonCard
        key={node.id}
        x={node.x}
        y={node.y}
        person={person}
        onClick={() => handlePersonClick(person)}
        onAddClick={(type) => handleQuickAdd(type, person.id)}
      />
    )
  }


  const renderGenerationCaptions = () => {
    return null // Disabled for now
  }

  const renderConnections = () => {
    if (!layout || nodes.length === 0) {
      return <g></g>
    }

    return <ConnectionRenderer graph={layout} layout={layout} />
  }

  return (
    <div className="w-full h-full relative fe-canvas" style={{ background: '#F8F9FA' }}>
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 0.1}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium px-2">{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFitView}
            title="Fit to view"
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border">
          <label className="text-sm text-muted-foreground">Generations:</label>
          <select 
            value={generations} 
            onChange={(e) => setGenerations(Number(e.target.value))}
            className="text-sm bg-transparent border-none focus:outline-none"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={999}>All</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border">
          <Badge variant="secondary" className="text-xs">
            {nodes.length} people
          </Badge>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ background: 'transparent' }}
      >
        <defs>
          <filter id="feCardShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="black" floodOpacity="0.20"/>
          </filter>
        </defs>
        
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Render connections FIRST (behind cards) */}
          {renderConnections()}
          
          {/* Then render person cards on top */}
          {nodes.map(renderPersonNode)}
          
          {/* Finally captions */}
          {renderGenerationCaptions()}
        </g>
      </svg>

      {/* Quick Add Modal */}
      {showQuickAdd && quickAddContext && (
        <QuickAddModal
          open={showQuickAdd}
          onOpenChange={setShowQuickAdd}
          familyId={familyId}
          relationshipType={quickAddContext.type}
          targetPersonId={quickAddContext.targetPersonId}
          onSuccess={handleQuickAddSuccess}
        />
      )}

      {/* Person Details Drawer */}
      {selectedPersonId && (
        <PersonDrawer
          personId={selectedPersonId}
          open={!!selectedPersonId}
          onOpenChange={(open) => !open && setSelectedPersonId(null)}
        />
      )}
    </div>
  )
}