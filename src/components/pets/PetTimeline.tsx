import { Pet } from '@/lib/petTypes'
import { usePetStories } from '@/hooks/usePetStories'
import { usePetMilestones } from '@/hooks/usePetMilestones'
import { PetStoryCard } from './PetStoryCard'
import { MilestoneCard } from './MilestoneCard'
import { AddMilestoneModal } from './AddMilestoneModal'
import { Button } from '@/components/ui/button'
import { Loader2, Plus } from 'lucide-react'
import { useState } from 'react'

interface PetTimelineProps {
  pet: Pet
}

export function PetTimeline({ pet }: PetTimelineProps) {
  const { data: stories, isLoading: storiesLoading } = usePetStories(pet.id, 20)
  const { data: milestones, isLoading: milestonesLoading } = usePetMilestones(pet.id)
  const [showAddMilestone, setShowAddMilestone] = useState(false)
  const isLoading = storiesLoading || milestonesLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const hasContent = (stories && stories.length > 0) || (milestones && milestones.length > 0)

  if (!hasContent) {
    return (
      <>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No stories or milestones yet for {pet.name}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Tag {pet.name} in a story or add a milestone
          </p>
          <Button
            onClick={() => setShowAddMilestone(true)}
            className="mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Milestone
          </Button>
        </div>
        <AddMilestoneModal
          open={showAddMilestone}
          onOpenChange={setShowAddMilestone}
          petId={pet.id}
          petName={pet.name}
        />
      </>
    )
  }

  // Combine and sort stories and milestones by date
  const timelineItems: Array<{ type: 'story' | 'milestone'; date: string; data: any }> = [
    ...(stories || []).map(story => ({
      type: 'story' as const,
      date: story.created_at,
      data: story,
    })),
    ...(milestones || []).map(milestone => ({
      type: 'milestone' as const,
      date: milestone.date,
      data: milestone,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => setShowAddMilestone(true)}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Milestone
        </Button>
      </div>
      
      <div className="space-y-4">
        {timelineItems.map((item, index) => (
          item.type === 'story' ? (
            <PetStoryCard key={`story-${item.data.id}`} story={item.data} />
          ) : (
            <MilestoneCard key={`milestone-${item.data.id}`} milestone={item.data} />
          )
        ))}
      </div>

      <AddMilestoneModal
        open={showAddMilestone}
        onOpenChange={setShowAddMilestone}
        petId={pet.id}
        petName={pet.name}
      />
    </>
  )
}
