import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, Send, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from '@/hooks/use-toast'
import { useWriteProtection } from '@/hooks/useWriteProtection'

interface Comment {
  id: string
  content: string | null
  created_at: string
  profile_id: string
  profiles: {
    full_name: string
    avatar_url: string | null
  }
  // Optional voice data resolved client-side
  voice?: { url: string; duration_seconds?: number } | null
}

interface StoryCommentsProps {
  storyId: string
  familyId: string
}

export function StoryComments({ storyId, familyId }: StoryCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const { checkWritePermission } = useWriteProtection()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getUser()
  }, [])

  useEffect(() => {
    fetchComments()
  }, [storyId])

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          profile_id,
          profiles:profile_id (
            full_name,
            avatar_url
          )
        `)
        .eq('story_id', storyId)
        .order('created_at', { ascending: true })

      if (error) throw error

      const commentsData: Comment[] = (data || [])

      // Fetch voice recordings linked via draft_data.comment_id
      const { data: recordings } = await supabase
        .from('audio_recordings')
        .select('audio_url, duration_seconds, draft_data')
        .eq('story_id', storyId)

      const byCommentId = new Map<string, { url: string; duration_seconds?: number }>()
      ;(recordings || []).forEach((rec: any) => {
        const cid = rec?.draft_data?.comment_id
        if (cid) {
          byCommentId.set(cid, { url: rec.audio_url, duration_seconds: rec.duration_seconds })
        }
      })

      const merged = commentsData.map((c) => ({
        ...c,
        voice: byCommentId.get(c.id) || null,
      }))

      setComments(merged)
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!newComment.trim() || !currentUserId) return
    if (!checkWritePermission('add_comment')) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          story_id: storyId,
          family_id: familyId,
          profile_id: currentUserId,
          content: newComment.trim()
        })

      if (error) throw error

      setNewComment('')
      await fetchComments()
      
      toast({
        title: 'Comment added',
        description: 'Your comment has been posted'
      })
    } catch (error) {
      console.error('Error adding comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  }

  return (
    <Card id="comments">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment Input */}
        {currentUserId && (
          <div className="space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              disabled={submitting}
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleSubmit}
                disabled={!newComment.trim() || submitting}
                size="sm"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Post Comment
              </Button>
            </div>
          </div>
        )}

        {/* Comments List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  {comment.profiles?.avatar_url && (
                    <AvatarImage src={comment.profiles.avatar_url} />
                  )}
                  <AvatarFallback className="text-xs">
                    {getInitials(comment.profiles?.full_name || 'User')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">
                      {comment.profiles?.full_name || 'Unknown User'}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true
                      })}
                    </span>
                  </div>
                  {comment.voice?.url ? (
                    <div className="bg-muted/50 rounded-md p-2">
                      <audio
                        src={comment.voice.url}
                        controls
                        className="w-full max-w-md h-8"
                        preload="metadata"
                        aria-label="Voice message"
                      />
                      {comment.content && (
                        <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{comment.content}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
