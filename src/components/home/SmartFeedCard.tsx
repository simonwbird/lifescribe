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

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement
    if (target.closest('button, a, [role="button"]')) return
    navigate(`/stories/${item.id}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.defaultPrevented) {
      navigate(`/stories/${item.id}`)
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
          <button
            onClick={() => navigate(`/people/${item.profile_id}`)}
            className="focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
            aria-label={`View ${item.profiles?.full_name}'s profile`}
          >
            <Avatar className="h-10 w-10 hover:ring-2 hover:ring-primary transition-all cursor-pointer">
              <AvatarImage src={item.profiles?.avatar_url} />
              <AvatarFallback className="bg-primary/10">
                {item.profiles?.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          </button>
          <div className="flex-1 min-w-0">
            <button
              onClick={() => navigate(`/people/${item.profile_id}`)}
              className="font-semibold text-sm hover:underline focus:outline-none focus:underline text-left"
              aria-label={`View ${item.profiles?.full_name}'s profile`}
            >
              {item.profiles?.full_name || 'Unknown'}
            </button>
            <button
              onClick={() => navigate(`/stories/${item.id}#activity`)}
              className="block text-xs text-muted-foreground hover:underline focus:outline-none focus:underline text-left"
              aria-label="View activity timeline"
            >
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </button>
          </div>
          <PrivacyChip
            currentVisibility={visibility}
            isOwner={currentUserId === item.profile_id}
            onVisibilityChange={updateVisibility}
            onViewPermissions={() => navigate(`/stories/${item.id}#privacy`)}
            size="sm"
          />
        </div>

        {/* Title */}
        <button
          onClick={() => navigate(`/stories/${item.id}`)}
          className="w-full text-left font-semibold text-base leading-snug hover:text-primary transition-colors focus:outline-none focus:text-primary"
          aria-label={`Read full story: ${item.title}`}
        >
          {item.title}
        </button>

        {/* Media */}
        {item.media_urls && item.media_urls.length > 0 && (
          <button
            onClick={() => navigate(`/stories/${item.id}`)}
            className="w-full rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary hover:opacity-95 transition-opacity"
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
              <div 
                className="bg-muted/50 p-4 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/stories/${item.id}#audio`)
                }}
              >
                <audio 
                  src={item.media_urls[0].url} 
                  controls 
                  className="w-full"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            {item.media_urls.length > 1 && (
              <div className="text-xs text-muted-foreground text-center mt-2">
                +{item.media_urls.length - 1} more
              </div>
            )}
          </button>
        )}

        {/* Content snippet */}
        {item.content && (
          <p className="text-sm text-muted-foreground line-clamp-3">{item.content}</p>
        )}

        {/* Tags and People */}
        {(item.tags || item.people) && (
          <div className="flex flex-wrap gap-2">
            {item.people?.map(person => (
              <button
                key={person.id}
                onClick={() => navigate(`/stories/${item.id}#tagging`)}
                className="focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
                aria-label={`View ${person.name} in photo`}
              >
                <Badge variant="secondary" className="gap-1 hover:bg-secondary/80 cursor-pointer transition-colors">
                  <Users className="h-3 w-3" />
                  {person.name}
                </Badge>
              </button>
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
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (likeCount > 0) navigate(`/stories/${item.id}#likes`)
                }}
                className="text-xs hover:underline focus:outline-none focus:underline"
                aria-label={`View ${likeCount} likes`}
              >
                {likeCount}
              </button>
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
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 gap-2"
              onClick={() => navigate(`/stories/${item.id}#tagging`)}
              aria-label="Tag people in this story"
            >
              <Tag className="h-4 w-4" />
            </Button>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/stories/${item.id}#comments`)}
                className="text-xs text-muted-foreground h-auto p-0 hover:bg-transparent"
                aria-label={`View all ${comments.length} comments`}
              >
                View all {comments.length} comments
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
