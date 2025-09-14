import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Play, Heart, Clock, FileText } from 'lucide-react'
import { MediaItem, ViewOption } from '@/lib/mediaTypes'
import { cn } from '@/lib/utils'

interface MediaGridProps {
  items: MediaItem[]
  view: ViewOption
  onItemClick: (item: MediaItem, index: number) => void
  onLoadMore?: () => void
  hasMore: boolean
  loading?: boolean
}

export function MediaGrid({ 
  items, 
  view, 
  onItemClick, 
  onLoadMore, 
  hasMore, 
  loading 
}: MediaGridProps) {
  const renderPhotoItem = (item: MediaItem, index: number) => (
    <Card 
      key={item.id}
      className="cursor-pointer hover:shadow-lg transition-all duration-200 group overflow-hidden"
      onClick={() => onItemClick(item, index)}
    >
      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden">
          <img 
            src={item.thumbUrl} 
            alt={item.caption || 'Photo'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {item.favoriteCount > 0 && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                {item.favoriteCount}
              </Badge>
            </div>
          )}
        </div>
        {view !== 'grid' && (
          <div className="p-3">
            <h4 className="font-medium text-sm line-clamp-2 mb-1">
              {item.caption || `Photo from ${new Date(item.takenAt).toLocaleDateString()}`}
            </h4>
            <p className="text-xs text-muted-foreground">
              {new Date(item.takenAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderVideoItem = (item: MediaItem, index: number) => (
    <Card 
      key={item.id}
      className="cursor-pointer hover:shadow-lg transition-all duration-200 group overflow-hidden"
      onClick={() => onItemClick(item, index)}
    >
      <CardContent className="p-0">
        <div className="relative aspect-video overflow-hidden">
          <img 
            src={item.posterUrl || item.thumbUrl} 
            alt={item.caption || 'Video'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/50 rounded-full p-3 group-hover:bg-black/70 transition-colors">
              <Play className="h-6 w-6 text-white fill-white" />
            </div>
          </div>
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {Math.floor((item.duration || 0) / 60)}:{String((item.duration || 0) % 60).padStart(2, '0')}
            </Badge>
          </div>
          {item.favoriteCount > 0 && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                {item.favoriteCount}
              </Badge>
            </div>
          )}
        </div>
        {view !== 'grid' && (
          <div className="p-3">
            <h4 className="font-medium text-sm line-clamp-2 mb-1">
              {item.caption || `Video from ${new Date(item.takenAt).toLocaleDateString()}`}
            </h4>
            <p className="text-xs text-muted-foreground">
              {new Date(item.takenAt).toLocaleDateString()} • {Math.floor((item.duration || 0) / 60)}:{String((item.duration || 0) % 60).padStart(2, '0')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderVoiceItem = (item: MediaItem, index: number) => (
    <Card 
      key={item.id}
      className="cursor-pointer hover:shadow-lg transition-all duration-200 group"
      onClick={() => onItemClick(item, index)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="h-6 w-6 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm line-clamp-2 mb-1">
              {item.caption || `Voice recording from ${new Date(item.takenAt).toLocaleDateString()}`}
            </h4>
            <p className="text-xs text-muted-foreground mb-2">
              {new Date(item.takenAt).toLocaleDateString()} • {Math.floor((item.duration || 0) / 60)}:{String((item.duration || 0) % 60).padStart(2, '0')}
            </p>
            {item.transcriptText && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {item.transcriptText}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {item.favoriteCount > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                {item.favoriteCount}
              </Badge>
            )}
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Play className="h-4 w-4 text-primary fill-primary" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderItem = (item: MediaItem, index: number) => {
    switch (item.type) {
      case 'photo':
        return renderPhotoItem(item, index)
      case 'video':
        return renderVideoItem(item, index)
      case 'voice':
        return renderVoiceItem(item, index)
      default:
        return null
    }
  }

  const getGridClasses = () => {
    switch (view) {
      case 'grid':
        return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
      case 'strip':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
      case 'timeline':
        return 'grid grid-cols-1 gap-4'
      default:
        return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No media found</h3>
        <p className="text-muted-foreground max-w-sm">
          Try adjusting your filters or upload some media to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className={cn(getGridClasses())}>
        {items.map(renderItem)}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loading}
            className="px-8"
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  )
}