import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProgressRing } from '@/components/design-system'
import { 
  PenTool, 
  Mic, 
  Camera, 
  Zap, 
  Shuffle, 
  ArrowRight, 
  Sparkles,
  Heart,
  Book,
  Map,
  Star
} from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { cn } from '@/lib/utils'

interface PromptCard {
  id: string
  title: string
  description: string
  theme: 'family' | 'childhood' | 'wisdom' | 'adventure' | 'love' | 'tradition'
  illustration?: string
  examples?: string[]
  difficulty: 'easy' | 'medium' | 'deep'
  estimatedTime: string
}

interface ImmersivePromptCardProps {
  prompt: PromptCard
  streak: number
  progress: number
  onShuffle: () => void
  onModeSelect: (mode: 'write' | 'voice' | 'photo' | 'quick') => void
  className?: string
}

const themeConfig = {
  family: {
    gradient: 'from-amber-50 to-orange-100',
    icon: Heart,
    color: 'text-amber-600',
    illustration: '👨‍👩‍👧‍👦'
  },
  childhood: {
    gradient: 'from-blue-50 to-sky-100', 
    icon: Star,
    color: 'text-blue-600',
    illustration: '🎈'
  },
  wisdom: {
    gradient: 'from-purple-50 to-violet-100',
    icon: Book,
    color: 'text-purple-600',
    illustration: '🦉'
  },
  adventure: {
    gradient: 'from-green-50 to-emerald-100',
    icon: Map,
    color: 'text-green-600',
    illustration: '🗺️'
  },
  love: {
    gradient: 'from-pink-50 to-rose-100',
    icon: Heart,
    color: 'text-pink-600',
    illustration: '💕'
  },
  tradition: {
    gradient: 'from-slate-50 to-gray-100',
    icon: Book,
    color: 'text-slate-600',
    illustration: '🏛️'
  }
}

const inputModes = [
  {
    id: 'write',
    label: 'Write',
    icon: PenTool,
    description: 'Type your story',
    shortcut: 'W',
    color: 'bg-blue-50 text-blue-600 hover:bg-blue-100'
  },
  {
    id: 'voice',
    label: 'Voice',
    icon: Mic,
    description: 'Record audio',
    shortcut: 'V',
    color: 'bg-red-50 text-red-600 hover:bg-red-100'
  },
  {
    id: 'photo',
    label: 'Photo Scan',
    icon: Camera,
    description: 'Add photos & describe',
    shortcut: 'P',
    color: 'bg-green-50 text-green-600 hover:bg-green-100'
  },
  {
    id: 'quick',
    label: 'Quick Voice',
    icon: Zap,
    description: '60-second capture',
    shortcut: 'Q',
    color: 'bg-purple-50 text-purple-600 hover:bg-purple-100'
  }
]

export function ImmersivePromptCard({ 
  prompt, 
  streak, 
  progress, 
  onShuffle, 
  onModeSelect,
  className 
}: ImmersivePromptCardProps) {
  const { track } = useAnalytics()
  const [isShuffling, setIsShuffling] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  const theme = themeConfig[prompt.theme]
  const ThemeIcon = theme.icon

  useEffect(() => {
    // Show celebration when streak increases
    if (streak > 0 && streak % 7 === 0) {
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 2000)
    }
  }, [streak])

  const handleShuffle = () => {
    setIsShuffling(true)
    track('prompt.shuffle', { 
      currentPrompt: prompt.id,
      theme: prompt.theme 
    })
    
    setTimeout(() => {
      onShuffle()
      setIsShuffling(false)
    }, 600)
  }

  const handleModeSelect = (mode: 'write' | 'voice' | 'photo' | 'quick') => {
    track('prompt.input_type_selected', { 
      mode,
      promptId: prompt.id,
      theme: prompt.theme,
      difficulty: prompt.difficulty
    })
    onModeSelect(mode)
  }

  return (
    <div className={cn("relative", className)}>
      {/* Celebration overlay */}
      {showCelebration && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl animate-fade-in">
          <div className="text-center animate-scale-in">
            <Sparkles className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
            <h3 className="text-2xl font-bold mb-2">Week Complete! 🎉</h3>
            <p className="text-muted-foreground">Amazing {streak}-day streak!</p>
          </div>
        </div>
      )}

      <Card className={cn(
        "immersive-prompt-card relative overflow-hidden border-0 shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]",
        "bg-gradient-to-br", theme.gradient
      )}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5Q0EzQUYiIGZpbGwtb3BhY2l0eT0iMC4yIj48Y2lyY2xlIGN4PSIzIiBjeT0iMyIgcj0iMyIvPjwvZz48L2c+PC9zdmc+')] bg-repeat" />
        </div>

        {/* Header with streak and progress */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ProgressRing 
                progress={progress} 
                size="md" 
                className="text-primary"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <ThemeIcon className={cn("h-5 w-5", theme.color)} />
              </div>
            </div>
            
            {streak > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  🔥 Day {streak}
                </Badge>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleShuffle}
            disabled={isShuffling}
            className="hover-scale transition-all duration-200 hover:bg-white/50"
            aria-label="Shuffle to get a new prompt"
          >
            <Shuffle className={cn(
              "h-4 w-4 transition-transform duration-500",
              isShuffling && "animate-spin"
            )} />
            <span className="ml-2 text-sm font-medium">Shuffle</span>
          </Button>
        </div>

        {/* Main content */}
        <div className="px-6 pb-6">
          {/* Theme illustration */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4 animate-fade-in">
              {theme.illustration}
            </div>
            <Badge variant="outline" className="mb-4 bg-white/50">
              {prompt.theme.charAt(0).toUpperCase() + prompt.theme.slice(1)} • {prompt.estimatedTime}
            </Badge>
          </div>

          {/* Prompt content */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-3 leading-tight">
              {prompt.title}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
              {prompt.description}
            </p>
          </div>

          {/* Examples (if available) */}
          {prompt.examples && prompt.examples.length > 0 && (
            <div className="mb-8 p-4 bg-white/50 rounded-lg">
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                Example starters:
              </h4>
              <div className="space-y-1">
                {prompt.examples.slice(0, 2).map((example, index) => (
                  <p key={index} className="text-sm italic">
                    "{example}"
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Input modes */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-center text-muted-foreground">
              How would you like to capture this story?
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {inputModes.map((mode) => (
                <Button
                  key={mode.id}
                  variant="outline"
                  className={cn(
                    "h-auto p-4 justify-start bg-white/70 border-2 border-transparent hover:border-white transition-all duration-200 hover-scale",
                    "hover:bg-white hover:shadow-md"
                  )}
                  onClick={() => handleModeSelect(mode.id as any)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className={cn(
                      "p-2 rounded-md transition-colors",
                      mode.color
                    )}>
                      <mode.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm flex items-center gap-2">
                        {mode.label}
                        <kbd className="inline-flex items-center px-1.5 py-0.5 bg-muted rounded text-xs font-mono opacity-60">
                          {mode.shortcut}
                        </kbd>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {mode.description}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Quick tip */}
          <div className="mt-6 p-3 bg-white/30 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              💡 <strong>Pro tip:</strong> Stories can be as short as one sentence or as long as you'd like. 
              Every memory matters!
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}