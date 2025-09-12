import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

interface ImageViewerProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  imageAlt?: string
  title?: string
}

export function ImageViewer({ isOpen, onClose, imageUrl, imageAlt, title }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)
  const handleReset = () => {
    setZoom(1)
    setRotation(0)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = title || 'image'
    link.click()
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/90 border-0">
        <VisuallyHidden>
          <DialogTitle>{title || 'Image Viewer'}</DialogTitle>
        </VisuallyHidden>
        
        {/* Controls Bar */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-black/60 backdrop-blur-sm rounded-lg p-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 0.25}
              className="text-white hover:bg-white/20"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <span className="text-white text-sm min-w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="text-white hover:bg-white/20"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-white/20 mx-1" />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRotate}
              className="text-white hover:bg-white/20"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Image Container */}
        <div className="flex items-center justify-center w-full h-full p-8 overflow-auto">
          <img
            src={imageUrl}
            alt={imageAlt || 'Viewing image'}
            className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
            draggable={false}
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = '/placeholder.svg'
            }}
          />
        </div>

        {/* Title Bar */}
        {title && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
            <p className="text-white text-sm font-medium max-w-md truncate">
              {title}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}