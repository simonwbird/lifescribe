import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { X, ExternalLink, Calendar, MapPin, Users } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useNavigate } from 'react-router-dom'
import { formatForUser, getCurrentUserRegion } from '@/utils/date'
import ReactionBar from '@/components/ReactionBar'
import CommentThread from '@/components/CommentThread'

interface Story {
  id: string
  title: string
  content?: string
  created_at: string
  profile_id: string
  family_id: string
  location?: string
  occurred_on?: string
  tags?: string[]
}

interface Profile {
  id: string
  full_name?: string
  avatar_url?: string
}

interface Media {
  id: string
  file_path: string
  mime_type: string
}

interface InlineStoryViewerProps {
  storyId: string
  familyId: string
  onClose: () => void
  onOpenFull: () => void
}

export function InlineStoryViewer({ 
  storyId, 
  familyId, 
  onClose, 
  onOpenFull 
}: InlineStoryViewerProps) {
  const [story, setStory] = useState<Story | null>(null)
  const [author, setAuthor] = useState<Profile | null>(null)
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchStoryData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch story
        const { data: storyData, error: storyError } = await supabase
          .from('stories')
          .select('*')
          .eq('id', storyId)
          .eq('family_id', familyId)
          .single()

        if (storyError) {
          throw new Error('Story not found or access denied')
        }

        setStory(storyData)

        // Fetch author profile
        const { data: profileData } = await supabase
          .from('family_member_profiles')
          .select('id, full_name, avatar_url')
          .eq('id', storyData.profile_id)
          .single()

        setAuthor(profileData)

        // Fetch media
        const { data: mediaData } = await supabase
          .from('media')
          .select('id, file_path, mime_type')
          .eq('story_id', storyId)
          .order('created_at')

        setMedia(mediaData || [])

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load story')
      } finally {
        setLoading(false)
      }
    }

    fetchStoryData()
  }, [storyId, familyId])

  const handleOpenFullStory = () => {
    navigate(`/stories/${storyId}`)
    onOpenFull()
  }

  const getContentPreview = (content?: string) => {
    if (!content) return null
    const maxLength = 300
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  const hasVoiceRecording = media.some(m => m.mime_type.startsWith('audio/'))
  const hasPhotos = media.some(m => m.mime_type.startsWith('image/'))
  const hasVideo = media.some(m => m.mime_type.startsWith('video/'))

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !story) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Story Unavailable</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-muted-foreground">{error || 'This story could not be loaded.'}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full border-2 border-primary/20">
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold line-clamp-1">{story.title}</h3>
            <div className="flex gap-1">
              {hasVoiceRecording && (
                <Badge variant="secondary" className="text-xs">Audio</Badge>
              )}
              {hasPhotos && (
                <Badge variant="secondary" className="text-xs">Photos</Badge>
              )}
              {hasVideo && (
                <Badge variant="secondary" className="text-xs">Video</Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleOpenFullStory}>
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Author Info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={author?.avatar_url || ''} alt={author?.full_name || 'User'} />
            <AvatarFallback>
              {author?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{author?.full_name || 'Unknown Author'}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatForUser(story.created_at, 'relative', getCurrentUserRegion())}
              </div>
              {story.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {story.location}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Preview */}
        {story.content && (
          <div className="space-y-2">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {getContentPreview(story.content)}
            </p>
            {story.content.length > 300 && (
              <Button 
                variant="link" 
                size="sm" 
                className="h-auto p-0 text-primary"
                onClick={handleOpenFullStory}
              >
                Read full story
              </Button>
            )}
          </div>
        )}

        {/* Media Preview */}
        {media.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {media.slice(0, 3).map((item) => (
                <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  {item.mime_type.startsWith('image/') && (
                    <img
                      src={item.file_path}
                      alt="Story image"
                      className="w-full h-full object-cover"
                    />
                  )}
                  {item.mime_type.startsWith('video/') && (
                    <video
                      src={item.file_path}
                      className="w-full h-full object-cover"
                      preload="metadata"
                    />
                  )}
                </div>
              ))}
            </div>
            {media.length > 3 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleOpenFullStory}
              >
                View all {media.length} items
              </Button>
            )}
          </div>
        )}

        {/* Tags */}
        {story.tags && story.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {story.tags.slice(0, 5).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {story.tags.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{story.tags.length - 5} more
              </Badge>
            )}
          </div>
        )}

        {/* Social Actions */}
        <div className="space-y-4 pt-4 border-t">
          <ReactionBar 
            targetType="story" 
            targetId={story.id}
            familyId={familyId}
          />
          
          <CommentThread
            targetType="story"
            targetId={story.id}
            familyId={familyId}
          />
        </div>
      </CardContent>
    </Card>
  )
}