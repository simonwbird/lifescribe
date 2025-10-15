import { Pet } from '@/lib/petTypes'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Loader2 } from 'lucide-react'

interface PetGalleryProps {
  pet: Pet
}

export function PetGallery({ pet }: PetGalleryProps) {
  const { data: media, isLoading } = useQuery({
    queryKey: ['pet-media', pet.id],
    queryFn: async () => {
      // Get media linked to stories about this pet
      const { data: links } = await supabase
        .from('story_pet_links')
        .select('story_id')
        .eq('pet_id', pet.id)

      if (!links || links.length === 0) return []

      const storyIds = links.map(l => l.story_id)
      
      const { data: mediaData, error } = await supabase
        .from('media')
        .select('*')
        .in('story_id', storyIds)
        .eq('mime_type', 'image/%')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return mediaData || []
    },
    enabled: !!pet.id
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!media || media.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No photos yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Upload photos in stories tagged with {pet.name}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {media.map((item) => (
        <div
          key={item.id}
          className="aspect-square rounded-lg overflow-hidden bg-muted"
        >
          <img
            src={item.file_path}
            alt={item.file_name || ''}
            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
          />
        </div>
      ))}
    </div>
  )
}
