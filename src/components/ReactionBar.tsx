import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Heart, ThumbsUp, Smile, Star } from 'lucide-react'
import type { Reaction } from '@/lib/types'

interface ReactionBarProps {
  targetType: 'story' | 'answer' | 'comment'
  targetId: string
  familyId: string
}

const reactionTypes = [
  { type: 'heart', icon: Heart, label: '❤️' },
  { type: 'thumbs_up', icon: ThumbsUp, label: '👍' },
  { type: 'smile', icon: Smile, label: '😊' },
  { type: 'star', icon: Star, label: '⭐' },
]

export default function ReactionBar({ targetType, targetId, familyId }: ReactionBarProps) {
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const getReactions = async () => {
      const column = `${targetType}_id`
      const { data } = await (supabase as any)
        .from('reactions')
        .select('*')
        .eq(column, targetId)
        .eq('family_id', familyId)

      if (data) {
        setReactions(data)
        
        // Check if current user has reacted
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const userReact = data.find((r: any) => r.profile_id === user.id)
          setUserReaction(userReact?.reaction_type || null)
        }
      }
    }

    getReactions()
  }, [targetType, targetId, familyId])

  const handleReaction = async (reactionType: string) => {
    setLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const column = `${targetType}_id`
      
      if (userReaction === reactionType) {
        // Remove reaction
        await (supabase as any)
          .from('reactions')
          .delete()
          .eq(column, targetId)
          .eq('profile_id', user.id)
        
        setUserReaction(null)
        setReactions(prev => prev.filter((r: any) => r.profile_id !== user.id))
      } else {
        // Add or update reaction
        if (userReaction) {
          // Update existing reaction
          await (supabase as any)
            .from('reactions')
            .update({ reaction_type: reactionType })
            .eq(column, targetId)
            .eq('profile_id', user.id)
        } else {
          // Create new reaction
          const { data } = await (supabase as any)
            .from('reactions')
            .insert({
              [column]: targetId,
              profile_id: user.id,
              family_id: familyId,
              reaction_type: reactionType,
            })
            .select()
            .single()
          
          if (data) {
            setReactions(prev => [...prev, data])
          }
        }
        
        setUserReaction(reactionType)
      }
    } catch (error) {
      console.error('Error handling reaction:', error)
    } finally {
      setLoading(false)
    }
  }

  const getReactionCount = (type: string) => {
    return reactions.filter(r => r.reaction_type === type).length
  }

  return (
    <div className="flex items-center space-x-2">
      {reactionTypes.map(({ type, label }) => {
        const count = getReactionCount(type)
        const isActive = userReaction === type
        
        return (
          <Button
            key={type}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            onClick={() => handleReaction(type)}
            disabled={loading}
            className="flex items-center space-x-1"
          >
            <span>{label}</span>
            {count > 0 && <span className="text-xs">{count}</span>}
          </Button>
        )
      })}
    </div>
  )
}