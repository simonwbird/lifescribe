import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react'
import { formatForUser, getCurrentUserRegion } from '@/utils/date'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { PrivacyBadge } from '@/components/ui/privacy-badge'
import { StoryImageGallery } from '@/components/story-view/StoryImageGallery'
import { StoryAssetRenderer } from '@/components/story-view/StoryAssetRenderer'
import { getSignedMediaUrl } from '@/lib/media'

interface Story {
  id: string
  title: string
  content: string
  created_at: string
  profile_id: string
  family_id: string
  media?: Array<{
    id: string
    file_path: string
    mime_type: string
  }>
  profile: {
    id: string
    full_name: string
    avatar_url?: string
  }
  reactions_count: number
  comments_count: number
  user_has_liked: boolean
}

interface EnhancedStoryCardProps {
  story: Story
  onInteraction: (storyId: string, action: 'like' | 'comment' | 'share') => void
}

export function EnhancedStoryCard({ story, onInteraction }: EnhancedStoryCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [assets, setAssets] = useState<any[]>([])
  const [legacyVideo, setLegacyVideo] = useState<any | null>(null)
  const navigate = useNavigate()

  // Load story_assets for mixed content stories
  useEffect(() => {
    const loadAssets = async () => {
      const { data } = await supabase
        .from('story_assets')
        .select('id,type,url,thumbnail_url,transcoded_url,position,processing_state,metadata')
        .eq('story_id', story.id)
        .order('position')
      if (data) setAssets(data)
    }
    loadAssets()
  }, [story.id])

  // Legacy media array support: embed first video inline (signed URL)
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const media = story.media || []
      const vid = media.find((m: any) => m.mime_type && m.mime_type.startsWith('video/'))
      if (!vid) { setLegacyVideo(null); return }
      try {
        let url = await getSignedMediaUrl(vid.file_path, story.family_id)
        if (!url) {
          const { data } = supabase.storage.from('media').getPublicUrl(vid.file_path)
          url = data.publicUrl
        }
        if (!cancelled) {
          setLegacyVideo({
            id: vid.id,
            type: 'video',
            url,
            thumbnail_url: null,
            transcoded_url: null,
            position: 0,
            processing_state: null,
            metadata: { mime_type: vid.mime_type }
          })
        }
      } catch {
        if (!cancelled) setLegacyVideo(null)
      }
    }
    run()
    return () => { cancelled = true }
  }, [story.media, story.family_id])

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLiking) return
    
    setIsLiking(true)
    onInteraction(story.id, 'like')

    try {
      if (story.user_has_liked) {
        // Unlike
        await supabase
          .from('reactions')
          .delete()
          .eq('story_id', story.id)
          .eq('profile_id', (await supabase.auth.getUser()).data.user?.id)
      } else {
        // Like
        await supabase
          .from('reactions')
          .insert({
            story_id: story.id,
            family_id: story.family_id,
            reaction_type: 'like',
            profile_id: (await supabase.auth.getUser()).data.user?.id
          })
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      // Revert optimistic update on error
      onInteraction(story.id, 'like')
    } finally {
      setIsLiking(false)
    }
  }

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation()
    onInteraction(story.id, 'comment')
    navigate(`/stories/${story.id}#comments`)
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    onInteraction(story.id, 'share')
    
    if (navigator.share) {
      navigator.share({
        title: story.title,
        text: story.content.slice(0, 100) + '...',
        url: window.location.origin + `/stories/${story.id}`
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.origin + `/stories/${story.id}`)
    }
  }

const handleCardClick = () => {
    navigate(`/stories/${story.id}`)
  }

  const textExcerpt = (story.content && story.content.trim().length > 0)
    ? story.content
    : (assets.find(a => a.type === 'text')?.metadata?.content || '')

  return (
    <Card 
      data-testid="story-card"
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg",
        isHovered && "shadow-md transform-gpu scale-[1.02]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={story.profile.avatar_url} />
              <AvatarFallback>
                {story.profile.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{story.profile.full_name}</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {formatForUser(story.created_at, 'relative', getCurrentUserRegion())}
                </p>
                <PrivacyBadge size="sm" variant="minimal" showInfo={false} />
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="mb-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-heritage-gray-dark">{story.title}</h3>
          <p className="text-heritage-gray line-clamp-3">{textExcerpt || ''}</p>
        </div>

        {/* Media Preview */}
        {assets.length > 0 ? (
          <div className="mb-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const firstVideo = assets.find((a: any) => a.type === 'video')
              if (firstVideo) {
                return (
                  <>
                    <StoryAssetRenderer key={firstVideo.id} asset={firstVideo} />
                    {assets
                      .filter((a: any) => a.id !== firstVideo.id)
                      .slice(0, 2)
                      .map((asset: any) => (
                        <StoryAssetRenderer key={asset.id} asset={asset} compact />
                      ))}
                  </>
                )
              }
              return assets.slice(0, 3).map((asset: any) => (
                <StoryAssetRenderer key={asset.id} asset={asset} compact />
              ))
            })()}
          </div>
        ) : story.media && story.media.length > 0 ? (
          <div className="mb-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            {legacyVideo ? (
              <StoryAssetRenderer asset={legacyVideo} />
            ) : null}
            <StoryImageGallery 
              images={story.media
                .filter(m => m.mime_type.startsWith('image/'))
                .map(m => ({
                  id: m.id,
                  url: m.file_path,
                  alt: story.title
                }))
              }
            />
            {/* Audio indicator */}
            {story.media.some(m => m.mime_type.startsWith('audio/')) && (
              <div className="mt-2 p-3 bg-primary/5 rounded-lg flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                </div>
                <p className="text-xs text-muted-foreground">Includes audio recording</p>
              </div>
            )}
          </div>
        ) : null}

        {/* Always Visible Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className={cn(
                "h-8 gap-2 transition-colors duration-200",
                story.user_has_liked 
                  ? "text-red-500 hover:text-red-600" 
                  : "hover:text-red-500"
              )}
            >
              <Heart 
                className={cn(
                  "h-4 w-4 transition-all duration-200",
                  story.user_has_liked ? "fill-current" : ""
                )} 
              />
              <span className="text-xs font-medium">
                {story.reactions_count}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleComment}
              className="h-8 gap-2 hover:text-blue-500 transition-colors duration-200"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs font-medium">
                {story.comments_count}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="h-8 gap-2 hover:text-green-500 transition-colors duration-200"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-xs font-medium">Share memory</span>
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {story.media && story.media.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {story.media.length} {story.media.length === 1 ? 'item' : 'items'}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}