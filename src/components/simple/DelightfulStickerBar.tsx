import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sparkles, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useConfetti } from '@/hooks/useConfetti'

interface DelightfulStickerBarProps {
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

// Expanded fun reactions for younger users
const quickReactions = [
  { type: 'love', emoji: '😍', label: 'Love it!', animation: 'hearts' },
  { type: 'fire', emoji: '🔥', label: 'Fire!', animation: 'fireworks' },
  { type: 'laugh', emoji: '😂', label: 'LOL', animation: 'celebratePost' },
  { type: 'wow', emoji: '🤩', label: 'Amazing!', animation: 'stars' },
]

const stickerCategories = [
  {
    name: '💕 Love',
    stickers: [
      { type: 'heart_eyes', emoji: '😍', label: 'Heart Eyes' },
      { type: 'kiss', emoji: '😘', label: 'Kiss' },
      { type: 'heart', emoji: '❤️', label: 'Red Heart' },
      { type: 'heart_sparkle', emoji: '💖', label: 'Sparkling Heart' },
      { type: 'cupid', emoji: '💘', label: 'Cupid Arrow' },
      { type: 'love_letter', emoji: '💌', label: 'Love Letter' },
    ]
  },
  {
    name: '😄 Funny',
    stickers: [
      { type: 'crying_laugh', emoji: '😂', label: 'Crying Laugh' },
      { type: 'rofl', emoji: '🤣', label: 'ROFL' },
      { type: 'wink', emoji: '😉', label: 'Wink' },
      { type: 'tongue', emoji: '😛', label: 'Tongue Out' },
      { type: 'upside_down', emoji: '🙃', label: 'Upside Down' },
      { type: 'grinning', emoji: '😁', label: 'Big Grin' },
    ]
  },
  {
    name: '😎 Cool',
    stickers: [
      { type: 'sunglasses', emoji: '😎', label: 'Cool' },
      { type: 'fire', emoji: '🔥', label: 'Fire' },
      { type: 'ice', emoji: '🧊', label: 'Ice Cold' },
      { type: 'lightning', emoji: '⚡', label: 'Lightning' },
      { type: 'rocket', emoji: '🚀', label: 'Rocket' },
      { type: 'crown', emoji: '👑', label: 'Crown' },
    ]
  },
  {
    name: '🎉 Party',
    stickers: [
      { type: 'party', emoji: '🎉', label: 'Party' },
      { type: 'confetti', emoji: '🎊', label: 'Confetti' },
      { type: 'celebration', emoji: '🥳', label: 'Celebration' },
      { type: 'balloon', emoji: '🎈', label: 'Balloon' },
      { type: 'cake', emoji: '🎂', label: 'Birthday Cake' },
      { type: 'gift', emoji: '🎁', label: 'Gift' },
    ]
  },
  {
    name: '✨ Magic',
    stickers: [
      { type: 'sparkles', emoji: '✨', label: 'Sparkles' },
      { type: 'star', emoji: '⭐', label: 'Star' },
      { type: 'glowing_star', emoji: '🌟', label: 'Glowing Star' },
      { type: 'unicorn', emoji: '🦄', label: 'Unicorn' },
      { type: 'rainbow', emoji: '🌈', label: 'Rainbow' },
      { type: 'crystal', emoji: '🔮', label: 'Crystal Ball' },
    ]
  },
  {
    name: '🍕 Yummy',
    stickers: [
      { type: 'pizza', emoji: '🍕', label: 'Pizza' },
      { type: 'burger', emoji: '🍔', label: 'Burger' },
      { type: 'ice_cream', emoji: '🍦', label: 'Ice Cream' },
      { type: 'donut', emoji: '🍩', label: 'Donut' },
      { type: 'cookie', emoji: '🍪', label: 'Cookie' },
      { type: 'candy', emoji: '🍭', label: 'Candy' },
    ]
  },
]

export default function DelightfulStickerBar({ 
  targetType, 
  targetId, 
  familyId, 
  compact = false 
}: DelightfulStickerBarProps) {
  const [reactions, setReactions] = useState<ReactionData[]>([])
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showStickers, setShowStickers] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(0)
  const [animatingSticker, setAnimatingSticker] = useState('')
  const { toast } = useToast()
  const { 
    celebrateReaction, 
    hearts, 
    fireworks, 
    celebratePost, 
    stars,
    triggerConfetti 
  } = useConfetti()

  useEffect(() => {
    fetchReactions()
  }, [targetType, targetId, familyId])

