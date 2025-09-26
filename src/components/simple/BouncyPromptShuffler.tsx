import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shuffle, Sparkles, Zap, Heart, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConfetti } from '@/hooks/useConfetti'

interface BouncyPromptShufflerProps {
  onPromptSelect?: (prompt: string) => void
  className?: string
}

// Fun prompts for different age groups and interests
const funPrompts = [
  // Family & Memories
  "What's your favorite memory from this week? 🌟",
  "Share a funny story that happened today! 😂",
  "What made you smile the biggest today? 😊",
  "Show us your current mood with emojis! 🎭",
  "What's something cool you learned recently? 🤓",
  
  // Creative & Hobbies
  "Share a photo of something you created! 🎨",
  "What's your favorite song right now? 🎵",
  "Show us your pet or a cute animal you saw! 🐾",
  "What's your go-to snack? 🍪",
  "Share your current obsession! ⭐",
  
  // Daily Life
  "What are you most excited about? 🚀",
  "Show us your outfit of the day! 👕",
  "What's your ideal weekend plan? 🌈",
  "Share something that made you proud! 🏆",
  "What superpower would you want today? ⚡",
  
  // Fun & Games
  "If you were an animal, what would you be? 🦁",
  "What's your perfect pizza topping combo? 🍕",
  "Show us your workspace or study area! 📚",
  "What emoji describes your day? 😎",
  "Share your latest adventure! 🗺️",
  
  // School & Friends
  "What's something awesome your friend did? 👫",
  "Share a skill you're learning! 🎯",
  "What made you laugh out loud today? 🤣",
  "Show us something beautiful you saw! 💖",
  "What's your current favorite app or game? 📱",
  
  // Seasonal & Special
  "What's your dream vacation spot? 🏝️",
  "Share your favorite family tradition! 🎉",
  "What's something you're grateful for? 🙏",
  "Show us your favorite corner of your room! 🏠",
  "What's your biggest goal right now? 🎯"
]

const promptCategories = [
  { name: 'Random Fun', icon: Shuffle, color: 'text-purple-500' },
  { name: 'Creative', icon: Sparkles, color: 'text-pink-500' },
  { name: 'Daily Vibes', icon: Zap, color: 'text-blue-500' },
  { name: 'Feel Good', icon: Heart, color: 'text-red-500' },
  { name: 'Goals & Dreams', icon: Star, color: 'text-yellow-500' }
]

