import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Heart, MessageCircle, Share2, Globe, Lock, Users, MoreVertical, EyeOff, Flag, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'
import { MediaStrip } from './MediaStrip'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useToast } from '@/hooks/use-toast'
import type { FeedStory } from './useFamilyFeed'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface FeedCardProps {
  story: FeedStory
  onUpdate?: () => void
}

export function FeedCard({ story, onUpdate }: FeedCardProps) {
  const navigate = useNavigate()
  const { track } = useAnalytics()
  const { toast } = useToast()
  const impressionTracked = useRef(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const [authorProfile, setAuthorProfile] = useState<{ full_name?: string; avatar_url?: string } | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null)
    })
  }, [])

  // Track impression when card becomes visible
  useEffect(() => {
    if (impressionTracked.current || !cardRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !impressionTracked.current) {
          impressionTracked.current = true
          track('feed_impression', {
            story_id: story.id,
            author_id: story.author_id,
            family_id: story.family_id,
            visibility: story.visibility,
            has_media: story.media && story.media.length > 0,
            media_count: story.media?.length || 0
          })
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(cardRef.current)

    return () => observer.disconnect()
  }, [story.id])

  useEffect(() => {
    loadAuthorProfile()
    loadInteractions()
  }, [story.id, story.author_id])

  const loadAuthorProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', story.author_id)
      .maybeSingle()
    
    setAuthorProfile(data)
  }

  const loadInteractions = async () => {
    const [reactionsResult, commentsResult, userReactionResult] = await Promise.all([
      supabase
        .from('reactions')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', story.id),
      supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', story.id),
      supabase
        .from('reactions')
        .select('id')
        .eq('story_id', story.id)
        .eq('profile_id', story.author_id)
        .maybeSingle()
    ])

    setLikeCount(reactionsResult.count || 0)
    setCommentCount(commentsResult.count || 0)
    setIsLiked(!!userReactionResult.data)
  }

  const handleLike = async () => {
    const newLiked = !isLiked
    setIsLiked(newLiked)
    setLikeCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1))
    // TODO: Implement actual reaction creation/deletion
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/stories/${story.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: story.title, url })
      } else {
        await navigator.clipboard.writeText(url)
        toast({ title: "Link copied!" })
      }
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  const handleHideStory = async (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Implement hide story functionality
    toast({ title: "Story hidden", description: "You won't see this story anymore" })
    onUpdate?.()
  }

  const handleFlagStory = async (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Implement flag for review functionality
    toast({ title: "Story flagged", description: "Admins will review this content" })
  }

  const handleDeleteStory = async () => {
    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', story.id)
      
      if (error) throw error
      
      toast({ title: "Story deleted" })
      setShowDeleteDialog(false)
      onUpdate?.()
    } catch (error) {
      console.error('Delete failed:', error)
      toast({ 
        title: "Failed to delete story", 
        variant: "destructive" 
      })
      setShowDeleteDialog(false)
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('audio') ||
      target.closest('video')
    ) {
      return
    }
    navigate(`/stories/${story.id}`)
  }

  const visibilityConfig = {
    public: { icon: Globe, label: 'Public', color: 'text-green-600' },
    family: { icon: Users, label: 'Family', color: 'text-blue-600' },
    circle: { icon: Users, label: 'Circle', color: 'text-purple-600' },
    private: { icon: Lock, label: 'Private', color: 'text-gray-600' }
  }

  const visibility = visibilityConfig[story.visibility as keyof typeof visibilityConfig] || visibilityConfig.family
  const VisibilityIcon = visibility.icon

  return (
    <Card 
      ref={cardRef}
      className="w-full hover:shadow-md transition-shadow cursor-pointer rounded-2xl"
      onClick={handleCardClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={authorProfile?.avatar_url} />
            <AvatarFallback className="bg-primary/10">
              {authorProfile?.full_name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">
              {authorProfile?.full_name || 'Unknown'}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}
            </p>
          </div>
          <Badge variant="outline" className={cn("gap-1", visibility.color)}>
            <VisibilityIcon className="h-3 w-3" />
            <span className="text-xs">{visibility.label}</span>
          </Badge>
          
          {/* Three dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Story options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-background">
              <DropdownMenuItem 
                onClick={handleHideStory}
                className="gap-2 cursor-pointer"
              >
                <EyeOff className="h-4 w-4" />
                <span>Hide Story</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleFlagStory}
                className="gap-2 cursor-pointer text-orange-600"
              >
                <Flag className="h-4 w-4" />
                <span>Flag for Review</span>
              </DropdownMenuItem>
              {currentUserId === story.author_id && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeleteDialog(true)
                  }}
                  className="gap-2 cursor-pointer text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Story</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base leading-snug">
          {story.title}
        </h3>

        {/* Media */}
        {story.media && story.media.length > 0 && (
          <MediaStrip media={story.media} />
        )}

        {/* Text Content */}
        {story.text && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {story.text}
          </p>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleLike()
              }}
              className={cn(
                "gap-2 min-h-[44px] min-w-[44px]", // Mobile tap target
                isLiked && "text-red-500"
              )}
            >
              <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
              <span className="text-xs">{likeCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/stories/${story.id}`)
              }}
              className="gap-2 min-h-[44px] min-w-[44px]" // Mobile tap target
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">{commentCount}</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleShare()
            }}
            className="min-h-[44px] min-w-[44px] gap-2" // Mobile tap target
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Story</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this story? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteStory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
