import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/design-system'
import { 
  PenTool, 
  Heart, 
  Star, 
  ArrowRight,
  Play,
  Users,
  Home,
  Clock
} from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { cn } from '@/lib/utils'

interface StarterPrompt {
  id: string
  title: string
  description: string
  theme: string
  icon: React.ComponentType<{ className?: string }>
  examples: string[]
  estimatedTime: string
  difficulty: 'easy' | 'medium'
  color: string
}

const starterPrompts: StarterPrompt[] = [
  {
    id: 'first-memory',
    title: 'A favorite childhood memory',
    description: 'Share a moment that still makes you smile',
    theme: 'childhood',
    icon: Star,
    examples: [
      'Playing in the backyard with my siblings',
      'A special birthday celebration',
      'Learning to ride a bike'
    ],
    estimatedTime: '2-3 min',
    difficulty: 'easy',
    color: 'bg-blue-50 border-blue-200 text-blue-600'
  },
  {
    id: 'family-tradition',
    title: 'A family tradition you love',
    description: 'Tell about something your family does together',
    theme: 'family',
    icon: Heart,
    examples: [
      'Sunday dinners at grandma\'s house',
      'Holiday traditions we never skip',
      'Annual family vacation memories'
    ],
    estimatedTime: '3-4 min',
    difficulty: 'easy',
    color: 'bg-red-50 border-red-200 text-red-600'
  },
  {
    id: 'home-story',
    title: 'The story of a special place',
    description: 'Describe a place that holds meaning for you',
    theme: 'places',
    icon: Home,
    examples: [
      'The house I grew up in',
      'My grandmother\'s kitchen',
      'A place where I felt truly happy'
    ],
    estimatedTime: '4-5 min',
    difficulty: 'medium',
    color: 'bg-green-50 border-green-200 text-green-600'
  }
]

interface StarterSetProps {
  onPromptSelect: (promptId: string) => void
  onGetStarted: () => void
  className?: string
}

export function StarterSet({ onPromptSelect, onGetStarted, className }: StarterSetProps) {
  const { track } = useAnalytics()

  const handlePromptSelect = (prompt: StarterPrompt) => {
    track('create_item_selected', { 
      promptId: prompt.id,
      theme: prompt.theme,
      difficulty: prompt.difficulty
    })
    onPromptSelect(prompt.id)
  }

  const handleGetStarted = () => {
    track('create_item_selected')
    onGetStarted()
  }

  return (
    <div className={cn("starter-set space-y-6", className)}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="text-4xl mb-4">📚</div>
        <h2 className="text-2xl font-bold">Start Your Story Collection</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Every family has amazing stories waiting to be shared. 
          Pick one of these gentle prompts to begin capturing your memories.
        </p>
      </div>

      {/* Starter prompts grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {starterPrompts.map((prompt, index) => {
          const IconComponent = prompt.icon
          
          return (
            <Card
              key={prompt.id}
              className={cn(
                "starter-prompt-card p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-2",
                "animate-fade-in hover-scale",
                prompt.color
              )}
              style={{ 
                animationDelay: `${index * 150}ms`,
                animationFillMode: 'both'
              }}
              onClick={() => handlePromptSelect(prompt)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-white/70">
                  <IconComponent className="h-5 w-5" />
                </div>
                <Badge variant="secondary" className="bg-white/70 text-xs">
                  {prompt.estimatedTime}
                </Badge>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <h3 className="font-semibold text-base leading-tight">
                  {prompt.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {prompt.description}
                </p>

                {/* Examples */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">
                    Ideas to get you started:
                  </h4>
                  <div className="space-y-1">
                    {prompt.examples.slice(0, 2).map((example, exampleIndex) => (
                      <p key={exampleIndex} className="text-xs italic opacity-80">
                        "•  {example}"
                      </p>
                    ))}
                  </div>
                </div>

                {/* Action */}
                <div className="pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-between text-sm bg-white/50 hover:bg-white/80"
                  >
                    <span className="flex items-center gap-2">
                      <Play className="h-3 w-3" />
                      Start this story
                    </span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Alternative action */}
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-4 text-muted-foreground">
              Or browse all prompts
            </span>
          </div>
        </div>

        <Button 
          variant="outline" 
          onClick={handleGetStarted}
          className="hover-scale"
        >
          <Users className="h-4 w-4 mr-2" />
          Explore All Prompts
        </Button>
      </div>

      {/* Encouragement */}
      <div className="text-center p-4 bg-muted/30 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Remember:</strong> There's no wrong way to tell your story. 
          Share as much or as little as feels comfortable. 
          Your family will treasure whatever you choose to capture. ❤️
        </p>
      </div>
    </div>
  )
}