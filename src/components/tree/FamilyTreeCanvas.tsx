import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Grid, RotateCcw, Save, History, Trash2, Maximize2 } from 'lucide-react'
import { PersonCard } from './PersonCard'
import { ConnectionRenderer } from './ConnectionRenderer'
import { LayoutEngine, type LayoutNode } from '@/lib/tree/LayoutEngine'
import { VersionService, type TreeVersion } from '@/lib/tree/VersionService'
import { useToast } from '@/hooks/use-toast'
import type { Person, Relationship } from '@/lib/familyTreeTypes'

interface FamilyTreeCanvasProps {
  people: Person[]
  relationships: Relationship[]
  familyId: string
  onPersonSelect?: (personId: string) => void
  onPersonEdit?: (personId: string) => void
  onPersonView?: (personId: string) => void
}

export function FamilyTreeCanvas({
  people,
  relationships,
  familyId,
  onPersonSelect,
  onPersonEdit,
  onPersonView
}: FamilyTreeCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [draggingPersonId, setDraggingPersonId] = useState<string | null>(null)
  const [pendingDragId, setPendingDragId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [layoutNodes, setLayoutNodes] = useState<LayoutNode[]>([])
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [versionsDialogOpen, setVersionsDialogOpen] = useState(false)
  const [versionName, setVersionName] = useState('')
  const [versions, setVersions] = useState<TreeVersion[]>([])
  
  // Smooth dragging state
  const [lastPointer, setLastPointer] = useState({ x: 0, y: 0 })
  const [startPointer, setStartPointer] = useState({ x: 0, y: 0 })
  const [dragStartNodePos, setDragStartNodePos] = useState({ x: 0, y: 0 })
  const [isAltPressed, setIsAltPressed] = useState(false)
  const animationFrame = useRef<number>(0)
  const dragOverridesRef = useRef<Record<string, { x: number; y: number }>>({})
  const [visualTick, setVisualTick] = useState(0)
  
  // Click suppression to avoid click-through after grab attempts
  const suppressNextClickRef = useRef(false)
  const suppressTimerRef = useRef<number | null>(null)
  
  const { toast } = useToast()
  const versionService = new VersionService(familyId)
  const layoutEngine = new LayoutEngine(people, relationships)

  // Initialize layout
  useEffect(() => {
    if (people.length > 0) {
      const layout = layoutEngine.generateLayout()
      setLayoutNodes(layout.nodes)
    }
  }, [people, relationships])

  // Auto-fit when layout nodes are first set
  useEffect(() => {
    if (layoutNodes.length > 0) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => autoFit(), 200)
      return () => clearTimeout(timer)
    }
  }, [layoutNodes.length > 0 ? layoutNodes.length : 0]) // Only trigger on initial load

  // Load versions
  useEffect(() => {
    loadVersions()
  }, [familyId])

  const loadVersions = async () => {
    const versionsList = await versionService.list()
    setVersions(versionsList)
  }

  // Convert layout nodes to positions (apply transient drag overrides)
  const positions = useMemo(() => {
    const base: Record<string, { x: number; y: number; depth: number }> = {}
    layoutNodes.forEach(n => { base[n.personId] = { x: n.x, y: n.y, depth: n.depth } })
    const overrides = dragOverridesRef.current
    for (const id in overrides) {
      const existing = base[id]
      if (existing) base[id] = { ...existing, ...overrides[id] }
    }
    return base
  }, [layoutNodes, visualTick])

  // Auto-fit functionality
  const autoFit = useCallback(() => {
    if (layoutNodes.length === 0) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Calculate bounding box of all nodes
    const padding = 100 // Increased padding for better view
    const minX = Math.min(...layoutNodes.map(n => n.x - 75)) - padding
    const maxX = Math.max(...layoutNodes.map(n => n.x + 75)) + padding
    const minY = Math.min(...layoutNodes.map(n => n.y - 90)) - padding
    const maxY = Math.max(...layoutNodes.map(n => n.y + 90)) + padding
    
    const bbox = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
    
    const viewportRect = canvas.getBoundingClientRect()
    const viewport = { w: viewportRect.width, h: viewportRect.height }
    
    // Calculate scale to fit with some margin
    const scale = Math.min(
      (viewport.w * 0.9) / bbox.width,  // Use 90% of viewport width
      (viewport.h * 0.9) / bbox.height  // Use 90% of viewport height
    )
    const clampedScale = Math.max(0.2, Math.min(2.0, scale)) // Allow smaller zoom for large trees
    
    // Calculate pan to center
    const scaledWidth = bbox.width * clampedScale
    const scaledHeight = bbox.height * clampedScale
    const newPan = {
      x: (viewport.w - scaledWidth) / 2 - bbox.x * clampedScale,
      y: (viewport.h - scaledHeight) / 2 - bbox.y * clampedScale
    }
    
    console.log('🎯 Auto-fit:', { bbox, viewport, scale: clampedScale, pan: newPan })
    
    setZoom(clampedScale)
    setPan(newPan)
  }, [layoutNodes])

  // Zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3))
  const handleResetZoom = () => {
    setZoom(1)
    setPan({ x: 400, y: 200 })
  }

  // Snap to grid helper
  const snapToGridHelper = (value: number, gridSize: number = 20) => {
    return snapToGrid ? Math.round(value / gridSize) * gridSize : value
  }

  // Smooth drag animation - update overrides only
  const tick = useCallback(() => {
    animationFrame.current = 0
    if (!draggingPersonId) return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    // Calculate new position from pointer with better precision
    const worldX = (lastPointer.x - rect.left - pan.x) / zoom
    const worldY = (lastPointer.y - rect.top - pan.y) / zoom
    
    const newX = snapToGridHelper(worldX - dragOffset.x)
    const newY = snapToGridHelper(worldY - dragOffset.y)
    
    // Update override ref and bump tick (lightweight)
    if (!dragOverridesRef.current[draggingPersonId] ||
        dragOverridesRef.current[draggingPersonId].x !== newX ||
        dragOverridesRef.current[draggingPersonId].y !== newY) {
      dragOverridesRef.current[draggingPersonId] = { x: newX, y: newY }
      setVisualTick(v => v + 1)
    }
  }, [draggingPersonId, lastPointer, pan, zoom, dragOffset])

  // Pointer handlers for canvas panning
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.target === canvasRef.current) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (isDragging && !draggingPersonId) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    } else if (draggingPersonId) {
      setLastPointer({ x: e.clientX, y: e.clientY })
      if (!animationFrame.current) {
        animationFrame.current = requestAnimationFrame(tick)
      }
    }
  }

  const handleCanvasPointerUp = () => {
    // Always suppress the very next click after a pointer up to avoid click-through
    suppressNextClickRef.current = true
    if (suppressTimerRef.current) window.clearTimeout(suppressTimerRef.current)
    suppressTimerRef.current = window.setTimeout(() => {
      suppressNextClickRef.current = false
      suppressTimerRef.current = null
    }, 250)

    setIsDragging(false)
    if (draggingPersonId) {
      const override = dragOverridesRef.current[draggingPersonId]
      if (override) {
        setLayoutNodes(prev =>
          prev.map(n => (n.personId === draggingPersonId ? { ...n, x: override.x, y: override.y } : n))
        )
        delete dragOverridesRef.current[draggingPersonId]
      }
      setDraggingPersonId(null)
    }
    setPendingDragId(null)
    document.body.style.userSelect = ''
  }

  // Global pointer listeners during drag for smoothness
  useEffect(() => {
    if (!pendingDragId && !draggingPersonId) return

    const onMove = (e: PointerEvent) => {
      setLastPointer({ x: e.clientX, y: e.clientY })
      // If drag hasn't started yet, check for threshold
      if (!draggingPersonId && pendingDragId) {
        const dx = e.clientX - startPointer.x
        const dy = e.clientY - startPointer.y
        if (Math.hypot(dx, dy) > 3) {
          setDraggingPersonId(pendingDragId)
        }
        return
      }
      // Active drag -> schedule frame
      if (!animationFrame.current) {
        animationFrame.current = requestAnimationFrame(tick)
      }
    }

    const onUp = (e: PointerEvent) => {
      const dx = e.clientX - startPointer.x
      const dy = e.clientY - startPointer.y
      const moved = Math.hypot(dx, dy) > 2

      // Suppress the next click if a drag was active or there was any movement (grab attempt)
      if (draggingPersonId || moved || pendingDragId) {
        suppressNextClickRef.current = true
        if (suppressTimerRef.current) window.clearTimeout(suppressTimerRef.current)
        suppressTimerRef.current = window.setTimeout(() => {
          suppressNextClickRef.current = false
          suppressTimerRef.current = null
        }, 120)
      }

      if (draggingPersonId) {
        handleCanvasPointerUp()
      } else {
        // No drag occurred; just clear pending
        setPendingDragId(null)
        document.body.style.userSelect = ''
      }
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [pendingDragId, draggingPersonId, startPointer, tick])

  // Person drag handlers
  const handlePersonDragStart = (e: React.PointerEvent, personId: string) => {
    e.stopPropagation()
    if (e.button !== 0) return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      const personPos = positions[personId]
      if (personPos) {
        ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
        setPendingDragId(personId)
        setSelectedPersonId(personId)
        setStartPointer({ x: e.clientX, y: e.clientY })
        setLastPointer({ x: e.clientX, y: e.clientY })
        
        const worldX = (e.clientX - rect.left - pan.x) / zoom
        const worldY = (e.clientY - rect.top - pan.y) / zoom
        setDragStartNodePos({ x: personPos.x, y: personPos.y })
        setDragOffset({ x: worldX - personPos.x, y: worldY - personPos.y })
        document.body.style.userSelect = 'none'
      }
    }
  }

  const handlePersonClick = (personId: string) => {
    // Only handle click if not dragging and no suppression is active
    if (draggingPersonId || suppressNextClickRef.current) {
      // Reset suppression so only the immediate next click is ignored
      suppressNextClickRef.current = false
      return
    }
    
    console.log('🔍 Person clicked:', personId, 'navigating to profile')
    setSelectedPersonId(personId)
    onPersonView?.(personId) // Navigate to profile instead of just selecting
  }

  // Wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!canvasRef.current) return
    
    e.preventDefault()
    const rect = canvasRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.3, Math.min(3, zoom * delta))
    
    // Zoom towards mouse position
    const factor = newZoom / zoom - 1
    setPan(prev => ({
      x: prev.x - (mouseX - prev.x) * factor,
      y: prev.y - (mouseY - prev.y) * factor
    }))
    setZoom(newZoom)
  }, [zoom])

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setIsAltPressed(true)
      } else if (e.key === 'Escape') {
        setSelectedPersonId(null)
      } else if (selectedPersonId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        const nudgeDistance = 5
        const direction = {
          ArrowUp: { x: 0, y: -nudgeDistance },
          ArrowDown: { x: 0, y: nudgeDistance },
          ArrowLeft: { x: -nudgeDistance, y: 0 },
          ArrowRight: { x: nudgeDistance, y: 0 }
        }[e.key] || { x: 0, y: 0 }
        
        setLayoutNodes(prev => 
          prev.map(node => 
            node.personId === selectedPersonId 
              ? { 
                  ...node, 
                  x: snapToGridHelper(node.x + direction.x), 
                  y: snapToGridHelper(node.y + direction.y) 
                }
              : node
          )
        )
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setIsAltPressed(false)
      }
    }
    
    const cleanup = () => {
      document.body.style.userSelect = ''
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('beforeunload', cleanup)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('beforeunload', cleanup)
      cleanup()
    }
  }, [selectedPersonId, snapToGrid])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false })
      return () => canvas.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  // Save layout with default name
  const handleSaveLayout = async () => {
    const defaultName = versionName.trim() || "Classic Layout — elbows & hearts (v2)"
    
    try {
      await versionService.save(defaultName, layoutNodes, {
        hGap: 100,
        vGap: 140,
        zoom,
        pan
      })
      
      toast({
        title: "Success",
        description: `Tree version "${defaultName}" saved successfully.`
      })
      
      setVersionName('')
      setSaveDialogOpen(false)
      loadVersions()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save tree version.",
        variant: "destructive"
      })
    }
  }

  // Load layout
  const handleLoadVersion = async (version: TreeVersion) => {
    setLayoutNodes(version.layout.nodes)
    setZoom(version.layout.meta.zoom)
    setPan(version.layout.meta.pan)
    setVersionsDialogOpen(false)
    
    toast({
      title: "Success",
      description: `Tree version "${version.name}" loaded successfully.`
    })
  }

  // Delete version
  const handleDeleteVersion = async (versionId: string) => {
    try {
      await versionService.delete(versionId)
      toast({
        title: "Success",
        description: "Tree version deleted successfully."
      })
      loadVersions()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete tree version.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="relative w-full h-screen bg-neutral-800 overflow-hidden">
      {/* Canvas */}
      <div
        ref={canvasRef}
        className={`w-full h-full ${isDragging && !draggingPersonId ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerLeave={handleCanvasPointerUp}
        onClickCapture={(e) => {
          if (suppressNextClickRef.current) {
            e.stopPropagation()
            e.preventDefault()
            // reset right away so only the immediate click is eaten
            suppressNextClickRef.current = false
          }
        }}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
        {/* Grid */}
        {showGrid && (
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />
        )}

        {/* SVG for connections - below cards (z-index: 0) */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ 
            zIndex: 0,
            width: '100%',
            height: '100%'
          }}
        >
          {(() => {
            console.log('🎯 FamilyTreeCanvas - Rendering ConnectionRenderer with:', {
              peopleCount: people.length,
              relationshipsCount: relationships.length,
              positionsCount: Object.keys(positions).length,
              samplePeople: people.slice(0, 2).map(p => ({ id: p.id, name: p.full_name })),
              sampleRelationships: relationships.slice(0, 2),
              samplePositions: Object.entries(positions).slice(0, 2)
            })
            return null
          })()}
          <ConnectionRenderer
            people={people}
            relationships={relationships}
            positions={positions}
          />
        </svg>

        {/* Person cards - above connections (z-index: 1) */}
        <div className="absolute inset-0" style={{ zIndex: 1 }}>
          {people.map((person) => {
            const position = positions[person.id]
            if (!position) return null
            
            return (
              <PersonCard
                key={person.id}
                person={person}
                x={position.x}
                y={position.y}
                selected={selectedPersonId === person.id}
                isDragging={draggingPersonId === person.id || pendingDragId === person.id}
                onDragStart={handlePersonDragStart}
                onClick={handlePersonClick}
              />
            )
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowGrid(!showGrid)}
          className={`${showGrid ? 'bg-neutral-700 text-white border-neutral-600' : 'bg-white/90 text-neutral-800'}`}
        >
          <Grid className="w-4 h-4 mr-1" />
          Show Grid
        </Button>
        
        <div className="flex gap-1 bg-white/90 rounded-lg p-1">
          <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-8 w-8 p-0">
            <span className="text-lg font-bold">−</span>
          </Button>
          <div className="flex items-center px-2 text-sm font-medium min-w-[60px] justify-center">
            {Math.round(zoom * 100)}%
          </div>
          <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-8 w-8 p-0">
            <span className="text-lg font-bold">+</span>
          </Button>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleResetZoom}
          className="bg-white/90 text-neutral-800"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={autoFit}
          className="bg-white/90 text-neutral-800"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>

        {/* Save Layout */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="bg-white/90 text-neutral-800">
              <Save className="w-4 h-4 mr-1" />
              Save Layout
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Tree Layout</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="version-name">Version Name</Label>
                <Input
                  id="version-name"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  placeholder="Enter a name for this layout..."
                />
              </div>
              <Button onClick={handleSaveLayout} className="w-full">
                Save Layout
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tree Versions */}
        <Dialog open={versionsDialogOpen} onOpenChange={setVersionsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="bg-white/90 text-neutral-800">
              <History className="w-4 h-4 mr-1" />
              Tree Versions
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Saved Tree Versions</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {versions.length === 0 ? (
                <p className="text-neutral-500 text-center py-4">No saved versions yet</p>
              ) : (
                versions.map((version) => (
                  <div key={version.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{version.name}</div>
                      <div className="text-xs text-neutral-500">
                        {new Date(version.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLoadVersion(version)}
                      >
                        Restore
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteVersion(version.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Instructions panel */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border max-w-xs z-10">
        <h4 className="font-semibold text-sm text-neutral-800 mb-3">
          Interactive Family Tree
        </h4>
        <div className="space-y-2 text-xs text-neutral-600">
          <div>• Drag any person to reposition them</div>
          <div>• Use zoom controls (+/-) to get closer or see more</div>
          <div>• Cards snap to an invisible grid (hold Shift or Alt to disable)</div>
          <div>• Connections update automatically</div>
          <div>• Click persons to view their profile</div>
        </div>
      </div>
    </div>
  )
}