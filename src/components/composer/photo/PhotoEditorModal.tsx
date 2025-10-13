import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, RotateCcw, Trash2, Tag } from 'lucide-react'
import { RegionTagger } from './RegionTagger'
import { PhotoComments } from './PhotoComments'

interface PhotoEditorModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  imageId: string
  onDelete: () => void
  familyId: string
}

export function PhotoEditorModal({
  isOpen,
  onClose,
  imageUrl,
  imageId,
  onDelete,
  familyId
}: PhotoEditorModalProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isTagMode, setIsTagMode] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5))
  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isTagMode) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isTagMode) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Photo Editor</span>
            <div className="flex items-center gap-2">
              <Button
                variant={isTagMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsTagMode(!isTagMode)}
              >
                <Tag className="h-4 w-4 mr-2" />
                Tag Mode
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-4 overflow-hidden">
          <div 
            ref={containerRef}
            className="flex-1 relative overflow-hidden bg-muted rounded-lg"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center',
                transition: isDragging ? 'none' : 'transform 0.1s',
                cursor: isTagMode ? 'crosshair' : isDragging ? 'grabbing' : 'grab'
              }}
              className="w-full h-full flex items-center justify-center"
            >
              <RegionTagger
                imageUrl={imageUrl}
                assetId={imageId}
                familyId={familyId}
                isTagMode={isTagMode}
                zoom={zoom}
              />
            </div>
          </div>

          <div className="w-96 flex flex-col overflow-hidden">
            <PhotoComments assetId={imageId} familyId={familyId} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
