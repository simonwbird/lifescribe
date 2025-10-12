import React, { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GripVertical, RotateCcw } from 'lucide-react'
import { LayoutMap, Breakpoint } from '@/components/person-page/PortalLayoutManager'
import { BLOCK_REGISTRY } from '@/lib/blockRegistry'
import { cn } from '@/lib/utils'
import { MigrationButton } from './MigrationButton'
import { validateLayoutMap } from '@/lib/layoutValidator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

interface LayoutEditorProps {
  layoutMap: LayoutMap
  onSave: (layoutMap: LayoutMap) => Promise<void>
  onReset: () => Promise<void>
  saving?: boolean
  personId: string
  familyId: string
}

export function LayoutEditor({ layoutMap, onSave, onReset, saving, personId, familyId }: LayoutEditorProps) {
  const [workingLayout, setWorkingLayout] = useState<LayoutMap>(layoutMap)
  const [activeBreakpoint, setActiveBreakpoint] = useState<Breakpoint>('desktop')
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Validate layout whenever it changes
  React.useEffect(() => {
    const result = validateLayoutMap(workingLayout)
    if (!result.valid) {
      setValidationErrors(result.errors.map(e => e.message))
    } else {
      setValidationErrors([])
    }
  }, [workingLayout])

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result

    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    const sourceList = source.droppableId as 'main' | 'rail'
    const destList = destination.droppableId as 'main' | 'rail'

    const newLayout = { ...workingLayout }
    const breakpointLayout = { ...newLayout[activeBreakpoint] }

    // Remove from source
    const sourceItems = Array.from(breakpointLayout[sourceList])
    const [movedItem] = sourceItems.splice(source.index, 1)

    // Check if item already exists in destination (prevent duplicates)
    const destItems = Array.from(breakpointLayout[destList])
    if (destItems.includes(movedItem)) {
      return // Block duplicate
    }

    // Add to destination
    destItems.splice(destination.index, 0, movedItem)

    // Update layout
    breakpointLayout[sourceList] = sourceItems
    breakpointLayout[destList] = destItems
    newLayout[activeBreakpoint] = breakpointLayout

    setWorkingLayout(newLayout)
    onSave(newLayout)
  }

  const renderBlockChip = (blockId: string, index: number, listType: 'main' | 'rail') => {
    const metadata = BLOCK_REGISTRY[blockId]
    const displayName = metadata?.displayName || blockId

    return (
      <Draggable key={blockId} draggableId={blockId} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md border transition-colors',
              'bg-background hover:bg-accent',
              snapshot.isDragging && 'shadow-lg ring-2 ring-primary'
            )}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm flex-1">{displayName}</span>
            {metadata?.singleton && (
              <Badge variant="secondary" className="text-xs">
                Singleton
              </Badge>
            )}
          </div>
        )}
      </Draggable>
    )
  }

  const renderColumn = (listType: 'main' | 'rail', blocks: string[]) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {listType === 'main' ? 'Main Column' : 'Right Rail'}
          </CardTitle>
          <CardDescription>
            {listType === 'main' 
              ? 'Primary content area - full width on mobile'
              : 'Sidebar widgets - hidden on mobile'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Droppable droppableId={listType}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  'min-h-[200px] space-y-2 p-3 rounded-lg border-2 border-dashed transition-colors',
                  snapshot.isDraggingOver ? 'border-primary bg-accent/50' : 'border-muted'
                )}
              >
                {blocks.map((blockId, index) => 
                  renderBlockChip(blockId, index, listType)
                )}
                {provided.placeholder}
                {blocks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Drag blocks here
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">Layout Validation Errors:</div>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, i) => (
                <li key={i} className="text-sm">{error}</li>
              ))}
            </ul>
            <div className="mt-2 text-sm">
              Fix these issues before saving the layout.
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Remove Duplicate Blocks</CardTitle>
          <CardDescription>
            Scan this page for duplicate blocks and safely remove them while keeping the earliest version
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MigrationButton personId={personId} familyId={familyId} />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Page Layout</h3>
          <p className="text-sm text-muted-foreground">
            Customize block placement for each device size
          </p>
        </div>
        <Button
          onClick={onReset}
          disabled={saving || validationErrors.length > 0}
          variant="outline"
          size="sm"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>

      <Tabs value={activeBreakpoint} onValueChange={(v) => setActiveBreakpoint(v as Breakpoint)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="desktop">Desktop</TabsTrigger>
          <TabsTrigger value="tablet">Tablet</TabsTrigger>
          <TabsTrigger value="mobile">Mobile</TabsTrigger>
        </TabsList>

        {(['desktop', 'tablet', 'mobile'] as Breakpoint[]).map((breakpoint) => (
          <TabsContent key={breakpoint} value={breakpoint} className="space-y-4">
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {renderColumn('main', workingLayout[breakpoint].main)}
                {breakpoint !== 'mobile' && renderColumn('rail', workingLayout[breakpoint].rail)}
              </div>
            </DragDropContext>
            {breakpoint === 'mobile' && (
              <p className="text-xs text-muted-foreground">
                Note: On mobile, all blocks appear in a single column. Rail widgets are placed below Bio.
              </p>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
