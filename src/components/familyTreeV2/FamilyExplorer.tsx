import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  MoreHorizontal, 
  UserPlus, 
  Baby, 
  Users2,
  Edit,
  Trash2,
  Heart,
  Settings
} from 'lucide-react'
import { FamilyTreeLayoutEngine, defaultLayoutConfig, type LayoutNode, type UnionNode } from '@/lib/familyTreeLayoutEngine'
import { FamilyTreeService } from '@/lib/familyTreeV2Service'
import type { TreePerson, TreeFamily, TreeFamilyChild } from '@/lib/familyTreeV2Types'
import { QuickAddModal } from './QuickAddModal'
import { PersonDrawer } from './PersonDrawer'
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

  useEffect(() => {
    loadTreeData()
  }, [familyId, focusPersonId])

  const loadTreeData = async () => {
    try {
      const data = await FamilyTreeService.getTreeData(familyId, focusPersonId)
      setPeople(data.people)
      setFamilies(data.families)
      setChildren(data.children)
      
      if (data.people.length > 0 && data.focusPersonId) {
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
    setNodes(layout.nodes)
    setUnions(layout.unions)
    
    // Center view on focus person
    const focusNode = layout.nodes.find(n => n.id === focusId)
    if (focusNode && svgRef.current) {
      const svgWidth = svgRef.current.clientWidth || 800
      const svgHeight = svgRef.current.clientHeight || 600
      setPan({ 
        x: svgWidth / 2 - focusNode.x, 
        y: svgHeight / 2 - focusNode.y 
      })
    }
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
    const displayName = `${node.given_name || ''} ${node.surname || ''}`.trim()
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase()
    const years = node.birth_date || node.death_date ? 
      `${node.birth_date?.split('-')[0] || '?'}–${node.death_date?.split('-')[0] || ''}` : ''

    return (
      <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
        {/* Person Card */}
        <rect
          x={-node.width / 2}
          y={-node.height / 2}
          width={node.width}
          height={node.height}
          rx={8}
          className="fill-background stroke-border stroke-2 cursor-pointer hover:stroke-primary transition-colors"
          onClick={() => handlePersonClick(node.id)}
        />
        
        {/* Avatar */}
        <circle
          cx={0}
          cy={-15}
          r={20}
          className="fill-muted stroke-border stroke-1"
        />
        
        {/* Avatar text */}
        <text
          x={0}
          y={-10}
          textAnchor="middle"
          className="fill-foreground text-sm font-medium"
        >
          {initials}
        </text>
        
        {/* Name */}
        <text
          x={0}
          y={15}
          textAnchor="middle"
          className="fill-foreground text-sm font-semibold"
        >
          {displayName}
        </text>
        
        {/* Years */}
        {years && (
          <text
            x={0}
            y={30}
            textAnchor="middle"
            className="fill-muted-foreground text-xs"
          >
            {years}
          </text>
        )}

        {/* Action buttons */}
        <g transform={`translate(${node.width / 2 - 15}, ${-node.height / 2 + 5})`}>
          <circle r={8} className="fill-background stroke-border cursor-pointer hover:fill-muted" />
          <MoreHorizontal size={10} x={-5} y={-5} className="fill-foreground pointer-events-none" />
        </g>

        {/* Quick add zones */}
        {/* Add partner */}
        <circle
          cx={node.width / 2 + 20}
          cy={0}
          r={12}
          className="fill-primary/20 stroke-primary stroke-2 cursor-pointer hover:fill-primary/40 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            handleQuickAdd('partner', node.id)
          }}
        />
        <UserPlus size={14} x={node.width / 2 + 20 - 7} y={-7} className="fill-primary pointer-events-none" />

        {/* Add child */}
        <circle
          cx={0}
          cy={node.height / 2 + 20}
          r={12}
          className="fill-primary/20 stroke-primary stroke-2 cursor-pointer hover:fill-primary/40 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            handleQuickAdd('child', node.id)
          }}
        />
        <Baby size={14} x={-7} y={node.height / 2 + 20 - 7} className="fill-primary pointer-events-none" />

        {/* Add parent */}
        <circle
          cx={0}
          cy={-node.height / 2 - 20}
          r={12}
          className="fill-primary/20 stroke-primary stroke-2 cursor-pointer hover:fill-primary/40 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            handleQuickAdd('parent', node.id)
          }}
        />
        <Users2 size={14} x={-7} y={-node.height / 2 - 20 - 7} className="fill-primary pointer-events-none" />
      </g>
    )
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
    const connections: JSX.Element[] = []

    // Connect parents to children through unions
    unions.forEach(union => {
      union.children.forEach(child => {
        const childNode = nodes.find(n => n.id === child.id)
        if (childNode) {
          connections.push(
            <line
              key={`${union.id}-${child.id}`}
              x1={union.x}
              y1={union.y + union.height / 2}
              x2={childNode.x}
              y2={childNode.y - childNode.height / 2}
              className="stroke-border stroke-2"
            />
          )
        }
      })

      // Connect partners to union
      const partner1Node = nodes.find(n => n.id === union.partner1.id)
      if (partner1Node) {
        connections.push(
          <line
            key={`${union.partner1.id}-${union.id}`}
            x1={partner1Node.x}
            y1={partner1Node.y}
            x2={union.x - 30}
            y2={union.y}
            className="stroke-primary stroke-2"
          />
        )
      }

      if (union.partner2) {
        const partner2Node = nodes.find(n => n.id === union.partner2!.id)
        if (partner2Node) {
          connections.push(
            <line
              key={`${union.partner2.id}-${union.id}`}
              x1={partner2Node.x}
              y1={partner2Node.y}
              x2={union.x + 30}
              y2={union.y}
              className="stroke-primary stroke-2"
            />
          )
        }
      }
    })

    return connections
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
              onChange={(e) => {
                const newGen = parseInt(e.target.value)
                setGenerations(newGen)
                if (people.length > 0 && (focusPersonId || people[0])) {
                  calculateLayout(people, families, children, focusPersonId || people[0].id, newGen)
                }
              }}
              className="text-sm border rounded px-2 py-1 bg-background"
            >
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={7}>7</option>
              <option value={10}>10</option>
              <option value={999}>All</option>
            </select>
          </div>
          <Badge variant="outline">
            {nodes.length} people
          </Badge>
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
        <svg
          ref={svgRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <g transform={`scale(${zoom}) translate(${pan.x}, ${pan.y})`}>
            {/* Grid background */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.1"/>
              </pattern>
            </defs>
            <rect x="-2000" y="-2000" width="4000" height="4000" fill="url(#grid)" />

            {/* Connections */}
            {renderConnections()}

            {/* Union nodes */}
            {unions.map(renderUnionNode)}

            {/* Person nodes */}
            {nodes.map(renderPersonNode)}
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