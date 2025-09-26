import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Palette, 
  Sparkles, 
  Save, 
  User, 
  Heart,
  Star,
  Crown,
  Zap,
  Rainbow,
  Sun,
  Moon,
  Music,
  Rocket,
  Flame,
  Camera,
  Gamepad2,
  Pizza
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface EnhancedSimpleProfileCustomizationProps {
  className?: string
}

// More fun and colorful themes for younger users
const funThemes = [
  { 
    id: 'unicorn', 
    name: '🦄 Unicorn Magic', 
    colors: 'from-pink-400 via-purple-400 to-blue-400', 
    bg: 'bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50',
    textColor: 'text-pink-600'
  },
  { 
    id: 'fire', 
    name: '🔥 Fire Power', 
    colors: 'from-red-400 via-orange-400 to-yellow-400', 
    bg: 'bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50',
    textColor: 'text-red-600'
  },
  { 
    id: 'ocean', 
    name: '🌊 Ocean Waves', 
    colors: 'from-blue-400 via-cyan-400 to-teal-400', 
    bg: 'bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50',
    textColor: 'text-blue-600'
  },
  { 
    id: 'forest', 
    name: '🌳 Forest Magic', 
    colors: 'from-green-400 via-emerald-400 to-lime-400', 
    bg: 'bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50',
    textColor: 'text-green-600'
  },
  { 
    id: 'cosmic', 
    name: '🌌 Cosmic Space', 
    colors: 'from-purple-400 via-indigo-400 to-blue-400', 
    bg: 'bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50',
    textColor: 'text-purple-600'
  },
  { 
    id: 'sunset', 
    name: '🌅 Sunset Beach', 
    colors: 'from-orange-400 via-pink-400 to-purple-400', 
    bg: 'bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50',
    textColor: 'text-orange-600'
  },
  { 
    id: 'neon', 
    name: '⚡ Neon Lights', 
    colors: 'from-cyan-400 via-pink-400 to-yellow-400', 
    bg: 'bg-gradient-to-br from-cyan-50 via-pink-50 to-yellow-50',
    textColor: 'text-cyan-600'
  },
  { 
    id: 'pastel', 
    name: '🎨 Pastel Dreams', 
    colors: 'from-pink-300 via-purple-300 to-indigo-300', 
    bg: 'bg-gradient-to-br from-pink-25 via-purple-25 to-indigo-25',
    textColor: 'text-pink-500'
  },
]

// Fun emoji/icon options with more variety
const funIcons = [
  { id: 'heart', icon: Heart, emoji: '💖', name: 'Love' },
  { id: 'star', icon: Star, emoji: '⭐', name: 'Star' },
  { id: 'crown', icon: Crown, emoji: '👑', name: 'Royal' },
  { id: 'zap', icon: Zap, emoji: '⚡', name: 'Lightning' },
  { id: 'sparkles', icon: Sparkles, emoji: '✨', name: 'Sparkles' },
  { id: 'sun', icon: Sun, emoji: '☀️', name: 'Sunshine' },
  { id: 'moon', icon: Moon, emoji: '🌙', name: 'Moon' },
  { id: 'music', icon: Music, emoji: '🎵', name: 'Music' },
  { id: 'rocket', icon: Rocket, emoji: '🚀', name: 'Rocket' },
  { id: 'flame', icon: Flame, emoji: '🔥', name: 'Fire' },
  { id: 'camera', icon: Camera, emoji: '📸', name: 'Photo' },
  { id: 'game', icon: Gamepad2, emoji: '🎮', name: 'Gaming' },
  { id: 'pizza', icon: Pizza, emoji: '🍕', name: 'Pizza' },
]

// Fun nickname suggestions for younger users
const funNicknames = [
  'Sparkle Master', 'Cool Cat', 'Star Player', 'Fun Buddy', 'Sunshine Kid',
  'Magic Maker', 'Adventure Time', 'Happy Camper', 'Super Star', 'Dream Chaser',
  'Art Creator', 'Music Lover', 'Book Worm', 'Game Hero', 'Pizza Fan',
  'Movie Buff', 'Dance Queen', 'Tech Wizard', 'Nature Explorer', 'Story Teller',
  'Photo Master', 'Comedy King', 'Sports Ace', 'Fashion Icon', 'Science Geek'
]

