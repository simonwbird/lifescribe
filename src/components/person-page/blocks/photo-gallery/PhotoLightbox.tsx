import { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  FileText,
  Download,
  MoveHorizontal
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface PhotoLightboxProps {
  photos: any[]
  initialIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
  canEdit?: boolean
  albums?: any[]
  currentAlbumId?: string
  onMovePhoto?: (photoId: string, targetAlbumId: string) => void
}

export function PhotoLightbox({
  photos,
  initialIndex,
  onClose,
  onNavigate,
  canEdit = false,
  albums = [],
  currentAlbumId = 'all',
  onMovePhoto
}: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [showCaption, setShowCaption] = useState(true)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  
  const currentPhoto = photos[currentIndex]
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < photos.length - 1

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for arrow keys to avoid page scrolling
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault()
      }

      if (e.key === 'ArrowLeft' && hasPrev) {
        goToPrevious()
      } else if (e.key === 'ArrowRight' && hasNext) {
        goToNext()
      } else if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'c' || e.key === 'C') {
        // Toggle caption with 'c' key
        setShowCaption(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, hasPrev, hasNext])

  const goToPrevious = () => {
    if (hasPrev) {
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      onNavigate(newIndex)
    }
  }

  const goToNext = () => {
    if (hasNext) {
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      onNavigate(newIndex)
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    const href = currentPhoto.url || currentPhoto.file_path
    link.href = href
    link.download = `photo-${currentPhoto.id}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] h-[95vh] p-0 overflow-hidden bg-black/95">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <Badge variant="secondary" className="bg-white/20 text-white">
                {currentIndex + 1} / {photos.length}
              </Badge>
              {currentPhoto.story_title && (
                <span className="text-sm font-medium">
                  {currentPhoto.story_title}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {canEdit && albums.length > 0 && onMovePhoto && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowMoveDialog(true)}
                  className="text-white hover:bg-white/20"
                  title="Move to album"
                >
                  <MoveHorizontal className="h-5 w-5" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={handleDownload}
                className="text-white hover:bg-white/20"
              >
                <Download className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Image */}
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={currentPhoto.url || currentPhoto.file_path}
            alt={currentPhoto.caption || currentPhoto.story_title || 'Photo'}
            className="max-w-full max-h-full object-contain"
          />

          {/* Navigation Buttons */}
          {hasPrev && (
            <Button
              size="icon"
              variant="ghost"
              onClick={goToPrevious}
              className="absolute left-4 text-white hover:bg-white/20 h-12 w-12"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}
          {hasNext && (
            <Button
              size="icon"
              variant="ghost"
              onClick={goToNext}
              className="absolute right-4 text-white hover:bg-white/20 h-12 w-12"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}
        </div>

        {/* Caption Footer */}
        {showCaption && (currentPhoto.caption || currentPhoto.date || currentPhoto.story_title) && (
          <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent p-6">
            <div className="max-w-3xl mx-auto space-y-2">
              {currentPhoto.caption && (
                <p className="text-white text-lg leading-relaxed">
                  {currentPhoto.caption}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-white/80">
                {currentPhoto.date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(currentPhoto.date), 'MMMM d, yyyy')}
                  </div>
                )}
                {currentPhoto.story_title && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    From: {currentPhoto.story_title}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Keyboard hints */}
        <div className="absolute bottom-4 right-4 text-xs text-white/60 space-y-1">
          <div>← → to navigate</div>
          <div>C to toggle caption</div>
          <div>ESC to close</div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
