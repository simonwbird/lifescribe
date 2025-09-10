import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Calendar, Heart, Camera, Music, Gift, Snowflake, Sun, Leaf, Flower } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface PromptSuggestion {
  id: string
  title: string
  description: string
  category: 'memory' | 'seasonal' | 'family' | 'tradition' | 'milestone'
  icon: React.ComponentType<any>
  seasonal?: boolean
  season?: 'spring' | 'summer' | 'fall' | 'winter' | 'holiday'
}

export default function EngagementPrompts() {
  const [currentPrompts, setCurrentPrompts] = useState<PromptSuggestion[]>([])
  const navigate = useNavigate()

  const allPrompts: PromptSuggestion[] = [
    // Memory prompts
    {
      id: 'childhood-music',
      title: 'What music did you listen to in your 20s?',
      description: 'Share the soundtrack of your youth',
      category: 'memory',
      icon: Music
    },
    {
      id: 'first-job',
      title: 'Tell us about your first job',
      description: 'What did you learn? Any funny stories?',
      category: 'milestone',
      icon: Heart
    },
    {
      id: 'family-vacation',
      title: 'Favorite family vacation memory',
      description: 'Where did you go? What made it special?',
      category: 'family',
      icon: Camera
    },
    {
      id: 'school-days',
      title: 'What was school like for you?',
      description: 'Favorite subjects, friends, or teachers?',
      category: 'memory',
      icon: Heart
    },
    
    // Seasonal prompts
    {
      id: 'christmas-memory',
      title: 'Share a favorite Christmas memory',
      description: 'Traditions, gifts, or special moments',
      category: 'seasonal',
      icon: Gift,
      seasonal: true,
      season: 'winter'
    },
    {
      id: 'summer-fun',
      title: 'Best summer day as a kid',
      description: 'What made summers special growing up?',
      category: 'seasonal',
      icon: Sun,
      seasonal: true,
      season: 'summer'
    },
    {
      id: 'thanksgiving-tradition',
      title: 'Thanksgiving traditions in your family',
      description: 'Food, gatherings, or special customs',
      category: 'tradition',
      icon: Leaf,
      seasonal: true,
      season: 'fall'
    },
    {
      id: 'spring-memories',
      title: 'Spring renewal and new beginnings',
      description: 'Gardens, fresh starts, or outdoor activities',
      category: 'seasonal',
      icon: Flower,
      seasonal: true,
      season: 'spring'
    },
    
    // Family tradition prompts
    {
      id: 'holiday-food',
      title: 'Special holiday foods your family made',
      description: 'Recipes passed down through generations',
      category: 'tradition',
      icon: Gift
    },
    {
      id: 'family-sayings',
      title: 'Funny things your family always said',
      description: 'Inside jokes, sayings, or expressions',
      category: 'family',
      icon: Heart
    },
    {
      id: 'bedtime-stories',
      title: 'Bedtime stories or lullabies',
      description: 'What stories were told to you as a child?',
      category: 'tradition',
      icon: Heart
    }
  ]

  useEffect(() => {
    const currentMonth = new Date().getMonth()
    const currentSeason = getCurrentSeason(currentMonth)
    
    // Filter prompts based on season and randomly select 3-4
    const seasonalPrompts = allPrompts.filter(prompt => {
      if (prompt.seasonal && prompt.season === currentSeason) return true
      if (!prompt.seasonal) return true
      return false
    })
    
    // Randomly select 3-4 prompts
    const shuffled = seasonalPrompts.sort(() => 0.5 - Math.random())
    setCurrentPrompts(shuffled.slice(0, 4))
  }, [])

  const getCurrentSeason = (month: number): 'spring' | 'summer' | 'fall' | 'winter' => {
    if (month >= 2 && month <= 4) return 'spring'
    if (month >= 5 && month <= 7) return 'summer'
    if (month >= 8 && month <= 10) return 'fall'
    return 'winter'
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'memory': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'seasonal': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'family': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'tradition': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'milestone': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const handlePromptClick = (prompt: PromptSuggestion) => {
    // Navigate to new story page with the prompt pre-filled
    navigate(`/stories/new?prompt=${encodeURIComponent(prompt.title)}&description=${encodeURIComponent(prompt.description)}`)
  }

  if (currentPrompts.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <span>Story Prompts</span>
        </CardTitle>
        <CardDescription>
          Get inspired to share more memories with your family
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {currentPrompts.map(prompt => {
            const Icon = prompt.icon
            return (
              <Card
                key={prompt.id}
                className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border-l-4 border-l-primary/20"
                onClick={() => handlePromptClick(prompt)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium text-sm leading-tight">
                          {prompt.title}
                        </h4>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ml-2 ${getCategoryColor(prompt.category)}`}
                        >
                          {prompt.category}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {prompt.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/prompts')}
            className="w-full"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Browse All Prompts
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}