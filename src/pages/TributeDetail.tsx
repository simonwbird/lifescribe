import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAnalytics } from '@/hooks/useAnalytics'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Loader2, Flame, Send } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import Header from '@/components/Header'

interface Tribute {
  id: string
  family_id: string
  person_id: string | null
  created_by: string
  title: string
  description: string | null
  theme: string
  privacy: string
  anniversary_date: string | null
  how_we_met: string | null
  what_they_taught_us: string | null
  favorite_memory: string | null
  created_at: string
}

interface Reaction {
  id: string
  user_id: string | null
  guest_session_id: string | null
  created_at: string
}

interface Comment {
  id: string
  content: string
  profile_id: string
  created_at: string
  profiles: {
    full_name: string
  }
}

const THEME_GRADIENTS: Record<string, string> = {
  soft_blue: 'from-blue-50 to-blue-100',
  sunset_rose: 'from-rose-50 to-orange-50',
  gentle_lavender: 'from-purple-50 to-pink-50',
  serene_green: 'from-emerald-50 to-teal-50'
}

export default function TributeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { track } = useAnalytics()

  const [tribute, setTribute] = useState<Tribute | null>(null)
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [hasReacted, setHasReacted] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      loadTribute()
      loadReactions()
      loadComments()
    }
  }, [id])

  const loadTribute = async () => {
    try {
      const { data, error } = await supabase
        .from('tributes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setTribute(data)
      
      track('tribute_viewed', { tribute_id: id })
    } catch (error) {
      console.error('Error loading tribute:', error)
      toast({
        title: 'Error loading tribute',
        description: 'Failed to load tribute details',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadReactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('tribute_reactions')
        .select('*')
        .eq('tribute_id', id)

      if (error) throw error
      setReactions(data || [])
      
      if (user) {
        setHasReacted(data?.some(r => r.user_id === user.id) || false)
      }
    } catch (error) {
      console.error('Error loading reactions:', error)
    }
  }

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles(full_name)')
        .eq('tribute_id', id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Error loading comments:', error)
    }
  }

  const handleReaction = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: 'Sign in required',
          description: 'Please sign in to light a candle',
          variant: 'destructive'
        })
        return
      }

      if (hasReacted) {
        // Remove reaction
        const { error } = await supabase
          .from('tribute_reactions')
          .delete()
          .eq('tribute_id', id)
          .eq('user_id', user.id)

        if (error) throw error
        track('tribute_candle_removed', { tribute_id: id })
      } else {
        // Add reaction
        const { error } = await supabase
          .from('tribute_reactions')
          .insert({
            tribute_id: id,
            user_id: user.id,
            reaction_type: 'candle'
          })

        if (error) throw error
        track('tribute_candle_lit', { tribute_id: id })
      }

      setHasReacted(!hasReacted)
      loadReactions()
    } catch (error) {
      console.error('Error toggling reaction:', error)
      toast({
        title: 'Error',
        description: 'Failed to update reaction',
        variant: 'destructive'
      })
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('comments')
        .insert({
          tribute_id: id,
          family_id: tribute?.family_id,
          profile_id: user.id,
          content: newComment.trim()
        })

      if (error) throw error

      track('tribute_comment_added', { tribute_id: id })
      toast({
        title: 'Comment added',
        description: 'Your message has been shared'
      })

      setNewComment('')
      loadComments()
    } catch (error) {
      console.error('Error adding comment:', error)
      toast({
        title: 'Failed to add comment',
        description: 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!tribute) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-4xl mx-auto p-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Tribute not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Tribute Header */}
        <Card className={cn('bg-gradient-to-br', THEME_GRADIENTS[tribute.theme] || THEME_GRADIENTS.soft_blue)}>
          <CardHeader className="space-y-4">
            <div className="text-center space-y-2">
              <CardTitle className="text-3xl">{tribute.title}</CardTitle>
              {tribute.description && (
                <p className="text-lg text-muted-foreground">{tribute.description}</p>
              )}
              {tribute.anniversary_date && (
                <p className="text-sm text-muted-foreground">
                  {format(new Date(tribute.anniversary_date), 'MMMM d, yyyy')}
                </p>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Candle Reactions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className={cn('h-6 w-6', hasReacted ? 'text-orange-500' : 'text-muted-foreground')} />
                <span className="text-sm font-medium">
                  {reactions.length} {reactions.length === 1 ? 'candle lit' : 'candles lit'}
                </span>
              </div>
              <Button
                variant={hasReacted ? 'default' : 'outline'}
                size="sm"
                onClick={handleReaction}
              >
                {hasReacted ? 'Candle Lit' : 'Light a Candle'}
              </Button>
            </div>
            {reactions.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {reactions.map((reaction) => (
                  <div key={reaction.id} className="flex items-center gap-1">
                    <Flame className="h-4 w-4 text-orange-500" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Memorial Prompts */}
        {(tribute.how_we_met || tribute.what_they_taught_us || tribute.favorite_memory) && (
          <div className="space-y-4">
            {tribute.how_we_met && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How We Met</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{tribute.how_we_met}</p>
                </CardContent>
              </Card>
            )}

            {tribute.what_they_taught_us && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What They Taught Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{tribute.what_they_taught_us}</p>
                </CardContent>
              </Card>
            )}

            {tribute.favorite_memory && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Favorite Memory</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{tribute.favorite_memory}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle>Messages & Memories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Comment */}
            <div className="space-y-2">
              <Textarea
                placeholder="Share a memory or message..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                size="sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Post Message
                  </>
                )}
              </Button>
            </div>

            {comments.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="space-y-2">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {comment.profiles.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{comment.profiles.full_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {comments.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                No messages yet. Be the first to share a memory.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