export default function EnhancedSimpleProfileCustomization({ className }: EnhancedSimpleProfileCustomizationProps) {
  const [profile, setProfile] = useState<any>(null)
  const [nickname, setNickname] = useState('')
  const [selectedTheme, setSelectedTheme] = useState('unicorn')
  const [selectedIcon, setSelectedIcon] = useState('heart')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [bouncing, setBouncing] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        
        const settings = (profileData.settings as any) || {}
        setNickname(settings.nickname || '')
        setSelectedTheme(settings.profile_theme || 'unicorn')
        setSelectedIcon(settings.profile_icon || 'heart')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast({
        title: "Oops! 😅",
        description: "Couldn't load your profile. Let's try again!",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveCustomization = async () => {
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const currentSettings = (profile?.settings as any) || {}
      const updatedSettings = {
        ...currentSettings,
        nickname: nickname.trim(),
        profile_theme: selectedTheme,
        profile_icon: selectedIcon,
        customization_updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .update({ settings: updatedSettings })
        .eq('id', user.id)

      if (error) throw error

      setProfile(prev => ({ ...prev, settings: updatedSettings }))
      
      // Trigger confetti animation
      triggerConfetti()
      
      toast({
        title: "Awesome! 🎉✨",
        description: "Your profile looks amazing now!",
      })
    } catch (error) {
      console.error('Error saving customization:', error)
      toast({
        title: "Oops! 😔",
        description: "Something went wrong. Try again?",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const triggerConfetti = () => {
    // Import and trigger confetti
    import('canvas-confetti').then(confetti => {
      confetti.default({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    })
  }

  const getRandomNickname = () => {
    const randomName = funNicknames[Math.floor(Math.random() * funNicknames.length)]
    setNickname(randomName)
    setBouncing('nickname')
    setTimeout(() => setBouncing(''), 600)
  }

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId)
    setBouncing('theme')
    setTimeout(() => setBouncing(''), 300)
  }

  const handleIconSelect = (iconId: string) => {
    setSelectedIcon(iconId)
    setBouncing('icon')
    setTimeout(() => setBouncing(''), 300)
  }

  const getThemeById = (id: string) => funThemes.find(t => t.id === id) || funThemes[0]
  const getIconById = (id: string) => funIcons.find(i => i.id === id) || funIcons[0]

  const currentTheme = getThemeById(selectedTheme)
  const currentIcon = getIconById(selectedIcon)
  const IconComponent = currentIcon.icon

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("overflow-hidden animate-fade-in", className)}>
      <CardHeader className={cn("text-white relative", `bg-gradient-to-r ${currentTheme.colors}`)}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-16 w-16 border-4 border-white/30 hover-scale">
              <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
              <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                {profile?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className={cn(
              "absolute -bottom-1 -right-1 bg-white rounded-full p-1 transition-all duration-300",
              bouncing === 'icon' && "animate-bounce"
            )}>
              <IconComponent className="w-4 h-4" style={{ color: currentTheme.textColor.replace('text-', '#') }} />
            </div>
          </div>
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              {nickname || profile?.full_name || 'Your Profile'}
              <Sparkles className="w-5 h-5 animate-pulse" />
            </CardTitle>
            <p className="text-white/90 text-sm font-medium">Make it yours! ✨</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("p-6 space-y-6", currentTheme.bg)}>
        {/* Nickname Section */}
        <div className="space-y-3">
          <Label htmlFor="nickname" className="text-sm font-bold flex items-center gap-2">
            <User className="w-4 h-4" />
            Your Fun Nickname 😄
          </Label>
          <div className="flex gap-2">
            <Input
              id="nickname"
              placeholder="Enter a cool nickname..."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className={cn(
                "bg-white/70 border-2 transition-all duration-300 font-medium",
                bouncing === 'nickname' && "animate-bounce"
              )}
              maxLength={30}
            />
            <Button
              onClick={getRandomNickname}
              variant="outline"
              size="sm"
              className="shrink-0 hover-scale bg-white/50 hover:bg-white/70"
            >
              🎲 Surprise!
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This appears next to your name for extra fun! 🌟
          </p>
        </div>

        {/* Theme Selection */}
        <div className="space-y-4">
          <Label className="text-sm font-bold flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Pick Your Vibe 🎨
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {funThemes.map((theme) => (
              <button
                key={theme.id}
                className={cn(
                  "relative p-3 rounded-xl border-2 transition-all duration-300 hover-scale group",
                  selectedTheme === theme.id 
                    ? "border-primary ring-2 ring-offset-2 ring-primary shadow-lg" 
                    : "border-border hover:border-primary/50",
                  bouncing === 'theme' && selectedTheme === theme.id && "animate-bounce"
                )}
                onClick={() => handleThemeSelect(theme.id)}
              >
                <div className={cn("w-full h-12 rounded-lg bg-gradient-to-r shadow-sm", theme.colors)} />
                <p className="text-xs font-bold mt-2 text-center group-hover:scale-105 transition-transform">
                  {theme.name}
                </p>
                {selectedTheme === theme.id && (
                  <div className="absolute -top-1 -right-1 animate-bounce">
                    <Badge className="h-6 w-6 p-0 rounded-full bg-primary shadow-lg">
                      ✨
                    </Badge>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Icon Selection */}
        <div className="space-y-4">
          <Label className="text-sm font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Choose Your Icon 🎯
          </Label>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {funIcons.map((iconData) => {
              const IconComp = iconData.icon
              return (
                <button
                  key={iconData.id}
                  className={cn(
                    "relative p-3 rounded-xl border-2 transition-all duration-300 hover-scale group bg-white/60",
                    selectedIcon === iconData.id 
                      ? "border-primary ring-2 ring-offset-2 ring-primary shadow-lg" 
                      : "border-border hover:border-primary/50",
                    bouncing === 'icon' && selectedIcon === iconData.id && "animate-bounce"
                  )}
                  onClick={() => handleIconSelect(iconData.id)}
                >
                  <div className="text-center">
                    <IconComp className="w-6 h-6 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-medium">{iconData.name}</p>
                  </div>
                  {selectedIcon === iconData.id && (
                    <div className="absolute -top-1 -right-1 animate-pulse">
                      <Badge className="h-4 w-4 p-0 rounded-full bg-primary text-xs">
                        ✨
                      </Badge>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-3">
          <Label className="text-sm font-bold">How You'll Look ✨</Label>
          <Card className={cn("p-4 border-2 border-dashed animate-fade-in", currentTheme.bg)}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-white/60 shadow-lg">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                  <AvatarFallback className="bg-white/30 font-bold">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                  <IconComponent className="w-3 h-3" style={{ color: currentTheme.textColor.replace('text-', '#') }} />
                </div>
              </div>
              <div>
                <p className="font-bold text-sm">
                  {nickname ? `${nickname} (${profile?.full_name})` : profile?.full_name}
                </p>
                <p className="text-xs text-muted-foreground">This is your family profile! 👨‍👩‍👧‍👦</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Save Button with Animation */}
        <Button
          onClick={saveCustomization}
          disabled={isSaving}
          className={cn(
            "w-full text-white shadow-xl hover:shadow-2xl transition-all duration-300 font-bold text-lg h-12",
            `bg-gradient-to-r ${currentTheme.colors}`,
            "hover-scale",
            isSaving && "animate-pulse"
          )}
        >
          <Save className="w-5 h-5 mr-2" />
          {isSaving ? '✨ Saving Magic...' : '🎉 Save My Style!'}
        </Button>
      </CardContent>
    </Card>
  )
}