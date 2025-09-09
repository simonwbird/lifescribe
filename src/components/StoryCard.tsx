import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import ReactionBar from './ReactionBar'
import CommentThread from './CommentThread'
import { Link } from 'react-router-dom'
import type { Story, Profile, Media } from '@/lib/types'

interface StoryCardProps {
  story: Story & { profiles: Profile }
}

export default function StoryCard({ story }: StoryCardProps) {
  const [media, setMedia] = useState<Media[]>([])
  const [mediaUrls, setMediaUrls] = useState<string[]>([])

  useEffect(() => {
    const getMedia = async () => {
      const { data } = await supabase
        .from('media')
        .select('*')
        .eq('story_id', story.id)
        .order('created_at')

      if (data) {
        setMedia(data)
        
        // Get signed URLs for media
        const urls = await Promise.all(
          data.map(async (item) => {
            const { data: { signedUrl } } = await supabase.storage
              .from('media')
              .createSignedUrl(item.file_path, 3600)
            return signedUrl || ''
          })
        )
        setMediaUrls(urls.filter(Boolean))
      }
    }

    getMedia()
  }, [story.id])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={story.profiles.avatar_url || ''} />
            <AvatarFallback>
              {story.profiles.full_name?.charAt(0) || story.profiles.email.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg">
              <Link to={`/stories/${story.id}`} className="hover:underline">
                {story.title}
              </Link>
            </CardTitle>
            <CardDescription>
              by {story.profiles.full_name || story.profiles.email} • {' '}
              {new Date(story.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose max-w-none">
          <p className="whitespace-pre-wrap">{story.content}</p>
        </div>

        {mediaUrls.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {mediaUrls.map((url, index) => {
              const mediaItem = media[index]
              if (mediaItem?.mime_type.startsWith('image/')) {
                return (
                  <img
                    key={index}
                    src={url}
                    alt={mediaItem.file_name}
                    className="rounded-lg max-h-64 object-cover w-full"
                  />
                )
              } else if (mediaItem?.mime_type.startsWith('video/')) {
                return (
                  <video
                    key={index}
                    src={url}
                    controls
                    className="rounded-lg max-h-64 w-full"
                  />
                )
              }
              return null
            })}
          </div>
        )}

        {story.tags && story.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {story.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <ReactionBar 
          targetType="story" 
          targetId={story.id}
          familyId={story.family_id}
        />
        
        <CommentThread 
          targetType="story" 
          targetId={story.id}
          familyId={story.family_id}
        />
      </CardContent>
    </Card>
  )
}