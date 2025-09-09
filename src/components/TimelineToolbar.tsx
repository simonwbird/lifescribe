import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ZoomIn, ZoomOut, Plus, Link } from 'lucide-react'
import { ZoomLevel } from '@/lib/timelineBuckets'

interface TimelineToolbarProps {
  zoom: ZoomLevel
  onZoomChange: (zoom: ZoomLevel) => void
  filters: {
    stories: boolean
    answers: boolean
    photos: boolean
  }
  onFilterChange: (filters: { stories: boolean; answers: boolean; photos: boolean }) => void
  onAddMemory: () => void
  onLinkExisting: () => void
}

const zoomLevels: ZoomLevel[] = ['decade', 'year', 'month', 'day']

export function TimelineToolbar({
  zoom,
  onZoomChange,
  filters,
  onFilterChange,
  onAddMemory,
  onLinkExisting
}: TimelineToolbarProps) {
  const currentIndex = zoomLevels.indexOf(zoom)
  
  const zoomIn = () => {
    if (currentIndex < zoomLevels.length - 1) {
      onZoomChange(zoomLevels[currentIndex + 1])
    }
  }
  
  const zoomOut = () => {
    if (currentIndex > 0) {
      onZoomChange(zoomLevels[currentIndex - 1])
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={zoomOut}
          disabled={currentIndex === 0}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <div className="flex gap-1">
          {zoomLevels.map((level) => (
            <Button
              key={level}
              variant={zoom === level ? "default" : "outline"}
              size="sm"
              onClick={() => onZoomChange(level)}
              className="capitalize"
            >
              {level}
            </Button>
          ))}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={zoomIn}
          disabled={currentIndex === zoomLevels.length - 1}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-2">
          <Badge
            variant={filters.stories ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onFilterChange({ ...filters, stories: !filters.stories })}
          >
            Stories
          </Badge>
          <Badge
            variant={filters.answers ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onFilterChange({ ...filters, answers: !filters.answers })}
          >
            Memories
          </Badge>
          <Badge
            variant={filters.photos ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onFilterChange({ ...filters, photos: !filters.photos })}
          >
            Photos
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onLinkExisting}>
            <Link className="h-4 w-4 mr-2" />
            Link Existing
          </Button>
          <Button size="sm" onClick={onAddMemory}>
            <Plus className="h-4 w-4 mr-2" />
            Add Memory
          </Button>
        </div>
      </div>
    </div>
  )
}