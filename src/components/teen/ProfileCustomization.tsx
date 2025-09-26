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
  Music
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface ProfileCustomizationProps {
  className?: string
}

// Fun theme colors for teens
const themeColors = [
  { id: 'pink', name: 'Pretty Pink', colors: 'from-pink-400 to-pink-600', bg: 'bg-gradient-to-br from-pink-50 to-pink-100' },
  { id: 'purple', name: 'Purple Power', colors: 'from-purple-400 to-purple-600', bg: 'bg-gradient-to-br from-purple-50 to-purple-100' },
  { id: 'blue', name: 'Cool Blue', colors: 'from-blue-400 to-blue-600', bg: 'bg-gradient-to-br from-blue-50 to-blue-100' },
  { id: 'green', name: 'Nature Green', colors: 'from-green-400 to-green-600', bg: 'bg-gradient-to-br from-green-50 to-green-100' },
  { id: 'rainbow', name: 'Rainbow Magic', colors: 'from-pink-400 via-purple-400 to-blue-400', bg: 'bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50' },
  { id: 'sunset', name: 'Sunset Vibes', colors: 'from-orange-400 to-pink-600', bg: 'bg-gradient-to-br from-orange-50 to-pink-100' },
  { id: 'ocean', name: 'Ocean Breeze', colors: 'from-cyan-400 to-blue-600', bg: 'bg-gradient-to-br from-cyan-50 to-blue-100' },
  { id: 'forest', name: 'Forest Fresh', colors: 'from-green-400 to-teal-600', bg: 'bg-gradient-to-br from-green-50 to-teal-100' },
]

// Fun emoji/icon options for profile decoration
const profileIcons = [
  { id: 'heart', icon: Heart, emoji: '💖', name: 'Heart' },
  { id: 'star', icon: Star, emoji: '⭐', name: 'Star' },
  { id: 'crown', icon: Crown, emoji: '👑', name: 'Crown' },
  { id: 'zap', icon: Zap, emoji: '⚡', name: 'Lightning' },
  { id: 'sparkles', icon: Sparkles, emoji: '✨', name: 'Sparkles' },
  { id: 'sun', icon: Sun, emoji: '☀️', name: 'Sunshine' },
  { id: 'moon', icon: Moon, emoji: '🌙', name: 'Moon' },
  { id: 'music', icon: Music, emoji: '🎵', name: 'Music' },
]

export default function ProfileCustomization({ className }: ProfileCustomizationProps) {
  const [profile, setProfile] = useState<any>(null)
  const [nickname, setNickname] = useState('')
  const [selectedTheme, setSelectedTheme] = useState('pink')
  const [selectedIcon, setSelectedIcon] = useState('heart')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
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
        
        // Load customization settings
        const settings = (profileData.settings as any) || {}
        setNickname(settings.nickname || '')
        setSelectedTheme(settings.profile_theme || 'pink')
        setSelectedIcon(settings.profile_icon || 'heart')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast({
        title: "Error loading profile",
        description: "Please try again",
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
      
      toast({
        title: "Profile updated! ✨",
        description: "Your customization has been saved",
      })
    } catch (error) {
      console.error('Error saving customization:', error)
      toast({
        title: "Error saving changes",
        description: "Please try again",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getThemeById = (id: string) => themeColors.find(t => t.id === id) || themeColors[0]
  const getIconById = (id: string) => profileIcons.find(i => i.id === id) || profileIcons[0]

  const currentTheme = getThemeById(selectedTheme)
  const currentIcon = getIconById(selectedIcon)
  const IconComponent = currentIcon.icon

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className={cn("text-white relative", `bg-gradient-to-r ${currentTheme.colors}`)}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-16 w-16 border-4 border-white/20">
              <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
              <AvatarFallback className="bg-white/20 text-white text-xl">
                {profile?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
              <IconComponent className="w-4 h-4 text-current" style={{ color: currentTheme.colors.includes('pink') ? '#ec4899' : '#8b5cf6' }} />
            </div>
          </div>
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              {nickname || profile?.full_name || 'Your Profile'}
              <Sparkles className="w-5 h-5" />
            </CardTitle>
            <p className="text-white/80 text-sm">Customize your profile!</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("p-6 space-y-6", currentTheme.bg)}>
        {/* Nickname Section */}
        <div className="space-y-3">
          <Label htmlFor="nickname" className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4" />
            Nickname (optional)
          </Label>
          <Input
            id="nickname"
            placeholder="Enter a fun nickname..."
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="bg-white/50 border-white/20"
            maxLength={30}
          />
          <p className="text-xs text-gray-600">
            This will be shown alongside your real name
          </p>
        </div>

        {/* Theme Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Choose Your Theme
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {themeColors.map((theme) => (
              <button
                key={theme.id}
                className={cn(
                  "relative p-3 rounded-lg border-2 transition-all hover:scale-105",
                  selectedTheme === theme.id 
                    ? "border-gray-400 ring-2 ring-offset-2 ring-gray-400" 
                    : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => setSelectedTheme(theme.id)}
              >
                <div className={cn("w-full h-8 rounded-md bg-gradient-to-r", theme.colors)} />
                <p className="text-xs font-medium mt-2 text-center">{theme.name}</p>
                {selectedTheme === theme.id && (
                  <div className="absolute -top-1 -right-1">
                    <Badge className="h-5 w-5 p-0 rounded-full bg-green-500">
                      ✓
                    </Badge>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Icon Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Profile Icon
          </Label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {profileIcons.map((iconData) => {
              const IconComp = iconData.icon
              return (
                <button
                  key={iconData.id}
                  className={cn(
                    "relative p-3 rounded-lg border-2 transition-all hover:scale-105 bg-white/50",
                    selectedIcon === iconData.id 
                      ? "border-gray-400 ring-2 ring-offset-2 ring-gray-400" 
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => setSelectedIcon(iconData.id)}
                >
                  <div className="text-center">
                    <IconComp className="w-6 h-6 mx-auto mb-1" />
                    <p className="text-xs">{iconData.name}</p>
                  </div>
                  {selectedIcon === iconData.id && (
                    <div className="absolute -top-1 -right-1">
                      <Badge className="h-4 w-4 p-0 rounded-full bg-green-500 text-xs">
                        ✓
                      </Badge>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Preview</Label>
          <Card className={cn("p-4", currentTheme.bg)}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-white/40">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                  <AvatarFallback className="bg-white/20">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                  <IconComponent className="w-3 h-3" style={{ color: currentTheme.colors.includes('pink') ? '#ec4899' : '#8b5cf6' }} />
                </div>
              </div>
              <div>
                <p className="font-semibold">
                  {nickname ? `${nickname} (${profile?.full_name})` : profile?.full_name}
                </p>
                <p className="text-sm text-gray-600">This is how you'll appear to family!</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Save Button */}
        <Button
          onClick={saveCustomization}
          disabled={isSaving}
          className={cn(
            "w-full bg-gradient-to-r text-white shadow-lg hover:shadow-xl transition-all",
            currentTheme.colors
          )}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  )
}