import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'

interface Comment {
  id: string
  body: string
  created_at: string
  created_by: string
  region_id?: string
  profile?: { full_name: string }
  region?: { label?: string; person?: { full_name: string } }
}

interface PhotoCommentsProps {
  assetId: string
  familyId: string
  selectedRegionId?: string
}

export function PhotoComments({ assetId, familyId, selectedRegionId }: PhotoCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'region'>('all')
  const { toast } = useToast()

  useEffect(() => {
    fetchComments()
  }, [assetId])

  async function fetchComments() {
    const { data, error } = await supabase
      .from('photo_comments')
      .select(`
        id,
        body,
        created_at,
        created_by,
        region_id
      `)
      .eq('asset_id', assetId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return
    }

    // Fetch profile and region data separately
    const commentsWithData = await Promise.all((data || []).map(async (comment) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', comment.created_by)
        .single()

      let region = null
      if (comment.region_id) {
        const { data: regionData } = await supabase
          .from('photo_regions')
          .select('label, person_id')
          .eq('id', comment.region_id)
          .single()

        if (regionData && regionData.person_id) {
          const { data: person } = await supabase
            .from('people')
            .select('full_name')
            .eq('id', regionData.person_id)
            .single()
          
          region = { ...regionData, person }
        } else {
          region = regionData
        }
      }

      return {
        ...comment,
        profile,
        region
      }
    }))

    setComments(commentsWithData as any)
  }

  async function addComment() {
    if (!newComment.trim()) return

    const user = await supabase.auth.getUser()
    if (!user.data.user) return

    const { data, error } = await supabase
      .from('photo_comments')
      .insert({
        asset_id: assetId,
        region_id: replyingTo || undefined,
        body: newComment.trim(),
        created_by: user.data.user.id
      })
      .select()
      .single()

    if (error) {
      toast({ title: 'Error adding comment', description: error.message, variant: 'destructive' })
      return
    }

    // Fetch full comment data
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.data.user.id)
      .single()

    setComments([...comments, { ...data, profile, region: null }] as any)
    setNewComment('')
    setReplyingTo(null)
    toast({ title: 'Comment added' })
  }

  async function deleteComment(commentId: string) {
    const { error } = await supabase
      .from('photo_comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      toast({ title: 'Error deleting comment', description: error.message, variant: 'destructive' })
      return
    }

    setComments(comments.filter(c => c.id !== commentId))
    toast({ title: 'Comment deleted' })
  }

  const filteredComments = filter === 'region' && selectedRegionId
    ? comments.filter(c => c.region_id === selectedRegionId)
    : comments

  const commentCount = comments.length
  const regionCommentCount = selectedRegionId 
    ? comments.filter(c => c.region_id === selectedRegionId).length 
    : 0

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Comments ({commentCount})</h3>
        {selectedRegionId && (
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'region' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('region')}
            >
              Region ({regionCommentCount})
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {filteredComments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {comment.profile?.full_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    {comment.profile?.full_name || 'Unknown'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                {comment.region_id && (
                  <div className="text-xs text-muted-foreground mb-1">
                    Replying to: {comment.region?.person?.full_name || comment.region?.label || 'Tagged region'}
                  </div>
                )}
                <p className="text-sm">{comment.body}</p>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(comment.region_id || null)}
                  >
                    Reply
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteComment(comment.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="mt-4 space-y-2">
        {replyingTo && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Replying to region</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
        />
        <Button onClick={addComment} className="w-full">
          Add Comment
        </Button>
      </div>
    </div>
  )
}
