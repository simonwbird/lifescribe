import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/design-system/EmptyState'
import { Image as ImageIcon, FolderOpen, Grid3x3, Plus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlbumGrid } from './photo-gallery/AlbumGrid'
import { PhotoLightbox } from './photo-gallery/PhotoLightbox'
import { AlbumManager } from './photo-gallery/AlbumManager'

interface PhotoGalleryBlockProps {
  personId: string
  familyId: string
  blockContent?: any
  canEdit: boolean
  onUpdate?: () => void
}

export default function PhotoGalleryBlock({
  personId,
  familyId,
  blockContent,
  canEdit,
  onUpdate
}: PhotoGalleryBlockProps) {
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [showAlbumManager, setShowAlbumManager] = useState(false)

  // Fetch photos from stories and media linked to this person
  const { data: photos, isLoading, refetch } = useQuery({
    queryKey: ['person-photos', personId, familyId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Get all media for stories linked to this person
      const { data: media, error: mediaError } = await supabase
        .from('media')
        .select(`
          id,
          file_path,
          mime_type,
          created_at,
          caption,
          story_id,
          stories!story_id(
            id,
            title,
            occurred_on,
            created_at,
            person_story_links!inner(person_id)
          )
        `)
        .eq('family_id', familyId)
        .eq('stories.person_story_links.person_id', personId)
        .ilike('mime_type', 'image/%')

      if (mediaError) {
        console.error('Media query error:', mediaError)
        throw mediaError
      }

      // Format the media with story info
      const allMedia = (media || []).map((m: any) => {
        const story = m.stories
        return {
          id: m.id,
          file_path: m.file_path,
          mime_type: m.mime_type,
          created_at: m.created_at,
          caption: m.caption,
          story_id: m.story_id,
          story_title: story?.title,
          date: story?.occurred_on || story?.created_at || m.created_at
        }
      })

      return allMedia
    }
  })

  // Auto-generate albums by decade
  const albums = useMemo(() => {
    if (!photos || photos.length === 0) return []

    const albumMap = new Map<string, any[]>()
    
    photos.forEach((photo: any) => {
      const date = photo.date ? new Date(photo.date) : new Date(photo.created_at)
      const year = date.getFullYear()
      const decade = Math.floor(year / 10) * 10
      const decadeLabel = `${decade}s`
      
      if (!albumMap.has(decadeLabel)) {
        albumMap.set(decadeLabel, [])
      }
      albumMap.get(decadeLabel)!.push(photo)
    })

    // Convert to array and sort by decade (newest first)
    return Array.from(albumMap.entries())
      .map(([name, photos]) => ({
        id: name.toLowerCase(),
        name,
        count: photos.length,
        cover: photos[0],
        photos
      }))
      .sort((a, b) => b.name.localeCompare(a.name))
  }, [photos])

  // Get photos for selected album
  const displayPhotos = useMemo(() => {
    if (!photos) return []
    
    if (selectedAlbum === 'all') {
      return photos
    }
    
    const album = albums.find(a => a.id === selectedAlbum)
    return album?.photos || []
  }, [photos, albums, selectedAlbum])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">
          Loading photos...
        </div>
      </div>
    )
  }

  if (!photos || photos.length === 0) {
    return (
      <EmptyState
        icon={<ImageIcon className="h-6 w-6" />}
        title="No photos yet"
        description="Photos from stories will appear here automatically"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg font-semibold">Photo Gallery</h3>
          <p className="text-sm text-muted-foreground">
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'} • {albums.length} {albums.length === 1 ? 'album' : 'albums'}
          </p>
        </div>
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAlbumManager(true)}
            className="gap-2"
          >
            <FolderOpen className="h-4 w-4" />
            Manage Albums
          </Button>
        )}
      </div>

      {/* Album Tabs */}
      <Tabs value={selectedAlbum} onValueChange={setSelectedAlbum}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all" className="gap-2">
            <Grid3x3 className="h-4 w-4" />
            All Photos
          </TabsTrigger>
          {albums.map((album) => (
            <TabsTrigger key={album.id} value={album.id} className="gap-2">
              {album.name}
              <span className="text-xs text-muted-foreground">({album.count})</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedAlbum} className="mt-6">
          <AlbumGrid
            photos={displayPhotos}
            onPhotoClick={(index) => setLightboxIndex(index)}
          />
        </TabsContent>
      </Tabs>

      {/* Lightbox */}
      {lightboxIndex !== null && (
      <PhotoLightbox
        photos={displayPhotos}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
        canEdit={canEdit}
        albums={albums}
        currentAlbumId={selectedAlbum}
        onMovePhoto={(photoId, targetAlbumId) => {
          // TODO: Implement photo moving logic
          console.log('Move photo', photoId, 'to', targetAlbumId)
          refetch()
        }}
      />
      )}

      {/* Album Manager */}
      {showAlbumManager && (
        <AlbumManager
          open={showAlbumManager}
          onOpenChange={setShowAlbumManager}
          albums={albums}
          personId={personId}
          familyId={familyId}
          onUpdate={() => {
            refetch()
            onUpdate?.()
          }}
        />
      )}
    </div>
  )
}
