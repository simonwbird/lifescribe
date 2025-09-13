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
import { FamilyTreeLayoutEngine, defaultLayoutConfig, type LayoutNode, type UnionNode } from '@/lib/familyTreeLayoutEngine'
import { FamilyTreeService } from '@/lib/familyTreeV2Service'
import type { TreePerson, TreeFamily, TreeFamilyChild } from '@/lib/familyTreeV2Types'
import { QuickAddModal } from './QuickAddModal'
import { PersonDrawer } from './PersonDrawer'
import { PersonCard, CARD_W, CARD_H } from './PersonCard'
import { ConnectionRenderer } from './ConnectionRenderer'
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
  
  const [nodes, setNodes] = useState<LayoutNode[]>([])
  const [unions, setUnions] = useState<UnionNode[]>([])
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
    const engine = new FamilyTreeLayoutEngine(people, families, children, defaultLayoutConfig)
    const layout = engine.calculateLayout(focusId, gen)

    // When showing All generations, include every disconnected component with relationships
    if (gen >= 999) {
      const processed = new Set(layout.nodes.map(n => n.id))
      const addedUnionIds = new Set(layout.unions.map(u => u.id))

      // Start placing additional components to the right of current bounds
      let xOffset = 0
      if (layout.nodes.length > 0) {
        const maxX = Math.max(...layout.nodes.map(n => n.x))
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
        
        setZoom(scale)
        setPan({
          x: svgWidth / 2 - (minX + maxX) / 2,
          y: svgHeight / 2 - (minY + maxY) / 2
        })
      }
    }, 100)
  }

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

  const renderPersonNode = (node: LayoutNode) => {
    const displayName = `${node.given_name || ''} ${node.surname || ''}`.trim() || 'Unknown'
    
    const person = {
      id: node.id,
      full_name: displayName,
      birth_date: node.birth_date,
      death_date: node.death_date,
      gender: node.gender,
      avatar_url: node.avatar_url
    }

    return (
      <PersonCard
        key={node.id}
        x={node.x - CARD_W / 2}
        y={node.y - CARD_H / 2}
        person={person}
        onClick={() => handlePersonClick(node.id)}
        onQuickAdd={(type) => handleQuickAdd(type, node.id)}
      />
    )
  }


  const renderGenerationCaptions = () => {
    if (!nodes.length) return null
    
    const focusPerson = people.find(p => p.id === focusPersonId) || people[0]
    const focusName = focusPerson ? 
      (focusPerson.given_name || focusPerson.full_name || '').split(' ')[0] : 'Focus'
    
    // Group nodes by level (from layout engine)
    const levelGroups = new Map<number, LayoutNode[]>()
    nodes.forEach(node => {
      if (!levelGroups.has(node.level)) {
        levelGroups.set(node.level, [])
      }
      levelGroups.get(node.level)!.push(node)
    })
    
    const captionForLevel = (level: number, name: string) => {
      if (level === 0) return `${name} & siblings`
      if (level === 1) return `${name}'s children`
      if (level === -1) return `${name}'s parents`
      if (level === -2) return `${name}'s grandparents`
      if (level === -3) return `${name}'s great-grandparents` 
      if (level === -4) return `${name}'s 2nd great-grandparents`
      if (level < -4) return `${name}'s ${Math.abs(level) - 2}${getOrdinalSuffix(Math.abs(level) - 2)} great-grandparents`
      if (level === 2) return `${name}'s grandchildren`
      if (level > 2) return `${name}'s ${level - 1}${getOrdinalSuffix(level - 1)} great-grandchildren`
      return ''
    }
    
    const getOrdinalSuffix = (n: number) => {
      const s = ['th', 'st', 'nd', 'rd']
      const v = n % 100
      return s[(v - 20) % 10] || s[v] || s[0]
    }
    
    return Array.from(levelGroups.entries()).map(([level, levelNodes]) => {
      const caption = captionForLevel(level, focusName)
      if (!caption || !levelNodes.length) return null
      
      // Position caption centered under the generation
      const minX = Math.min(...levelNodes.map(n => n.x))
      const maxX = Math.max(...levelNodes.map(n => n.x))
      const centerX = (minX + maxX) / 2
      const y = levelNodes[0].y + CARD_H / 2 + 30
      
      return (
        <text 
          key={`caption-${level}`}
          x={centerX} 
          y={y} 
          className="fe-caption"
        >
          {caption}
        </text>
      )
    })
  }

  const renderUnionNode = (union: UnionNode) => {
    const partner1Name = `${union.partner1.given_name || ''} ${union.partner1.surname || ''}`.trim()
    const partner2Name = union.partner2 ? 
      `${union.partner2.given_name || ''} ${union.partner2.surname || ''}`.trim() : null

    return (
      <g key={union.id} transform={`translate(${union.x}, ${union.y})`}>
        {/* Union Card */}
        <rect
          x={-union.width / 2}
          y={-union.height / 2}
          width={union.width}
          height={union.height}
          rx={12}
          className="fill-muted/30 stroke-primary stroke-2"
        />
        
        {/* Heart icon */}
        <Heart size={16} x={-8} y={-25} className="fill-primary" />
        
        {/* Partner names */}
        <text
          x={0}
          y={-5}
          textAnchor="middle"
          className="fill-foreground text-sm font-medium"
        >
          {partner1Name}
        </text>
        
        {partner2Name && (
          <>
            <text
              x={0}
              y={10}
              textAnchor="middle"
              className="fill-muted-foreground text-xs"
            >
              &
            </text>
            <text
              x={0}
              y={25}
              textAnchor="middle"
              className="fill-foreground text-sm font-medium"
            >
              {partner2Name}
            </text>
          </>
        )}

        {/* Relationship type */}
        <text
          x={0}
          y={union.height / 2 - 5}
          textAnchor="middle"
          className="fill-muted-foreground text-xs capitalize"
        >
          {union.family.relationship_type}
        </text>
      </g>
    )
  }

  const renderConnections = () => {
    const parentConnections: Array<{
      parentX: number;
      parentY: number; 
      childX: number;
      childY: number;
    }> = []
    
    const spouseConnections: Array<{
      spouse1X: number;
      spouse1Y: number;
      spouse2X: number;
      spouse2Y: number;
    }> = []

    // Connect parents to children through unions
    unions.forEach(union => {
      union.children.forEach(child => {
        const childNode = nodes.find(n => n.id === child.id)
        if (childNode) {
          parentConnections.push({
            parentX: union.x,
            parentY: union.y + union.height / 2,
            childX: childNode.x,
            childY: childNode.y - CARD_H / 2
          })
        }
      })

      // Connect spouses with horizontal bar
      const partner1Node = nodes.find(n => n.id === union.partner1.id)
      const partner2Node = union.partner2 ? nodes.find(n => n.id === union.partner2.id) : null
      
      if (partner1Node && partner2Node) {
        spouseConnections.push({
          spouse1X: partner1Node.x + CARD_W / 2,
          spouse1Y: partner1Node.y,
          spouse2X: partner2Node.x - CARD_W / 2, 
          spouse2Y: partner2Node.y
        })
      }
    })

    return (
      <ConnectionRenderer 
        parentConnections={parentConnections}
        spouseConnections={spouseConnections}
      />
    )
  }

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-4 border-b bg-muted/10">
        <Button variant="outline" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleFitView}>
          <Maximize className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2 ml-4">
          <span className="text-sm text-muted-foreground">Zoom: {Math.round(zoom * 100)}%</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Generations:</span>
            <select 
              value={generations} 
              onChange={(e) => setGenerations(parseInt(e.target.value))}
              className="text-sm border rounded px-2 py-1 bg-background"
            >
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={7}>7</option>
              <option value={10}>10</option>
              <option value={999}>All</option>
            </select>
          </div>
          {/* Header stats that reflect the same arrays the canvas uses */}
          <Badge variant="outline" title="Nodes shown">
            {visibleGraph.people.length} people
          </Badge>
          <Badge variant="outline" title="Families in visible graph">
            {visibleGraph.families.length} families
          </Badge>
          <Badge variant="outline" title="Parent-child links in visible graph">
            {visibleGraph.children.length} links
          </Badge>
          <Button variant="outline" size="sm" onClick={() => {
            if (visibleGraph.people.length > 0) {
              calculateLayout(visibleGraph.people, visibleGraph.families, visibleGraph.children, focusPersonId || visibleGraph.people[0].id, generations)
              handleFitView()
            }
          }}>
            Recalculate
          </Button>
          <Button
            variant={autoLayout ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoLayout(!autoLayout)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Auto Layout
          </Button>
        </div>
      </div>

      {/* Tree Canvas */}
      <div className="flex-1 overflow-hidden relative">
        <style>{`
          /* Family Explorer "Ancestry" skin */
          :root {
            /* Canvas + grid */
            --fe-canvas: #4A4A4A;
            --fe-grid: rgba(255,255,255,.05);

            /* Cards */
            --fe-card: #FFFFFF;
            --fe-card-border: #E0E0E0;
            --fe-shadow: rgba(0,0,0,.15);

            /* Text */
            --fe-ink: #333333;
            --fe-ink-muted: #666666;

            /* Lines */
            --fe-line: #B8B8B8;
            --fe-line-strong: #999999;
          }
          
          .fe-canvas{
            background: var(--fe-canvas);
            background-image:
              radial-gradient(var(--fe-grid) 1px, transparent 1px),
              radial-gradient(var(--fe-grid) 1px, transparent 1px);
            background-size: 24px 24px, 24px 24px;
            background-position: 0 0, 12px 12px;
          }
          .fe-caption{ font:600 11px/1.1 Inter, system-ui; fill:rgba(255,255,255,.90); text-anchor:middle; }
          .fe-name{ font:600 11px/1.3 Inter, system-ui; fill:var(--fe-ink); text-anchor:middle; }
          .fe-dates{ font:400 10px/1.2 Inter, system-ui; fill:var(--fe-ink-muted); text-anchor:middle; }
        `}</style>
        
        <svg
          ref={svgRef}
          className="w-full h-full cursor-grab active:cursor-grabbing fe-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            <filter id="feCardShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="black" floodOpacity="0.20"/>
            </filter>
          </defs>
          
          <g transform={`scale(${zoom}) translate(${pan.x}, ${pan.y})`}>
            {/* Connections */}
            {renderConnections()}

            {/* Union nodes */}
            {unions.map(renderUnionNode)}

            {/* Person nodes */}
            {nodes.map(renderPersonNode)}
            
            {/* Generation captions */}
            {renderGenerationCaptions()}
          </g>
        </svg>
      </div>

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