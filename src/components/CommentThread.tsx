import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { MessageCircle } from 'lucide-react'
import ReactionBar from './ReactionBar'
import type { Comment, Profile } from '@/lib/types'

interface CommentThreadProps {
  targetType: 'story' | 'answer'
  targetId: string
  familyId: string
}

export default function CommentThread({ targetType, targetId, familyId }: CommentThreadProps) {
  const [comments, setComments] = useState<(Comment & { profiles: Profile })[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [showComments, setShowComments] = useState(false)

  useEffect(() => {
    const getComments = async () => {
      const column = `${targetType}_id`
      const { data: commentsData } = await (supabase as any)
        .from('comments')
        .select('*')
        .eq(column, targetId)
        .eq('family_id', familyId)
        .order('created_at')

      if (commentsData) {
        // Fetch profiles separately to avoid type complexity
        const profileIds = [...new Set(commentsData.map((c: any) => c.profile_id))]
        const { data: profilesData } = await (supabase as any)
          .from('profiles')
          .select('*')
          .in('id', profileIds)
        
        // Combine the data
        const commentsWithProfiles = commentsData.map((comment: any) => ({
          ...comment,
          profiles: profilesData?.find((p: any) => p.id === comment.profile_id) || {
            id: comment.profile_id,
            email: 'Unknown User',
            full_name: null,
            avatar_url: null,
            created_at: '',
            updated_at: ''
          }
        }))
        
        setComments(commentsWithProfiles)
      }
    }

    if (showComments) {
      getComments()
    }
  }, [targetType, targetId, familyId, showComments])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const column = `${targetType}_id`
        const { data: commentData } = await (supabase as any)
          .from('comments')
          .insert({
            [column]: targetId,
            profile_id: user.id,
            family_id: familyId,
            content: newComment.trim(),
          })
          .select('*')
          .single()
        
        if (commentData) {
          // Fetch the user's profile
          const { data: profileData } = await (supabase as any)
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          const newCommentWithProfile = {
            ...commentData,
            profiles: profileData || {
              id: user.id,
              email: user.email || 'Unknown User',
              full_name: null,
              avatar_url: null,
              created_at: '',
              updated_at: ''
            }
          }
          
          setComments(prev => [...prev, newCommentWithProfile])
          setNewComment('')
        }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(!showComments)}
        className="flex items-center space-x-2"
      >
        <MessageCircle className="h-4 w-4" />
        <span>
          {comments.length > 0 
            ? `${comments.length} comment${comments.length !== 1 ? 's' : ''}`
            : 'Add comment'
          }
        </span>
      </Button>

      {showComments && (
        <div className="space-y-3 pl-4 border-l-2 border-muted">
          {comments.map((comment) => (
            <Card key={comment.id} className="bg-muted/50">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={comment.profiles.avatar_url || ''} />
                    <AvatarFallback className="text-xs">
                      {comment.profiles.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {comment.profiles.full_name || 'User'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                <ReactionBar 
                  targetType="comment" 
                  targetId={comment.id}
                  familyId={familyId}
                />
              </CardContent>
            </Card>
          ))}

          <form onSubmit={handleSubmitComment} className="space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={2}
            />
            <Button type="submit" size="sm" disabled={loading || !newComment.trim()}>
              {loading ? 'Posting...' : 'Post Comment'}
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}