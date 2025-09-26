import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Heart, Smile, Plus, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { Reaction } from '@/lib/types'

interface StickerReactionBarProps {
  targetType: 'story' | 'answer' | 'comment'
  targetId: string
  familyId: string
  compact?: boolean
}

// Fun stickers for younger users
const stickerReactions = [
  { type: 'heart_eyes', emoji: '😍', label: 'Love it!', category: 'love' },
  { type: 'fire', emoji: '🔥', label: 'Fire!', category: 'cool' },
  { type: 'crying_laugh', emoji: '😂', label: 'Hilarious', category: 'funny' },
  { type: 'mind_blown', emoji: '🤯', label: 'Mind blown', category: 'wow' },
  { type: 'party', emoji: '🎉', label: 'Party time!', category: 'celebration' },
  { type: 'unicorn', emoji: '🦄', label: 'Magical', category: 'fantasy' },
  { type: 'rainbow', emoji: '🌈', label: 'Beautiful', category: 'beauty' },
  { type: 'sparkles', emoji: '✨', label: 'Sparkly', category: 'magic' },
  { type: 'sunglasses', emoji: '😎', label: 'So cool', category: 'cool' },
  { type: 'dizzy', emoji: '💫', label: 'Amazing', category: 'wow' },
  { type: 'star_struck', emoji: '🤩', label: 'Star struck', category: 'wow' },
  { type: 'zap', emoji: '⚡', label: 'Electric', category: 'energy' },
  { type: 'rocket', emoji: '🚀', label: 'Awesome', category: 'cool' },
  { type: 'crown', emoji: '👑', label: 'Royal', category: 'special' },
  { type: 'gem', emoji: '💎', label: 'Precious', category: 'special' },
  { type: 'butterfly', emoji: '🦋', label: 'Pretty', category: 'beauty' },
  { type: 'shooting_star', emoji: '🌟', label: 'Superstar', category: 'special' },
  { type: 'cake', emoji: '🎂', label: 'Sweet', category: 'celebration' },
  { type: 'pizza', emoji: '🍕', label: 'Yummy', category: 'food' },
  { type: 'ice_cream', emoji: '🍦', label: 'Cool treat', category: 'food' },
  { type: 'donut', emoji: '🍩', label: 'Delicious', category: 'food' },
  { type: 'cookie', emoji: '🍪', label: 'Sweet', category: 'food' },
  { type: 'balloon', emoji: '🎈', label: 'Fun', category: 'celebration' },
  { type: 'confetti', emoji: '🎊', label: 'Celebrate', category: 'celebration' },
  { type: 'gift', emoji: '🎁', label: 'Special', category: 'celebration' },
]

// Quick access reactions
const quickReactions = [
  { type: 'heart', emoji: '❤️', label: 'Love', category: 'basic' },
  { type: 'thumbs_up', emoji: '👍', label: 'Like', category: 'basic' },
  { type: 'fire', emoji: '🔥', label: 'Fire', category: 'cool' },
  { type: 'crying_laugh', emoji: '😂', label: 'LOL', category: 'funny' },
  { type: 'party', emoji: '🎉', label: 'Party', category: 'celebration' },
]

// Group stickers by category
const stickerCategories = {
  love: '💕 Love',
  funny: '😄 Funny', 
  cool: '😎 Cool',
  wow: '🤩 Wow',
  celebration: '🎉 Celebrate',
  fantasy: '🦄 Fantasy',
  beauty: '🌈 Pretty',
  magic: '✨ Magic',
  energy: '⚡ Energy',
  special: '👑 Special',
  food: '🍕 Yummy'
}

