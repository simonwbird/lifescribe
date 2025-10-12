import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { Send, Trash2 } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface PhotoCommentsProps {
  mediaId: string
  familyId: string
}

interface Comment {
  id: string
  content: string
  created_at: string
  profile_id: string
  profiles: {
    full_name: string
    avatar_url: string | null
  }
}

interface FamilyMember {
  id: string
  given_name: string
  surname: string | null
}

export function PhotoComments({ mediaId, familyId }: PhotoCommentsProps) {
  const [comment, setComment] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const queryClient = useQueryClient()

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['photo-comments', mediaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:profile_id (
            full_name,
            avatar_url
          )
        `)
        .eq('media_id', mediaId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as Comment[]
    }
  })

  // Fetch family members for @mentions
  const { data: familyMembers = [] } = useQuery({
    queryKey: ['family-members', familyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('people')
        .select('id, given_name, surname')
        .eq('family_id', familyId)
        .order('given_name')

      if (error) throw error
      return data as FamilyMember[]
    }
  })

  // Create comment mutation
  const createMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Insert comment
      const { data: newComment, error } = await supabase
        .from('comments')
        .insert({
          content,
          media_id: mediaId,
          family_id: familyId,
          profile_id: user.id
        })
        .select()
        .single()

      if (error) throw error

      // Parse @mentions and create notifications
      const mentionRegex = /@([^\s@]+(?:\s+[^\s@]+)?)/g
      const mentions = [...content.matchAll(mentionRegex)]
      
      if (mentions.length > 0 && newComment) {
        // Find mentioned people by name
        const mentionedNames = mentions.map(m => m[1].trim().toLowerCase())
        const { data: mentionedPeople } = await supabase
          .from('people')
          .select('id, given_name, surname')
          .eq('family_id', familyId)
        
        if (mentionedPeople) {
          const matchedPeople = mentionedPeople.filter(person => {
            const fullName = `${person.given_name} ${person.surname || ''}`.trim().toLowerCase()
            return mentionedNames.some(mention => fullName.includes(mention))
          })

          // Store mentions
          if (matchedPeople.length > 0) {
            await supabase
              .from('comment_mentions')
              .insert(
                matchedPeople.map(person => ({
                  comment_id: newComment.id,
                  person_id: person.id
                }))
              )

            // Get profiles linked to mentioned people and create notifications
            const { data: personRoles } = await supabase
              .from('person_roles')
              .select('profile_id, person_id')
              .in('person_id', matchedPeople.map(p => p.id))
              .is('revoked_at', null)

            if (personRoles && personRoles.length > 0) {
              const notifications = personRoles.map(role => {
                const person = matchedPeople.find(p => p.id === role.person_id)
                return {
                  user_id: role.profile_id,
                  created_by: user.id,
                  family_id: familyId,
                  type: 'mention',
                  title: 'You were mentioned in a photo',
                  message: `Someone mentioned ${person?.given_name} in a comment: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`,
                  related_entity_type: 'comment',
                  related_entity_id: newComment.id,
                  mentioned_person_id: role.person_id,
                  link_url: `/people/${role.person_id}`
                }
              })

              await supabase
                .from('notifications')
                .insert(notifications)
            }
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo-comments', mediaId] })
      setComment('')
      toast.success('Comment added')
    },
    onError: () => {
      toast.error('Failed to add comment')
    }
  })

  // Delete comment mutation
  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo-comments', mediaId] })
      toast.success('Comment deleted')
    },
    onError: () => {
      toast.error('Failed to delete comment')
    }
  })

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart
    
    setComment(value)
    setCursorPosition(cursorPos)

    // Detect @ mention
    const textBeforeCursor = value.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt)
        setShowMentions(true)
        return
      }
    }
    
    setShowMentions(false)
  }

  const insertMention = (person: FamilyMember) => {
    const textBeforeCursor = comment.substring(0, cursorPosition)
    const textAfterCursor = comment.substring(cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    const mentionText = `@${person.given_name}${person.surname ? ' ' + person.surname : ''}`
    const newText = 
      comment.substring(0, lastAtIndex) + 
      mentionText + ' ' + 
      textAfterCursor
    
    setComment(newText)
    setShowMentions(false)
    setMentionSearch('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (comment.trim()) {
      createMutation.mutate(comment.trim())
    }
  }

  const filteredMembers = familyMembers.filter(member => {
    const fullName = `${member.given_name} ${member.surname || ''}`.toLowerCase()
    return fullName.includes(mentionSearch.toLowerCase())
  })

  const renderCommentContent = (content: string) => {
    // Highlight @mentions
    const parts = content.split(/(@[\w\s]+)/g)
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="text-primary font-medium">
            {part}
          </span>
        )
      }
      return part
    })
  }

  return (
    <div className="space-y-4">
      {/* Comments list */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.profiles.avatar_url || undefined} />
                <AvatarFallback>
                  {comment.profiles.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {comment.profiles.full_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm mt-1 whitespace-pre-wrap break-words">
                  {renderCommentContent(comment.content)}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteMutation.mutate(comment.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Comment input */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <Textarea
            value={comment}
            onChange={handleCommentChange}
            placeholder="Add a comment... Type @ to mention someone"
            className="resize-none"
            rows={2}
          />
          
          {/* @mention dropdown */}
          {showMentions && filteredMembers.length > 0 && (
            <div className="absolute bottom-full mb-1 left-0 w-full z-50">
              <div className="bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
                <div className="p-2 space-y-1">
                  {filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-accent rounded-sm text-sm"
                      onClick={() => insertMention(member)}
                    >
                      {member.given_name} {member.surname}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            Tip: Type @ to mention family members
          </span>
          <Button 
            type="submit" 
            size="sm"
            disabled={!comment.trim() || createMutation.isPending}
          >
            <Send className="h-3 w-3 mr-1" />
            Post
          </Button>
        </div>
      </form>
    </div>
  )
}
