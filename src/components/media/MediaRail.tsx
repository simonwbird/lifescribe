import React, { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Heart, 
  MapPin,
  Calendar
} from 'lucide-react'
import { MediaItem, Person, Album, Place, MediaRail as MediaRailType } from '@/lib/mediaTypes'
import { cn } from '@/lib/utils'

interface MediaRailProps {
  rail: MediaRailType
  onItemClick: (item: MediaItem | Person | Album | Place) => void
  onLoadMore?: () => void
}

export function MediaRail({ rail, onItemClick, onLoadMore }: MediaRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320 // Width of one item + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const renderMediaItem = (item: MediaItem) => (
    <Card 
      key={item.id}
      className="w-80 flex-shrink-0 cursor-pointer hover:shadow-lg transition-all duration-200 group snap-start"
      onClick={() => onItemClick(item)}
    >
      <CardContent className="p-0">
        <div className="relative aspect-[16/10] rounded-t-lg overflow-hidden">
          <img 
            src={item.thumbUrl} 
            alt={item.caption || 'Media item'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              // Fallback to a placeholder if image fails to load
              e.currentTarget.src = `https://picsum.photos/400/300?random=${item.id}`
            }}
          />
          {item.type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/50 rounded-full p-2">
                <Play className="h-6 w-6 text-white fill-white" />
              </div>
            </div>
          )}
          {item.type === 'voice' && (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 flex items-end justify-start p-3">
              <Badge variant="secondary" className="text-xs">
                {Math.floor((item.duration || 0) / 60)}:{String((item.duration || 0) % 60).padStart(2, '0')}
              </Badge>
            </div>
          )}
          {item.favoriteCount > 0 && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                {item.favoriteCount}
              </Badge>
            </div>
          )}
        </div>
        <div className="p-3">
          <h4 className="font-medium text-sm line-clamp-2 mb-1">
            {item.caption || `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} from ${new Date(item.takenAt).toLocaleDateString()}`}
          </h4>
          <p className="text-xs text-muted-foreground">
            {new Date(item.takenAt).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  )

  const renderPersonItem = (person: Person) => (
    <Card 
      key={person.id}
      className="w-64 flex-shrink-0 cursor-pointer hover:shadow-lg transition-all duration-200 group snap-start"
      onClick={() => onItemClick(person)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={person.avatarUrl} alt={person.name} />
            <AvatarFallback>{person.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h4 className="font-medium text-sm">{person.name}</h4>
            <p className="text-xs text-muted-foreground">{person.mediaCount} items</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {person.recentMediaIds.slice(0, 3).map((mediaId, index) => (
            <div key={mediaId} className="aspect-square bg-muted rounded overflow-hidden">
              {/* Placeholder for recent media thumbnails */}
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const renderAlbumItem = (album: Album) => (
    <Card 
      key={album.id}
      className="w-80 flex-shrink-0 cursor-pointer hover:shadow-lg transition-all duration-200 group snap-start"
      onClick={() => onItemClick(album)}
    >
      <CardContent className="p-0">
        <div className="relative aspect-[16/10] rounded-t-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/40">
          {album.coverMediaId && (
            <div className="w-full h-full bg-muted" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 flex items-end justify-start p-3">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {album.mediaIds.length} items
            </Badge>
          </div>
        </div>
        <div className="p-3">
          <h4 className="font-medium text-sm line-clamp-1 mb-1">{album.name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {album.description || 'No description'}
          </p>
        </div>
      </CardContent>
    </Card>
  )

  const renderPlaceItem = (place: Place) => (
    <Card 
      key={place.id}
      className="w-80 flex-shrink-0 cursor-pointer hover:shadow-lg transition-all duration-200 group snap-start"
      onClick={() => onItemClick(place)}
    >
      <CardContent className="p-0">
        <div className="relative aspect-[16/10] rounded-t-lg overflow-hidden bg-gradient-to-br from-green-100 to-green-200">
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="h-8 w-8 text-green-600" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 flex items-end justify-start p-3">
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {place.mediaCount} items
            </Badge>
          </div>
        </div>
        <div className="p-3">
          <h4 className="font-medium text-sm line-clamp-1 mb-1">{place.name}</h4>
          <p className="text-xs text-muted-foreground">
            {place.coordinates ? 
              `${place.coordinates.latitude.toFixed(4)}, ${place.coordinates.longitude.toFixed(4)}` : 
              'Location data unavailable'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  )

  const renderItem = (item: MediaItem | Person | Album | Place) => {
    if ('type' in item) return renderMediaItem(item as MediaItem)
    if ('mediaCount' in item && 'recentMediaIds' in item) return renderPersonItem(item as Person)
    if ('mediaIds' in item) return renderAlbumItem(item as Album)
    return renderPlaceItem(item as Place)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{rail.title}</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll('left')}
            className="h-8 w-8 p-0"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll('right')}
            className="h-8 w-8 p-0"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative">
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {rail.items.map(renderItem)}
          
          {rail.hasMore && onLoadMore && (
            <Button
              variant="outline"
              className="w-80 flex-shrink-0 h-32 border-dashed snap-start"
              onClick={onLoadMore}
            >
              Load More
            </Button>
          )}
        </div>
        
        {/* Gradient fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>
    </div>
  )
}