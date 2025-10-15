import { Pet } from '@/lib/petTypes'
import { usePetStories } from '@/hooks/usePetStories'
import { PetStoryCard } from './PetStoryCard'
import { Loader2 } from 'lucide-react'

interface PetTimelineProps {
  pet: Pet
}

export function PetTimeline({ pet }: PetTimelineProps) {
  const { data: stories, isLoading } = usePetStories(pet.id, 20)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!stories || stories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No stories yet for {pet.name}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Tag {pet.name} in a story to see it here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {stories.map((story) => (
        <PetStoryCard key={story.id} story={story} />
      ))}
    </div>
  )
}
