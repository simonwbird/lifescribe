import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Image, MessageSquare, Calendar } from 'lucide-react'
import { TimelineItem, ZoomLevel, bucketize, formatWhen } from '@/lib/timelineBuckets'

interface TimelineCanvasProps {
  items: TimelineItem[]
  zoom: ZoomLevel
  filters: {
    stories: boolean
    answers: boolean
    photos: boolean
  }
  onAddMemoryAt: (date: Date) => void
  onItemClick: (item: TimelineItem) => void
}

export function TimelineCanvas({
  items,
  zoom,
  filters,
  onAddMemoryAt,
  onItemClick
}: TimelineCanvasProps) {
  const [panX, setPanX] = useState(0)
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanX, setLastPanX] = useState(0)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Filter items based on active filters
  const filteredItems = items.filter(item => {
    if (item.item_type === 'story' && !filters.stories) return false
    if (item.item_type === 'answer' && !filters.answers) return false
    // Photos filter would check for items with media - simplified for now
    return true
  })

  const { buckets, undated } = bucketize(filteredItems, zoom)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true)
    setLastPanX(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return
    const deltaX = e.clientX - lastPanX
    setPanX(prev => prev + deltaX)
    setLastPanX(e.clientX)
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setPanX(prev => prev - e.deltaX)
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsPanning(false)
    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  const getItemIcon = (item: TimelineItem) => {
    if (item.item_type === 'story') return <MessageSquare className="h-4 w-4" />
    return <Clock className="h-4 w-4" />
  }

  const handleBucketClick = (bucketDate: string) => {
    const date = new Date(bucketDate)
    onAddMemoryAt(date)
  }

  return (
    <div className="flex-1 overflow-hidden">
      <div
        ref={canvasRef}
        className="h-full cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="flex h-full transition-transform duration-200"
          style={{ transform: `translateX(${panX}px)` }}
        >
          {/* Undated section */}
          {undated.length > 0 && (
            <div className="flex-shrink-0 w-64 p-4 border-r bg-muted/50">
              <h3 className="font-semibold mb-4 text-muted-foreground">Undated</h3>
              <div className="space-y-2">
                {undated.map((item) => (
                  <Card
                    key={item.item_id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onItemClick(item)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        {getItemIcon(item)}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.title}</h4>
                          {item.excerpt && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {item.excerpt}
                            </p>
                          )}
                          <Badge variant="outline" className="mt-2 text-xs">
                            {item.item_type === 'story' ? 'Story' : 'Memory'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Timeline buckets */}
          <div className="flex min-w-full">
            {buckets.map((bucket) => (
              <div key={bucket.key.iso} className="flex-shrink-0 border-r">
                <div className="p-4 border-b bg-background sticky top-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{bucket.key.label}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBucketClick(bucket.key.iso)}
                      className="text-xs"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>

                <div className="p-4 space-y-3" style={{ minWidth: zoom === 'day' ? '200px' : '160px' }}>
                  {bucket.items.map((item) => (
                    <Card
                      key={item.item_id}
                      className={`cursor-pointer hover:shadow-md transition-shadow ${
                        item.is_approx ? 'border-dashed' : ''
                      }`}
                      onClick={() => onItemClick(item)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          {getItemIcon(item)}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{item.title}</h4>
                            {item.excerpt && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {item.excerpt}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {item.item_type === 'story' ? 'Story' : 'Memory'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatWhen(item)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}