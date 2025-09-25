import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Heart, ThumbsUp, Smile, Star, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { Reaction } from '@/lib/types'

interface EnhancedReactionBarProps {
  targetType: 'story' | 'answer' | 'comment'
  targetId: string
  familyId: string
  compact?: boolean
}

// Basic reactions for all ages
const basicReactions = [
  { type: 'heart', emoji: '❤️', label: 'Love' },
  { type: 'thumbs_up', emoji: '👍', label: 'Like' },
  { type: 'smile', emoji: '😊', label: 'Happy' },
  { type: 'star', emoji: '⭐', label: 'Favorite' },
]

// Fun reactions for teens and families
const funReactions = [
  { type: 'fire', emoji: '🔥', label: 'Fire' },
  { type: 'mind_blown', emoji: '🤯', label: 'Mind blown' },
  { type: 'crying_laugh', emoji: '😂', label: 'Hilarious' },
  { type: 'clap', emoji: '👏', label: 'Amazing' },
  { type: 'party', emoji: '🎉', label: 'Celebrate' },
  { type: 'shocked', emoji: '😱', label: 'Shocked' },
  { type: 'thinking', emoji: '🤔', label: 'Interesting' },
  { type: 'cool', emoji: '😎', label: 'Cool' },
  { type: 'hug', emoji: '🤗', label: 'Hugs' },
  { type: 'rainbow', emoji: '🌈', label: 'Beautiful' },
  { type: 'sparkles', emoji: '✨', label: 'Magical' },
  { type: 'muscle', emoji: '💪', label: 'Strong' },
]

export default function EnhancedReactionBar({ 
  targetType, 
  targetId, 
  familyId, 
  compact = false 
}: EnhancedReactionBarProps) {
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showMoreReactions, setShowMoreReactions] = useState(false)
  const { toast } = useToast()

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
        
        toast({
          title: "Reaction removed",
          duration: 2000,
        })
      } else {
        // Add or update reaction
        if (userReaction) {
          // Update existing reaction
          await (supabase as any)
            .from('reactions')
            .update({ reaction_type: reactionType })
            .eq(column, targetId)
            .eq('profile_id', user.id)
            
          setReactions(prev => prev.map(r => 
            r.profile_id === user.id 
              ? { ...r, reaction_type: reactionType }
              : r
          ))
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
        
        // Find the emoji for the reaction
        const allReactions = [...basicReactions, ...funReactions]
        const reactionData = allReactions.find(r => r.type === reactionType)
        
        toast({
          title: `Reacted with ${reactionData?.emoji || '✨'}`,
          description: reactionData?.label || 'Thanks for your reaction!',
          duration: 2000,
        })
      }
      
      setShowMoreReactions(false)
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

  const getReactionCount = (type: string) => {
    return reactions.filter(r => r.reaction_type === type).length
  }

  const getTopReactions = () => {
    const counts = new Map()
    reactions.forEach(r => {
      counts.set(r.reaction_type, (counts.get(r.reaction_type) || 0) + 1)
    })
    
    return Array.from(counts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, compact ? 3 : 5)
      .map(([type, count]) => ({ type, count }))
  }

  const allReactions = [...basicReactions, ...funReactions]
  const topReactions = getTopReactions()

  if (compact && topReactions.length === 0) {
    return (
      <div className="flex items-center gap-2">
        {basicReactions.slice(0, 3).map(({ type, emoji, label }) => (
          <Button
            key={type}
            variant="ghost"
            size="sm"
            onClick={() => handleReaction(type)}
            disabled={loading}
            className="h-8 px-2 hover:bg-primary/10"
            title={label}
          >
            <span className="text-lg">{emoji}</span>
          </Button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Basic quick reactions */}
      {basicReactions.map(({ type, emoji, label }) => {
        const count = getReactionCount(type)
        const isActive = userReaction === type
        
        return (
          <Button
            key={type}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            onClick={() => handleReaction(type)}
            disabled={loading}
            className={cn(
              "flex items-center gap-1 h-8",
              isActive && "bg-primary text-primary-foreground",
              !compact && "px-3"
            )}
            title={label}
          >
            <span className="text-base">{emoji}</span>
            {count > 0 && !compact && <span className="text-xs font-medium">{count}</span>}
          </Button>
        )
      })}

      {/* Show top reactions if any */}
      {!compact && topReactions.length > 0 && (
        <div className="flex items-center gap-1">
          {topReactions.map(({ type, count }) => {
            const reaction = allReactions.find(r => r.type === type)
            if (!reaction || basicReactions.find(r => r.type === type)) return null
            
            const isActive = userReaction === type
            
            return (
              <Button
                key={type}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => handleReaction(type)}
                disabled={loading}
                className={cn(
                  "flex items-center gap-1 h-8 px-2",
                  isActive && "bg-primary text-primary-foreground"
                )}
                title={reaction.label}
              >
                <span className="text-base">{reaction.emoji}</span>
                <Badge variant="secondary" className="h-4 min-w-4 text-xs">
                  {count}
                </Badge>
              </Button>
            )
          })}
        </div>
      )}

      {/* More reactions popover */}
      <Popover open={showMoreReactions} onOpenChange={setShowMoreReactions}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-primary/10"
            title="More reactions"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Pick a reaction</h4>
            
            <div className="space-y-3">
              {/* Basic reactions */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Quick reactions</p>
                <div className="grid grid-cols-4 gap-2">
                  {basicReactions.map(({ type, emoji, label }) => {
                    const count = getReactionCount(type)
                    const isActive = userReaction === type
                    
                    return (
                      <Button
                        key={type}
                        variant={isActive ? "default" : "ghost"}
                        onClick={() => handleReaction(type)}
                        disabled={loading}
                        className={cn(
                          "flex flex-col items-center gap-1 h-auto p-2",
                          isActive && "bg-primary text-primary-foreground"
                        )}
                      >
                        <span className="text-xl">{emoji}</span>
                        <span className="text-xs font-medium">{label}</span>
                        {count > 0 && (
                          <Badge variant="secondary" className="h-4 min-w-4 text-xs">
                            {count}
                          </Badge>
                        )}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Fun reactions */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Fun reactions</p>
                <div className="grid grid-cols-4 gap-2">
                  {funReactions.map(({ type, emoji, label }) => {
                    const count = getReactionCount(type)
                    const isActive = userReaction === type
                    
                    return (
                      <Button
                        key={type}
                        variant={isActive ? "default" : "ghost"}
                        onClick={() => handleReaction(type)}
                        disabled={loading}
                        className={cn(
                          "flex flex-col items-center gap-1 h-auto p-2",
                          isActive && "bg-primary text-primary-foreground"
                        )}
                      >
                        <span className="text-xl">{emoji}</span>
                        <span className="text-xs font-medium">{label}</span>
                        {count > 0 && (
                          <Badge variant="secondary" className="h-4 min-w-4 text-xs">
                            {count}
                          </Badge>
                        )}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}