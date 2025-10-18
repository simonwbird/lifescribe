import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Heart, MessageCircle, Share2, Bookmark, Tag, Users, Trash2 } from 'lucide-react'
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

// Audio Player Component
function AudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [duration, setDuration] = useState<number | null>(null)

  // Format duration in MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Load duration when audio metadata is available
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    }

    const handleCanPlay = () => {
      if (audio.duration && isFinite(audio.duration) && !duration) {
        setDuration(audio.duration)
      }
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('durationchange', handleCanPlay)
    
    // If metadata already loaded
    if (audio.duration && isFinite(audio.duration)) {
      setDuration(audio.duration)
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('durationchange', handleCanPlay)
    }
  }, [url])

  return (
    <div className="w-full bg-muted/50 p-4 rounded-lg space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Audio Recording</span>
        {duration && <span className="font-medium">{formatDuration(duration)}</span>}
      </div>
      <audio
        ref={audioRef}
        controls
        preload="metadata"
        className="w-full"
        src={url}
        aria-label="Story audio"
      />
    </div>
  )
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
  }, [item.id, showAllComments])

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('story_id', item.id)
      .order('created_at', { ascending: false })
      .limit(showAllComments ? 100 : 2)

    const commentsData = data || []

    const { data: recordings } = await supabase
      .from('audio_recordings')
      .select('audio_url, duration_seconds, draft_data, transcript')
      .eq('story_id', item.id)

    const byCommentId = new Map<string, { url: string; duration_seconds?: number; transcript?: string }>()
    ;(recordings || []).forEach((rec: any) => {
      const cid = rec?.draft_data?.comment_id || rec?.draft_data?.commentId
      if (cid) byCommentId.set(cid, { url: rec.audio_url, duration_seconds: rec.duration_seconds, transcript: rec.transcript })
    })

    const merged = commentsData.map((c: any) => ({
      ...c,
      voice: byCommentId.get(c.id) || null,
    }))
    
    setComments(merged)
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

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
      
      if (error) throw error
      
      await loadComments()
      toast({
        title: "Comment deleted",
      })
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast({
        title: "Failed to delete comment",
        variant: "destructive"
      })
    }
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
          <div className="w-full rounded-lg overflow-hidden space-y-2">
            {item.media_urls[0].type === 'image' && (
              <LSLink
                to={routes.storiesShow(item.id)}
                className="block w-full rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary hover:opacity-95 transition-opacity"
                aria-label="View full story"
              >
                <img 
                  src={item.media_urls[0].url} 
                  alt={item.title || "Story image"} 
                  className="w-full max-h-[400px] object-cover"
                />
              </LSLink>
            )}
            {item.media_urls[0].type === 'video' && (
              <div className="w-full bg-black/5 rounded-lg overflow-hidden">
                <video 
                  src={item.media_urls[0].url} 
                  controls 
                  className="w-full max-h-[400px]"
                  preload="metadata"
                  aria-label="Story video"
                />
              </div>
            )}
            {item.media_urls[0].type === 'audio' && (
              <AudioPlayer url={item.media_urls[0].url} />
            )}
            {item.media_urls.length > 1 && (
              <LSLink
                to={routes.storiesShow(item.id)}
                className="block text-xs text-muted-foreground hover:text-foreground text-center transition-colors"
                aria-label={`View ${item.media_urls.length - 1} more media items`}
              >
                +{item.media_urls.length - 1} more
              </LSLink>
            )}
          </div>
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
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage src={comment.profiles?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {comment.profiles?.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs">
                      <span className="font-semibold">{comment.profiles?.full_name}</span>
                    </p>
                    {currentUserId === comment.profile_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        aria-label="Delete comment"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {comment.voice?.url ? (
                    <div className="bg-muted/50 rounded-lg p-2">
                      <audio 
                        src={comment.voice.url} 
                        controls 
                        className="w-full max-w-xs h-8"
                        preload="metadata"
                        aria-label="Voice comment"
                      />
                    </div>
                  ) : comment.voice?.transcript ? (
                    <div className="bg-muted/50 rounded-md p-2">
                      <p className="text-xs text-muted-foreground italic mb-1">Voice transcript</p>
                      <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">{comment.voice.transcript}</p>
                    </div>
                  ) : comment.content?.includes('[Voice message') ? (
                    <div className="bg-muted/50 rounded-md p-2">
                      <p className="text-xs text-muted-foreground italic mb-1">
                        Voice message (audio file not saved or linked)
                      </p>
                      {comment.content && comment.content.replace(/\[Voice message[^\]]*\]/g, '').trim() && (
                        <p className="text-sm text-foreground mt-2">
                          {comment.content.replace(/\[Voice message[^\]]*\]/g, '').trim()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">{comment.content}</span>
                  )}
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