  const fetchReactions = async () => {
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

  const handleReaction = async (reactionType: string, hasAnimation = false) => {
    setLoading(true)
    setAnimatingSticker(reactionType)
    
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
            title: "Sticker removed! 🗑️",
            description: "No worries, you can pick another!",
            duration: 2000,
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
          // Get the sticker info
          const quickSticker = quickReactions.find(r => r.type === reactionType)
          const allStickers = stickerCategories.flatMap(cat => cat.stickers)
          const stickerInfo = quickSticker || allStickers.find(r => r.type === reactionType)
          
          // Trigger confetti based on reaction type
          if (hasAnimation) {
            switch (reactionType) {
              case 'love':
              case 'heart_eyes':
              case 'heart':
                hearts()
                break
              case 'fire':
                fireworks()
                break
              case 'laugh':
              case 'crying_laugh':
                celebratePost()
                break
              case 'wow':
              case 'sparkles':
              case 'star':
                stars()
                break
              case 'party':
              case 'confetti':
                celebratePost()
                break
              default:
                celebrateReaction()
            }
          }
          
          toast({
            title: `${stickerInfo?.emoji} ${stickerInfo?.label}!`,
            description: "Your reaction lights up the family! ✨",
            duration: 2500,
          })
        }
      }
      setShowStickers(false)
    } catch (error) {
      console.error('Error handling reaction:', error)
      toast({
        title: "Oops! 😅",
        description: "Something went wrong. Try again?",
        variant: "destructive",
        duration: 2000,
      })
    } finally {
      setLoading(false)
      setTimeout(() => setAnimatingSticker(''), 1000)
    }
  }

  const getReactionCount = (type: string): number => {
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

  const topReactions = getTopReactions()

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Quick Reactions */}
      {quickReactions.map(({ type, emoji, label }) => {
        const count = getReactionCount(type)
        const isActive = userReaction === type
        const isAnimating = animatingSticker === type
        
        return (
          <Button
            key={type}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            onClick={() => handleReaction(type, true)}
            disabled={loading}
            className={cn(
              "flex items-center gap-1.5 h-10 px-3 transition-all duration-300",
              isActive && "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-105",
              !isActive && "hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 hover:scale-105",
              isAnimating && "animate-bounce",
              "font-medium"
            )}
            title={label}
          >
            <span className={cn("text-lg", isAnimating && "animate-pulse")}>{emoji}</span>
            {count > 0 && !compact && (
              <Badge variant="secondary" className="h-4 min-w-4 text-xs bg-white/30 text-current font-bold">
                {count}
              </Badge>
            )}
          </Button>
        )
      })}

      {/* Top Reactions */}
      {!compact && topReactions.length > 0 && (
        <>
          {topReactions.map(({ type, count }) => {
            const allStickers = stickerCategories.flatMap(cat => cat.stickers)
            const sticker = allStickers.find(s => s.type === type)
            if (!sticker || quickReactions.find(r => r.type === type)) return null
            
            const isActive = userReaction === type
            const isAnimating = animatingSticker === type
            
            return (
              <Button
                key={type}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => handleReaction(type, true)}
                disabled={loading}
                className={cn(
                  "flex items-center gap-1.5 h-10 px-3 transition-all duration-300",
                  isActive && "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-105",
                  !isActive && "hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 hover:scale-105",
                  isAnimating && "animate-bounce"
                )}
                title={sticker.label}
              >
                <span className={cn("text-lg", isAnimating && "animate-pulse")}>{sticker.emoji}</span>
                <Badge variant="secondary" className="h-4 min-w-4 text-xs bg-white/30 text-current font-bold">
                  {count}
                </Badge>
              </Button>
            )
          })}
        </>
      )}

      {/* Sticker Picker */}
      <Popover open={showStickers} onOpenChange={setShowStickers}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-10 w-10 p-0 transition-all duration-300 hover:scale-110",
              "hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50",
              "border-2 border-dashed border-primary/30 hover:border-primary"
            )}
            title="More fun stickers!"
          >
            <div className="relative">
              <Plus className="w-4 h-4" />
              <Sparkles className="w-2.5 h-2.5 absolute -top-1 -right-1 text-pink-500 animate-pulse" />
            </div>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-96 p-0 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 border-2 border-pink-200 shadow-xl" 
          align="start"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-lg text-pink-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Fun Stickers!
              </h4>
              <Badge variant="outline" className="bg-white/50 text-pink-700 border-pink-300">
                Pick your vibe! ✨
              </Badge>
            </div>
            
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1 mb-4">
              {stickerCategories.map((category, index) => (
                <Button
                  key={index}
                  variant={selectedCategory === index ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategory(index)}
                  className={cn(
                    "h-8 px-3 text-xs transition-all duration-200",
                    selectedCategory === index && "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md scale-105"
                  )}
                >
                  {category.name}
                </Button>
              ))}
            </div>
            
            {/* Sticker Grid */}
            <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
              {stickerCategories[selectedCategory].stickers.map(({ type, emoji, label }) => {
                const count = getReactionCount(type)
                const isActive = userReaction === type
                const isAnimating = animatingSticker === type
                
                return (
                  <Button
                    key={type}
                    variant={isActive ? "default" : "ghost"}
                    onClick={() => handleReaction(type, true)}
                    disabled={loading}
                    className={cn(
                      "flex flex-col items-center gap-1 h-16 p-2 transition-all duration-300 hover:scale-110 group",
                      isActive && "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg",
                      !isActive && "hover:bg-white/60",
                      isAnimating && "animate-bounce"
                    )}
                    title={label}
                  >
                    <span className={cn(
                      "text-2xl transition-transform group-hover:scale-110", 
                      isAnimating && "animate-pulse"
                    )}>
                      {emoji}
                    </span>
                    {count > 0 && (
                      <Badge variant="secondary" className="h-3 min-w-3 text-xs bg-white/30 text-current px-1 font-bold">
                        {count}
                      </Badge>
                    )}
                  </Button>
                )
              })}
            </div>
            
            <div className="text-center mt-4 p-3 bg-white/30 rounded-lg">
              <p className="text-xs font-medium text-pink-700">
                Tap any sticker to show your reaction! 🎯✨
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}