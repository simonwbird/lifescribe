import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { MediaService } from '@/lib/mediaService'

interface AlbumGridProps {
  photos: any[]
  onPhotoClick: (index: number) => void
}

export function AlbumGrid({ photos, onPhotoClick }: AlbumGridProps) {
  if (!photos || photos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No photos in this album
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo, index) => (
        <Card
          key={photo.id}
          className="overflow-hidden cursor-pointer group hover:shadow-lg transition-all"
          onClick={() => onPhotoClick(index)}
        >
          {/* Image */}
          <div className="aspect-square relative overflow-hidden bg-muted">
            <img
              src={photo.url || MediaService.getSignedMediaUrl(photo.file_path)}
              alt={photo.caption || photo.story_title || 'Photo'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                const pub = MediaService.getMediaUrl(photo.file_path)
                ;(e.currentTarget as HTMLImageElement).src = pub
              }}
            />
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                {photo.caption && (
                  <p className="text-xs line-clamp-2 mb-1">
                    {photo.caption}
                  </p>
                )}
                {photo.date && (
                  <div className="flex items-center gap-1 text-xs text-white/80">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(photo.date), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
