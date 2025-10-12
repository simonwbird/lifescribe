import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { EmptyState } from '@/components/design-system/EmptyState'
import { Image as ImageIcon, FolderOpen, Grid3x3, Plus, Users } from 'lucide-react'
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
  const [selectedTaggedPerson, setSelectedTaggedPerson] = useState<string | null>(null)

  // Fetch photos from stories and media linked to this person OR tagged in photos
  const { data: photos, isLoading, refetch } = useQuery({
    queryKey: ['person-photos', personId, familyId],
    queryFn: async () => {
      // 1) Find stories this person is linked to
      const { data: links, error: linksError } = await supabase
        .from('person_story_links')
        .select('story_id')
        .eq('person_id', personId)

      if (linksError) throw linksError

      const storyIds = (links || []).map((l: any) => l.story_id).filter(Boolean)
      
      // 2) Also find photos where this person is tagged
      const { data: faceTags, error: faceTagsError } = await supabase
        .from('face_tags')
        .select('media_id')
        .eq('person_id', personId)
        .eq('family_id', familyId)

      if (faceTagsError) throw faceTagsError

      const taggedMediaIds = (faceTags || []).map((t: any) => t.media_id).filter(Boolean)
      
      if (storyIds.length === 0 && taggedMediaIds.length === 0) return []

      // 3) Fetch media for those stories OR tagged media
      let query = supabase
        .from('media')
        .select('id, file_path, mime_type, created_at, story_id, individual_story_id')
        .eq('family_id', familyId)
        .ilike('mime_type', 'image/%')

      if (storyIds.length > 0 && taggedMediaIds.length > 0) {
        query = query.or(`story_id.in.(${storyIds.join(',')}),individual_story_id.in.(${storyIds.join(',')}),id.in.(${taggedMediaIds.join(',')})`)
      } else if (storyIds.length > 0) {
        query = query.or(`story_id.in.(${storyIds.join(',')}),individual_story_id.in.(${storyIds.join(',')})`)
      } else if (taggedMediaIds.length > 0) {
        query = query.in('id', taggedMediaIds)
      }

      const { data: mediaData, error: mediaError } = await query

      if (mediaError) throw mediaError

      if (!mediaData || mediaData.length === 0) return []

      // 4) Fetch story metadata for titles/dates
      const uniqueStoryIds = Array.from(new Set([
        ...mediaData.map((m: any) => m.story_id).filter(Boolean),
        ...mediaData.map((m: any) => m.individual_story_id).filter(Boolean)
      ]))

      const { data: storiesData, error: storiesError } = uniqueStoryIds.length > 0
        ? await supabase
            .from('stories')
            .select('id, title, occurred_on, created_at')
            .in('id', uniqueStoryIds)
        : { data: [], error: null } as any

      if (storiesError) throw storiesError

      const storiesMap = new Map<string, any>(((storiesData as any[]) || []).map((s: any) => [s.id, s]))

      // 5) Shape gallery items
      const baseMedia = (mediaData || []).map((m: any) => {
        const story = storiesMap.get(m.story_id) || storiesMap.get(m.individual_story_id)
        return {
          id: m.id,
          file_path: m.file_path,
          mime_type: m.mime_type,
          created_at: m.created_at,
          story_id: m.story_id || m.individual_story_id,
          story_title: story?.title,
          date: story?.occurred_on || story?.created_at || m.created_at
        }
      })

      // Generate signed URLs for all images (faster in batch)
      try {
        const paths = baseMedia.map((p: any) => p.file_path)
        const { data: signedUrls, error: signError } = await supabase
          .storage
          .from('media')
          .createSignedUrls(paths, 3600)

        if (signError) {
          console.warn('Signing media URLs failed, falling back to public URLs', signError)
        }

        const withUrls = baseMedia.map((p: any, idx: number) => {
          const signed = signedUrls?.[idx]?.signedUrl
          if (signed) return { ...p, url: signed }

          // Fallback to public URL (works if bucket/objects are public)
          const { data: pub } = supabase.storage.from('media').getPublicUrl(p.file_path)
          return { ...p, url: pub.publicUrl }
        })

        return withUrls
      } catch (e) {
        console.error('Error generating media URLs', e)
        return baseMedia
      }
    }
  })

  // Fetch tagged people in photos
  const { data: taggedPeople } = useQuery({
    queryKey: ['tagged-people', personId, familyId],
    queryFn: async () => {
      if (!photos || photos.length === 0) return []
      
      const mediaIds = photos.map((p: any) => p.id)
      
      // Get all face tags for these photos
      const { data: tags, error: tagsError } = await supabase
        .from('face_tags')
        .select('person_id')
        .in('media_id', mediaIds)
        .eq('family_id', familyId)
      
      if (tagsError) throw tagsError
      if (!tags || tags.length === 0) return []
      
      // Get unique person IDs
      const uniquePersonIds = [...new Set(tags.map((t: any) => t.person_id))]
      
      // Fetch person details
      const { data: people, error: peopleError } = await supabase
        .from('people')
        .select('id, given_name, surname')
        .in('id', uniquePersonIds)
      
      if (peopleError) throw peopleError
      
      return people || []
    },
    enabled: !!photos && photos.length > 0
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

  // Get photos for selected album and/or tagged person
  const displayPhotos = useMemo(() => {
    if (!photos) return []
    
    let filtered = photos
    
    // Filter by album
    if (selectedAlbum !== 'all') {
      const album = albums.find(a => a.id === selectedAlbum)
      filtered = album?.photos || []
    }
    
    // Further filter by tagged person if selected
    if (selectedTaggedPerson) {
      // We need to check which photos have this person tagged
      // This requires async data, so we'll handle it differently
      return filtered
    }
    
    return filtered
  }, [photos, albums, selectedAlbum, selectedTaggedPerson])
  
  // Filter photos by tagged person (async)
  const { data: filteredByTag } = useQuery({
    queryKey: ['photos-by-tag', selectedTaggedPerson, displayPhotos],
    queryFn: async () => {
      if (!selectedTaggedPerson || !displayPhotos) return displayPhotos
      
      const mediaIds = displayPhotos.map((p: any) => p.id)
      
      const { data: tags, error } = await supabase
        .from('face_tags')
        .select('media_id')
        .eq('person_id', selectedTaggedPerson)
        .in('media_id', mediaIds)
      
      if (error) throw error
      
      const taggedMediaIds = new Set(tags?.map((t: any) => t.media_id) || [])
      return displayPhotos.filter((p: any) => taggedMediaIds.has(p.id))
    },
    enabled: !!selectedTaggedPerson && !!displayPhotos
  })
  
  const finalPhotos = selectedTaggedPerson ? (filteredByTag || []) : displayPhotos

  const handleMovePhoto = async (photoId: string, targetAlbumId: string) => {
    // TODO: Implement album moving logic when albums are fully implemented
    console.log('Move photo', photoId, 'to album', targetAlbumId)
    refetch()
  }

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
        <div className="space-y-2">
          <h3 className="font-serif text-lg font-semibold">Photo Gallery</h3>
          <p className="text-sm text-muted-foreground">
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'} • {albums.length} {albums.length === 1 ? 'album' : 'albums'}
          </p>
          
          {/* Tagged People */}
          {taggedPeople && taggedPeople.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Tagged:</span>
              {taggedPeople.map((person: any) => (
                <Badge
                  key={person.id}
                  variant={selectedTaggedPerson === person.id ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedTaggedPerson(
                    selectedTaggedPerson === person.id ? null : person.id
                  )}
                >
                  <Avatar className="h-4 w-4 mr-1">
                    <AvatarFallback className="text-[10px]">
                      {person.given_name?.[0]}{person.surname?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  {person.given_name} {person.surname || ''}
                </Badge>
              ))}
            </div>
          )}
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
            photos={finalPhotos}
            onPhotoClick={(index) => setLightboxIndex(index)}
          />
        </TabsContent>
      </Tabs>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={finalPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
          canEdit={canEdit}
          albums={albums}
          currentAlbumId={selectedAlbum}
          onMovePhoto={handleMovePhoto}
          familyId={familyId}
          personId={personId}
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
