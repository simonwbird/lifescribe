import { memo } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { StoryWithPets } from '@/hooks/usePetStories'

interface PetStoryCardProps {
  story: StoryWithPets
}

export const PetStoryCard = memo(function PetStoryCard({ story }: PetStoryCardProps) {
  const authorName = story.profiles?.full_name || 'Unknown'
  const authorAvatar = story.profiles?.avatar_url
  const timeAgo = formatDistanceToNow(new Date(story.created_at), { addSuffix: true })
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <Link 
          to={`/stories/${story.id}`}
          className="block group"
        >
          <h3 className="font-serif text-h5 text-foreground group-hover:text-brand-700 transition-colors mb-2">
            {story.title}
          </h3>
          
          {story.content && (
            <p className="text-body-sm text-muted-foreground line-clamp-2 mb-3">
              {story.content}
            </p>
          )}
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Avatar className="w-6 h-6">
              {authorAvatar ? (
                <AvatarImage src={authorAvatar} alt={authorName} />
              ) : (
                <AvatarFallback className="text-xs">
                  {authorName.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
            <span>{authorName}</span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>
        </Link>
      </CardContent>
    </Card>
  )
})
