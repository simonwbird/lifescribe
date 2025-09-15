import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Filter, 
  MessageSquare, 
  Camera, 
  Mic, 
  Calendar,
  Pin
} from 'lucide-react'
import { Person, UserRole, canAddContent } from '@/utils/personUtils'

interface PersonTimelineProps {
  person: Person
  userRole: UserRole
  onRefresh: () => void
}

type TimelineFilter = 'all' | 'stories' | 'voice' | 'photos' | 'events'

export function PersonTimeline({ person, userRole, onRefresh }: PersonTimelineProps) {
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>('all')
  const canUserAddContent = canAddContent(userRole)

  const filters: { key: TimelineFilter; label: string; icon: any }[] = [
    { key: 'all', label: 'All', icon: Filter },
    { key: 'stories', label: 'Stories', icon: MessageSquare },
    { key: 'voice', label: 'Voice', icon: Mic },
    { key: 'photos', label: 'Photos', icon: Camera },
    { key: 'events', label: 'Life Events', icon: Calendar }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
        <div className="flex flex-wrap gap-2">
          {filters.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={activeFilter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(key)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Empty state */}
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              No memories yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Start this {person.is_living === false ? 'Tribute' : 'Life'} Page with a quick note.
            </p>
            {canUserAddContent && (
              <Button>
                Record a memory {person.is_living === false ? 'of' : 'for'} {person.given_name}
              </Button>
            )}
          </div>
          
          {/* TODO: Render timeline items */}
          {/* This will be populated with stories, photos, voice notes, and life events */}
        </div>
      </CardContent>
    </Card>
  )
}