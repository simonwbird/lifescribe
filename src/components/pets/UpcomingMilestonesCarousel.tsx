import { useUpcomingMilestones } from '@/hooks/usePetMilestones'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Cake, Heart, Sparkles } from 'lucide-react'
import { MilestoneType } from '@/lib/petMilestoneTypes'

interface UpcomingMilestonesCarouselProps {
  familyId: string | null
}

export function UpcomingMilestonesCarousel({ familyId }: UpcomingMilestonesCarouselProps) {
  const { data: milestones, isLoading } = useUpcomingMilestones(familyId, 30)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (!milestones || milestones.length === 0) {
    return null
  }

  const getMilestoneIcon = (type?: MilestoneType) => {
    switch (type) {
      case 'birthday':
        return <Cake className="h-4 w-4 text-primary" />
      case 'gotcha_anniversary':
        return <Heart className="h-4 w-4 text-primary" />
      default:
        return <Sparkles className="h-4 w-4 text-primary" />
    }
  }

  const getCountdownText = (daysUntil: number) => {
    if (daysUntil === 0) return 'Today!'
    if (daysUntil === 1) return 'Tomorrow'
    return `In ${daysUntil} days`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Milestones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {milestones.slice(0, 5).map((milestone) => (
            <div
              key={milestone.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={milestone.petAvatar} alt={milestone.petName} />
                <AvatarFallback>
                  {milestone.petName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getMilestoneIcon(milestone.milestoneType)}
                  <h4 className="font-medium text-sm truncate">{milestone.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground">{milestone.petName}</p>
              </div>
              
              <div className="text-right flex-shrink-0">
                <div className={cn(
                  "text-sm font-medium",
                  milestone.daysUntil === 0 && "text-primary"
                )}>
                  {getCountdownText(milestone.daysUntil)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
