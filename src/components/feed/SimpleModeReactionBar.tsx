import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useAnalytics } from '@/hooks/useAnalytics'

interface SimpleModeReactionBarProps {
  targetType: 'story' | 'answer' | 'comment'
  targetId: string
  familyId: string
  compact?: boolean
}

interface ReactionData {
  id: string
  profile_id: string
  reaction_type: string
  family_id: string
  story_id?: string
  answer_id?: string
  comment_id?: string
}

// Elder-friendly reactions
const elderReactions = [
  { type: 'heart', emoji: '❤️', label: 'Love', color: 'text-red-500' },
  { type: 'thumbs_up', emoji: '👍', label: 'Like', color: 'text-blue-500' },
  { type: 'clap', emoji: '👏', label: 'Wonderful', color: 'text-yellow-500' },
  { type: 'hug', emoji: '🤗', label: 'Hugs', color: 'text-pink-500' },
]

// Fun sticker reactions for all ages
const stickerReactions = [
  { type: 'fire', emoji: '🔥', label: 'Amazing', color: 'text-orange-500' },
  { type: 'star_eyes', emoji: '🤩', label: 'Wow', color: 'text-yellow-500' },
  { type: 'party', emoji: '🎉', label: 'Celebrate', color: 'text-purple-500' },
  { type: 'laugh_cry', emoji: '😂', label: 'Hilarious', color: 'text-blue-500' },
]

export function SimpleModeReactionBar({ 
  targetType, 
  targetId, 
  familyId, 
  compact = false 
}: SimpleModeReactionBarProps) {
  const [reactions, setReactions] = useState<ReactionData[]>([])
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showStickers, setShowStickers] = useState(false)
  const { toast } = useToast()
  const { track } = useAnalytics()

  useEffect(() => {
    const getReactions = async () => {
      try {
        let query = supabase.from('reactions').select('*').eq('family_id', familyId)
        
        if (targetType === 'story') {
          query = query.eq('story_id', targetId)
        } else if (targetType === 'answer') {
          query = query.eq('answer_id', targetId)
        } else if (targetType === 'comment') {
          query = query.eq('comment_id', targetId)
        }

        const { data, error } = await query

        if (!error && data) {
          setReactions(data as ReactionData[])
          
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const userReact = data.find((r: any) => r.profile_id === user.id)
            setUserReaction(userReact?.reaction_type || null)
          }
        }
      } catch (error) {
        console.error('Error fetching reactions:', error)
      }
    }
    
    getReactions()
  }, [targetType, targetId, familyId])

  const handleReaction = async (reactionType: string) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (userReaction === reactionType) {
        // Remove reaction
        let deleteQuery = supabase.from('reactions').delete().eq('profile_id', user.id)
        
        if (targetType === 'story') {
          deleteQuery = deleteQuery.eq('story_id', targetId)
        } else if (targetType === 'answer') {
          deleteQuery = deleteQuery.eq('answer_id', targetId)
        } else if (targetType === 'comment') {
          deleteQuery = deleteQuery.eq('comment_id', targetId)
        }

        const { error } = await deleteQuery
        
        if (!error) {
          setUserReaction(null)
          setReactions(prev => prev.filter(r => r.profile_id !== user.id))
          toast({
            title: "Reaction removed",
            duration: 1500,
          })
        }
      } else {
        if (userReaction) {
          // Update existing reaction
          let updateQuery = supabase.from('reactions')
            .update({ reaction_type: reactionType })
            .eq('profile_id', user.id)
            
          if (targetType === 'story') {
            updateQuery = updateQuery.eq('story_id', targetId)
          } else if (targetType === 'answer') {
            updateQuery = updateQuery.eq('answer_id', targetId)
          } else if (targetType === 'comment') {
            updateQuery = updateQuery.eq('comment_id', targetId)
          }

          const { error } = await updateQuery
            
          if (!error) {
            setReactions(prev => prev.map(r => 
              r.profile_id === user.id 
                ? { ...r, reaction_type: reactionType }
                : r
            ))
            setUserReaction(reactionType)
          }
        } else {
          // Create new reaction
          const reactionData: any = {
            profile_id: user.id,
            family_id: familyId,
            reaction_type: reactionType,
          }
          
          if (targetType === 'story') {
            reactionData.story_id = targetId
          } else if (targetType === 'answer') {
            reactionData.answer_id = targetId
          } else if (targetType === 'comment') {
            reactionData.comment_id = targetId
          }
          
          const { data, error } = await supabase
            .from('reactions')
            .insert(reactionData)
            .select()
            .single()
          
          if (!error && data) {
            setReactions(prev => [...prev, data as ReactionData])
            setUserReaction(reactionType)
          }
        }
        
        if (!userReaction || userReaction !== reactionType) {
          const allReactions = [...elderReactions, ...stickerReactions]
          const reactionInfo = allReactions.find(r => r.type === reactionType)
          
          toast({
            title: `${reactionInfo?.emoji} ${reactionInfo?.label}!`,
            description: "Your reaction has been shared with the family.",
            duration: 2000,
          })

          track('activity_reaction', { targetType, targetId, reactionType, familyId })
        }
      }
      setShowStickers(false)
    } catch (error) {
      console.error('Error handling reaction:', error)
      toast({
        title: "Failed to react",
        description: "Please try again",
        variant: "destructive",
        duration: 2000,
      })
    } finally {
      setLoading(false)
    }
  }

  const getReactionCount = (type: string): number => {
    return reactions.filter(r => r.reaction_type === type).length
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {elderReactions.map(({ type, emoji, label, color }) => {
        const count = getReactionCount(type)
        const isActive = userReaction === type
        
        return (
          <Button
            key={type}
            variant={isActive ? "default" : "ghost"}
            size={compact ? "sm" : "default"}
            onClick={() => handleReaction(type)}
            disabled={loading}
            className={cn(
              "flex items-center gap-2 transition-all duration-300",
              isActive && "bg-primary text-primary-foreground scale-105",
              compact ? "h-8 px-3" : "h-10 px-4",
              "hover:scale-105 hover:shadow-md"
            )}
            title={label}
          >
            <span className={cn("text-lg", isActive && color)}>{emoji}</span>
            {count > 0 && <Badge variant="secondary" className="h-5 min-w-5 text-xs">{count}</Badge>}
          </Button>
        )
      })}

      <Popover open={showStickers} onOpenChange={setShowStickers}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-2 border-dashed hover:border-primary">
            <Sparkles className="w-4 h-4 text-primary" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4">
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Fun Reactions & Stickers</h4>
            <div className="grid grid-cols-4 gap-3">
              {stickerReactions.map(({ type, emoji, label, color }) => {
                const count = getReactionCount(type)
                const isActive = userReaction === type
                
                return (
                  <Button
                    key={type}
                    variant={isActive ? "default" : "ghost"}
                    onClick={() => handleReaction(type)}
                    disabled={loading}
                    className="flex flex-col items-center gap-2 h-auto p-3"
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-xs font-medium">{label}</span>
                    {count > 0 && <Badge variant="secondary" className="h-4 min-w-4 text-xs">{count}</Badge>}
                  </Button>
                )
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}