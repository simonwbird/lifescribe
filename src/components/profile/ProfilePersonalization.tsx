import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Palette, Sparkles, Heart, Sun, Moon, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ProfilePersonalizationProps {
  userId: string
  currentNickname?: string
  currentTheme?: string
  onUpdate?: () => void
}

const themes = [
  {
    id: 'default',
    name: 'Classic',
    icon: <Sun className="w-4 h-4" />,
    preview: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    colors: {
      primary: 'hsl(221.2 83.2% 53.3%)',
      accent: 'hsl(210 40% 98%)',
    }
  },
  {
    id: 'sunset',
    name: 'Sunset',
    icon: <Sun className="w-4 h-4" />,
    preview: 'bg-gradient-to-br from-orange-200 via-pink-200 to-purple-300',
    colors: {
      primary: 'hsl(24 74% 59%)',
      accent: 'hsl(330 85% 96%)',
    }
  },
  {
    id: 'ocean',
    name: 'Ocean',
    icon: <Heart className="w-4 h-4" />,
    preview: 'bg-gradient-to-br from-cyan-100 via-blue-200 to-indigo-300',
    colors: {
      primary: 'hsl(191 91% 36%)',
      accent: 'hsl(185 84% 95%)',
    }
  },
  {
    id: 'forest',
    name: 'Forest',
    icon: <Sparkles className="w-4 h-4" />,
    preview: 'bg-gradient-to-br from-green-100 via-emerald-200 to-teal-300',
    colors: {
      primary: 'hsl(142 76% 36%)',
      accent: 'hsl(138 76% 97%)',
    }
  },
  {
    id: 'midnight',
    name: 'Midnight',
    icon: <Moon className="w-4 h-4" />,
    preview: 'bg-gradient-to-br from-slate-700 via-purple-800 to-indigo-900',
    colors: {
      primary: 'hsl(263 70% 50%)',
      accent: 'hsl(262 83% 58%)',
    }
  },
  {
    id: 'candy',
    name: 'Candy',
    icon: <Star className="w-4 h-4" />,
    preview: 'bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200',
    colors: {
      primary: 'hsl(316 73% 52%)',
      accent: 'hsl(316 85% 97%)',
    }
  },
]

const nicknameSuggestions = [
  'Explorer', 'Storyteller', 'Adventurer', 'Dreamer', 'Creator',
  'Sunshine', 'Sparkle', 'Wonder', 'Joy', 'Magic',
  'Champion', 'Star', 'Hero', 'Genius', 'Artist'
]

export default function ProfilePersonalization({ 
  userId, 
  currentNickname = '', 
  currentTheme = 'default',
  onUpdate 
}: ProfilePersonalizationProps) {
  const [nickname, setNickname] = useState(currentNickname)
  const [selectedTheme, setSelectedTheme] = useState(currentTheme)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setNickname(currentNickname)
    setSelectedTheme(currentTheme)
  }, [currentNickname, currentTheme])

  const handleSave = async () => {
    setLoading(true)
    try {
      // Update profile settings
      const { error } = await supabase
        .from('profiles')
        .update({
          settings: {
            nickname: nickname.trim(),
            theme: selectedTheme,
            updated_at: new Date().toISOString()
          }
        })
        .eq('id', userId)

      if (error) throw error

      toast({
        title: "Profile updated!",
        description: "Your personalization has been saved",
      })

      onUpdate?.()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Update failed",
        description: "Please try again",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const suggestRandomNickname = () => {
    const randomNickname = nicknameSuggestions[Math.floor(Math.random() * nicknameSuggestions.length)]
    setNickname(randomNickname)
  }

  const currentThemeData = themes.find(t => t.id === selectedTheme) || themes[0]

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Personalize Your Profile
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs defaultValue="nickname" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="nickname">Nickname</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
          </TabsList>
          
          <TabsContent value="nickname" className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="nickname" className="text-base font-medium">
                  Your Display Name
                </Label>
                <p className="text-sm text-muted-foreground">
                  This is how other family members will see you in stories and comments
                </p>
              </div>
              
              <div className="flex gap-2">
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.slice(0, 20))}
                  placeholder="Enter your nickname..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={suggestRandomNickname}
                  className="shrink-0"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Surprise me
                </Button>
              </div>
              
              {nickname && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    Preview: <Badge variant="secondary">{nickname}</Badge> shared a story
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Quick suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {nicknameSuggestions.slice(0, 8).map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNickname(suggestion)}
                      className="text-xs"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="theme" className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label className="text-base font-medium">
                  Choose Your Theme
                </Label>
                <p className="text-sm text-muted-foreground">
                  Customize the look and feel of your profile
                </p>
              </div>
              
              <RadioGroup
                value={selectedTheme}
                onValueChange={setSelectedTheme}
                className="grid grid-cols-2 gap-4"
              >
                {themes.map((theme) => (
                  <div key={theme.id} className="relative">
                    <RadioGroupItem
                      value={theme.id}
                      id={theme.id}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={theme.id}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all",
                        selectedTheme === theme.id && "border-primary bg-accent"
                      )}
                    >
                      <div className={cn(
                        "w-16 h-16 rounded-lg mb-3 border-2",
                        theme.preview
                      )} />
                      <div className="flex items-center gap-2">
                        {theme.icon}
                        <span className="font-medium">{theme.name}</span>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Theme Preview:</p>
                <div className={cn(
                  "p-4 rounded-lg text-center text-white",
                  currentThemeData.preview
                )}>
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 text-gray-800">
                    <Badge variant="secondary" className="mb-2">
                      {nickname || 'Your Name'}
                    </Badge>
                    <p className="text-sm">shared a beautiful family memory ✨</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="min-w-24"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}