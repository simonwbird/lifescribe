import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Home, Calendar } from 'lucide-react'

interface PropertyStoryCardProps {
  story: {
    id: string
    title: string
    content?: string
    created_at: string
    profile: {
      id: string
      full_name: string | null
      avatar_url: string | null
    } | null
  }
  property: {
    id: string
    title: string
  }
}

export function PropertyStoryCard({ story, property }: PropertyStoryCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={story.profile?.avatar_url || ''} />
            <AvatarFallback>
              {story.profile?.full_name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <Link 
                to={`/stories/${story.id}`}
                className="font-medium text-foreground hover:underline line-clamp-2"
              >
                {story.title}
              </Link>
            </div>
            
            {story.content && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {story.content}
              </p>
            )}
            
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/properties/${property.id}`}>
                <Badge variant="secondary" className="text-xs">
                  <Home className="w-3 h-3 mr-1" />
                  {property.title}
                </Badge>
              </Link>
              
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(story.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