export default function StickerReactionBar({ 
  targetType, 
  targetId, 
  familyId, 
  compact = false 
}: StickerReactionBarProps) {
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showStickerPicker, setShowStickerPicker] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
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
          title: "Sticker removed",
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
        
        // Find the sticker for the reaction
        const allStickers = [...quickReactions, ...stickerReactions]
        const stickerData = allStickers.find(r => r.type === reactionType)
        
        toast({
          title: `${stickerData?.emoji || '✨'} ${stickerData?.label || 'Reacted!'}`,
          description: "Your reaction has been added!",
          duration: 2000,
        })
      }
      
      setShowStickerPicker(false)
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
      .slice(0, compact ? 4 : 6)
      .map(([type, count]) => ({ type, count }))
  }

  const getFilteredStickers = () => {
    if (selectedCategory === 'all') return stickerReactions
    return stickerReactions.filter(s => s.category === selectedCategory)
  }

  const allStickers = [...quickReactions, ...stickerReactions]
  const topReactions = getTopReactions()

  if (compact && topReactions.length === 0) {
    return (
      <div className="flex items-center gap-1">
        {quickReactions.slice(0, 4).map(({ type, emoji, label }) => (
          <Button
            key={type}
            variant="ghost"
            size="sm"
            onClick={() => handleReaction(type)}
            disabled={loading}
            className="h-8 w-8 p-0 hover:bg-primary/10 hover:scale-110 transition-all"
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
      {/* Quick reactions */}
      {quickReactions.map(({ type, emoji, label }) => {
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
              "flex items-center gap-1 h-9 px-2 transition-all hover:scale-105",
              isActive && "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg",
              !isActive && "hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50"
            )}
            title={label}
          >
            <span className="text-base">{emoji}</span>
            {count > 0 && !compact && (
              <Badge variant="secondary" className="h-4 min-w-4 text-xs bg-white/20 text-current">
                {count}
              </Badge>
            )}
          </Button>
        )
      })}

      {/* Show top reactions if any */}
      {!compact && topReactions.length > 0 && (
        <div className="flex items-center gap-1">
          {topReactions.map(({ type, count }) => {
            const sticker = allStickers.find(r => r.type === type)
            if (!sticker || quickReactions.find(r => r.type === type)) return null
            
            const isActive = userReaction === type
            
            return (
              <Button
                key={type}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => handleReaction(type)}
                disabled={loading}
                className={cn(
                  "flex items-center gap-1 h-9 px-2 transition-all hover:scale-105",
                  isActive && "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg"
                )}
                title={sticker.label}
              >
                <span className="text-base">{sticker.emoji}</span>
                <Badge variant="secondary" className="h-4 min-w-4 text-xs bg-white/20 text-current">
                  {count}
                </Badge>
              </Button>
            )
          })}
        </div>
      )}

      {/* Sticker picker popover */}
      <Popover open={showStickerPicker} onOpenChange={setShowStickerPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 hover:scale-110 transition-all"
            title="More stickers"
          >
            <div className="relative">
              <Plus className="w-4 h-4" />
              <Sparkles className="w-2 h-2 absolute -top-0.5 -right-0.5 text-pink-500" />
            </div>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-96 p-4 bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-pink-200" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-lg text-pink-800">Pick a Sticker!</h4>
              <Sparkles className="w-5 h-5 text-pink-500" />
            </div>
            
            {/* Category filters */}
            <div className="flex flex-wrap gap-1">
              <Button
                variant={selectedCategory === 'all' ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className="h-7 px-2 text-xs"
              >
                All
              </Button>
              {Object.entries(stickerCategories).map(([category, label]) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="h-7 px-2 text-xs"
                >
                  {label}
                </Button>
              ))}
            </div>
            
            {/* Sticker grid */}
            <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
              {getFilteredStickers().map(({ type, emoji, label }) => {
                const count = getReactionCount(type)
                const isActive = userReaction === type
                
                return (
                  <Button
                    key={type}
                    variant={isActive ? "default" : "ghost"}
                    onClick={() => handleReaction(type)}
                    disabled={loading}
                    className={cn(
                      "flex flex-col items-center gap-1 h-16 p-1 transition-all hover:scale-110",
                      isActive && "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg",
                      !isActive && "hover:bg-white/50"
                    )}
                  >
                    <span className="text-2xl">{emoji}</span>
                    {count > 0 && (
                      <Badge variant="secondary" className="h-3 min-w-3 text-xs bg-white/20 text-current px-1">
                        {count}
                      </Badge>
                    )}
                  </Button>
                )
              })}
            </div>
            
            <div className="text-center">
              <p className="text-xs text-pink-600">Tap any sticker to react!</p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}