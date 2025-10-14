import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Heart, MessageCircle, Share2, Bookmark, Tag, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import { VoiceReplyButton } from './VoiceReplyButton'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { PrivacyChip } from '@/components/privacy/PrivacyChip'
import { useContentVisibility } from '@/hooks/useContentVisibility'
import { routes } from '@/lib/routes'
import { LSLink } from '@/lib/linking'

interface FeedItemData {
  id: string
  title: string
  content?: string
  created_at: string
  profile_id: string
  family_id: string
  visibility?: 'family' | 'private' | 'public' | 'circle'
  profiles?: {
    full_name?: string
    avatar_url?: string
  }
  media_urls?: Array<{ url: string; type: string }>
  tags?: string[]
  people?: Array<{ id: string; name: string }>
  reactions_count?: number
  comments_count?: number
  user_has_liked?: boolean
}

interface SmartFeedCardProps {
  item: FeedItemData
  onUpdate?: () => void
}

export function SmartFeedCard({ item, onUpdate }: SmartFeedCardProps) {
  const navigate = useNavigate()
  const cardRef = useRef<HTMLDivElement>(null)
  const [showAllComments, setShowAllComments] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [isLiked, setIsLiked] = useState(item.user_has_liked || false)
  const [likeCount, setLikeCount] = useState(item.reactions_count || 0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const { toast } = useToast()
  
  const { visibility, updateVisibility } = useContentVisibility({
    contentType: 'story',
    contentId: item.id,
    initialVisibility: item.visibility || 'family'
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null)
    })
  }, [])

  useEffect(() => {
    loadComments()
  }, [item.id])

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('story_id', item.id)
      .order('created_at', { ascending: false })
      .limit(showAllComments ? 100 : 2)
    
    setComments(data || [])
  }

  const handleLike = async () => {
    const newLiked = !isLiked
    setIsLiked(newLiked)
    setLikeCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1))
    
    // TODO: Implement actual reaction creation/deletion
    toast({
      title: newLiked ? "Liked! ❤️" : "Like removed",
    })
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/stories/${item.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, url })
      } else {
        await navigator.clipboard.writeText(url)
        toast({ title: "Link copied! 📋" })
      }
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  const handleSave = async () => {
    setIsSaved(!isSaved)
    toast({
      title: isSaved ? "Removed from saved" : "Saved! 📌",
      description: isSaved ? undefined : "View in /saved"
    })
    // TODO: Implement actual bookmark creation/deletion
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.defaultPrevented) {
      navigate(routes.storiesShow(item.id))
    }
  }

  return (
    <Card 
      ref={cardRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="w-full hover:shadow-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      role="article"
      aria-label={`Story: ${item.title} by ${item.profiles?.full_name}`}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header with avatar and name */}
        <div className="flex items-center gap-3">
          <LSLink
            to={routes.people(item.profile_id)}
            aria-label={`View ${item.profiles?.full_name}'s profile`}
            className="focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
          >
            <Avatar className="h-10 w-10 hover:ring-2 hover:ring-primary transition-all cursor-pointer">
              <AvatarImage src={item.profiles?.avatar_url} />
              <AvatarFallback className="bg-primary/10">
                {item.profiles?.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          </LSLink>
          <div className="flex-1 min-w-0">
            <LSLink
              to={routes.people(item.profile_id)}
              className="font-semibold text-sm hover:underline focus:outline-none focus:underline text-left block"
              aria-label={`View ${item.profiles?.full_name}'s profile`}
            >
              {item.profiles?.full_name || 'Unknown'}
            </LSLink>
            <LSLink
              to={routes.storiesActivity(item.id)}
              className="block text-xs text-muted-foreground hover:underline focus:outline-none focus:underline text-left"
              aria-label="View activity timeline"
            >
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </LSLink>
          </div>
          <PrivacyChip
            currentVisibility={visibility}
            isOwner={currentUserId === item.profile_id}
            onVisibilityChange={updateVisibility}
            onViewPermissions={() => navigate(routes.storiesPrivacy(item.id))}
            size="sm"
          />
        </div>

        {/* Title */}
        <LSLink
          to={routes.storiesShow(item.id)}
          className="w-full text-left font-semibold text-base leading-snug hover:text-primary transition-colors focus:outline-none focus:text-primary block"
          aria-label={`Read full story: ${item.title}`}
        >
          {item.title}
        </LSLink>

        {/* Media */}
        {item.media_urls && item.media_urls.length > 0 && (
          <LSLink
            to={routes.storiesShow(item.id)}
            className="block w-full rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary hover:opacity-95 transition-opacity"
            aria-label="View story media"
          >
            {item.media_urls[0].type === 'image' && (
              <img 
                src={item.media_urls[0].url} 
                alt="" 
                className="w-full max-h-[400px] object-cover"
              />
            )}
            {item.media_urls[0].type === 'video' && (
              <video 
                src={item.media_urls[0].url} 
                controls 
                className="w-full max-h-[400px]"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            {item.media_urls[0].type === 'audio' && (
              <LSLink to={routes.storiesAudio(item.id)} className="block bg-muted/50 p-4 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors">
                <audio 
                  src={item.media_urls[0].url} 
                  controls 
                  className="w-full"
                  onClick={(e) => e.stopPropagation()}
                />
              </LSLink>
            )}
            {item.media_urls.length > 1 && (
              <div className="text-xs text-muted-foreground text-center mt-2">
                +{item.media_urls.length - 1} more
              </div>
            )}
          </LSLink>
        )}

        {/* Content snippet */}
        {item.content && (
          <p className="text-sm text-muted-foreground line-clamp-3">{item.content}</p>
        )}

        {/* Tags and People */}
        {(item.tags || item.people) && (
          <div className="flex flex-wrap gap-2">
            {item.people?.map(person => (
              <LSLink
                key={person.id}
                to={routes.storiesTagging(item.id)}
                className="focus:outline-none focus:ring-2 focus:ring-primary rounded-full inline-block"
                aria-label={`View ${person.name} in photo`}
              >
                <Badge variant="secondary" className="gap-1 hover:bg-secondary/80 cursor-pointer transition-colors">
                  <Users className="h-3 w-3" />
                  {person.name}
                </Badge>
              </LSLink>
            ))}
            {item.tags?.map(tag => (
              <Badge key={tag} variant="outline" className="gap-1">
                <Tag className="h-3 w-3" />
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                "gap-2 h-9",
                isLiked && "text-red-500"
              )}
              aria-label={isLiked ? "Unlike story" : "Like story"}
            >
              <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
              <LSLink
                to={routes.storiesLikes(item.id)}
                className="text-xs hover:underline focus:outline-none focus:underline"
                aria-label={`View ${likeCount} likes`}
                onClick={(e) => {
                  if (likeCount === 0) e.preventDefault()
                }}
              >
                {likeCount}
              </LSLink>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllComments(!showAllComments)}
              className="gap-2 h-9"
              aria-label="Toggle comments"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">{item.comments_count || 0}</span>
            </Button>

            <VoiceReplyButton
              storyId={item.id}
              familyId={item.family_id}
              onReplySent={() => {
                loadComments()
                onUpdate?.()
              }}
            />
          </div>

          <div className="flex items-center gap-1">
            <LSLink 
              to={routes.storiesTagging(item.id)}
              aria-label="Tag people in this story"
            >
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 gap-2"
                asChild
              >
                <span>
                  <Tag className="h-4 w-4" />
                </span>
              </Button>
            </LSLink>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleShare} 
              className="h-9 gap-2"
              aria-label="Share story"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 gap-2"
              onClick={handleSave}
              aria-label={isSaved ? "Remove from saved" : "Save story"}
            >
              <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
            </Button>
          </div>
        </div>

        {/* Comments */}
        {comments.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            {comments.slice(0, showAllComments ? undefined : 2).map((comment) => (
              <div key={comment.id} className="flex gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={comment.profiles?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {comment.profiles?.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs">
                    <span className="font-semibold">{comment.profiles?.full_name}</span>
                    {' '}
                    <span className="text-muted-foreground">{comment.content}</span>
                  </p>
                </div>
              </div>
            ))}
            {comments.length > 2 && !showAllComments && (
              <LSLink
                to={routes.storiesComments(item.id)}
                className="text-xs text-muted-foreground hover:underline"
                aria-label={`View all ${comments.length} comments`}
              >
                View all {comments.length} comments
              </LSLink>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