export default function BouncyPromptShuffler({ 
  onPromptSelect, 
  className 
}: BouncyPromptShufflerProps) {
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [isShuffling, setIsShuffling] = useState(false)
  const [shuffleCount, setShuffleCount] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState(0)
  const { celebratePost, triggerConfetti } = useConfetti()

  useEffect(() => {
    // Set initial random prompt
    shufflePrompt()
  }, [])

  const shufflePrompt = async () => {
    setIsShuffling(true)
    setShuffleCount(prev => prev + 1)
    
    // Add some suspense with multiple shuffles
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const randomPrompt = funPrompts[Math.floor(Math.random() * funPrompts.length)]
        setCurrentPrompt(randomPrompt)
      }, i * 200)
    }
    
    // Final prompt after 600ms
    setTimeout(() => {
      const randomPrompt = funPrompts[Math.floor(Math.random() * funPrompts.length)]
      setCurrentPrompt(randomPrompt)
      setIsShuffling(false)
      
      // Trigger confetti every 5th shuffle for extra fun
      if (shuffleCount % 5 === 0 && shuffleCount > 0) {
        triggerConfetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.7 }
        })
      }
    }, 600)
  }

  const handlePromptSelect = () => {
    if (currentPrompt && onPromptSelect) {
      onPromptSelect(currentPrompt)
      celebratePost()
    }
  }

  const getCategoryPrompts = (categoryIndex: number) => {
    const categories = [
      funPrompts, // Random Fun - all prompts
      funPrompts.filter(p => p.includes('🎨') || p.includes('🎵') || p.includes('created')), // Creative
      funPrompts.filter(p => p.includes('today') || p.includes('week') || p.includes('mood')), // Daily
      funPrompts.filter(p => p.includes('smile') || p.includes('proud') || p.includes('grateful')), // Feel Good
      funPrompts.filter(p => p.includes('goal') || p.includes('dream') || p.includes('excited')) // Goals
    ]
    return categories[categoryIndex] || funPrompts
  }

  const selectCategoryPrompt = (categoryIndex: number) => {
    setSelectedCategory(categoryIndex)
    setIsShuffling(true)
    
    const categoryPrompts = getCategoryPrompts(categoryIndex)
    const randomPrompt = categoryPrompts.length > 0 
      ? categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)]
      : funPrompts[Math.floor(Math.random() * funPrompts.length)]
    
    setTimeout(() => {
      setCurrentPrompt(randomPrompt)
      setIsShuffling(false)
    }, 400)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Prompt Card */}
      <Card className={cn(
        "border-2 transition-all duration-300 hover:shadow-lg",
        isShuffling && "animate-bounce border-primary shadow-xl scale-105"
      )}>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className={cn(
                "w-5 h-5 text-primary transition-all duration-300",
                isShuffling && "animate-spin text-pink-500"
              )} />
              <Badge variant="outline" className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
                Prompt #{shuffleCount + 1}
              </Badge>
              <Sparkles className={cn(
                "w-5 h-5 text-primary transition-all duration-300",
                isShuffling && "animate-spin text-purple-500"
              )} />
            </div>
            
            <div className={cn(
              "min-h-16 flex items-center justify-center px-4 py-6 rounded-lg bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 transition-all duration-500",
              isShuffling && "animate-pulse bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100"
            )}>
              <p className={cn(
                "text-lg font-semibold text-center transition-all duration-300",
                isShuffling && "animate-bounce text-primary scale-105"
              )}>
                {currentPrompt || "Loading a fun prompt for you... ✨"}
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                onClick={shufflePrompt}
                disabled={isShuffling}
                variant="outline"
                size="lg"
                className={cn(
                  "font-bold transition-all duration-300 hover-scale border-2",
                  "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200",
                  "hover:from-purple-100 hover:to-pink-100 hover:border-purple-300",
                  isShuffling && "animate-bounce"
                )}
              >
                <Shuffle className={cn(
                  "w-4 h-4 mr-2 transition-transform duration-300",
                  isShuffling && "animate-spin"
                )} />
                {isShuffling ? "Shuffling..." : "Shuffle Again!"}
              </Button>
              
              {currentPrompt && onPromptSelect && (
                <Button
                  onClick={handlePromptSelect}
                  disabled={isShuffling}
                  size="lg"
                  className={cn(
                    "font-bold bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover-scale",
                    "hover:from-green-600 hover:to-blue-600"
                  )}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Use This One! 🎯
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Category Quick Picks */}
      <Card className="border border-muted">
        <CardContent className="p-4">
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-center flex items-center justify-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Quick Pick by Vibe
              <Star className="w-4 h-4 text-yellow-500" />
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {promptCategories.map((category, index) => {
                const IconComponent = category.icon
                const isSelected = selectedCategory === index
                
                return (
                  <Button
                    key={index}
                    variant={isSelected ? "default" : "ghost"}
                    size="sm"
                    onClick={() => selectCategoryPrompt(index)}
                    disabled={isShuffling}
                    className={cn(
                      "flex flex-col items-center gap-1 h-auto p-3 transition-all duration-300 hover-scale",
                      isSelected && "bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-lg",
                      !isSelected && "hover:bg-gradient-to-br hover:from-pink-50 hover:to-purple-50"
                    )}
                  >
                    <IconComponent className={cn(
                      "w-5 h-5 transition-all duration-300",
                      isSelected ? "text-white animate-pulse" : category.color,
                      isShuffling && selectedCategory === index && "animate-bounce"
                    )} />
                    <span className="text-xs font-medium text-center">
                      {category.name}
                    </span>
                  </Button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Fun Stats */}
      {shuffleCount > 0 && (
        <div className="text-center">
          <Badge variant="outline" className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <Sparkles className="w-3 h-3 mr-1" />
            You've shuffled {shuffleCount} time{shuffleCount !== 1 ? 's' : ''}! 
            {shuffleCount >= 10 && " 🏆"}
            {shuffleCount >= 20 && " You're on fire! 🔥"}
          </Badge>
        </div>
      )}
    </div>
  )
}