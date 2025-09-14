import { useState, useEffect } from 'react'
import { ChevronDown, User, Users, Settings, CreditCard, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAnalytics } from '@/hooks/useAnalytics'
import { getSignedMediaUrl } from '@/lib/media'
import type { Profile } from '@/lib/types'

// Mock family spaces data - would come from API
const mockFamilySpaces = [
  { id: '1', name: 'The Johnson Family', isActive: true },
  { id: '2', name: 'Extended Family', isActive: false },
]

export default function ProfileDropdown() {
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const navigate = useNavigate()
  const { track } = useAnalytics()

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Get profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profileData)
        
        // Get user's family ID from members table
        const { data: memberData } = await supabase
          .from('members')
          .select('family_id')
          .eq('profile_id', user.id)
          .limit(1)
          .single()
        
        // Resolve avatar URL
        if (profileData?.avatar_url) {
          // If it's an absolute URL (external), use it directly
          if (/^https?:\/\//i.test(profileData.avatar_url)) {
            setAvatarUrl(profileData.avatar_url)
          } else if (memberData?.family_id) {
            // Otherwise, request a signed URL via the media proxy
            try {
              const signedUrl = await getSignedMediaUrl(profileData.avatar_url, memberData.family_id)
              setAvatarUrl(signedUrl)
            } catch (error) {
              console.error('Error getting signed avatar URL:', error)
              setAvatarUrl(null)
            }
          } else {
            // No family context available; fall back to initials
            setAvatarUrl(null)
          }
        }
      }
    }
    getProfile()
  }, [])

  const handleProfileOpen = () => {
    track('profile_open')
    setOpen(true)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const handleSwitchFamily = (familyId: string) => {
    track('switch_family_success', { familyId })
    // Handle family space switching
    console.log('Switching to family:', familyId)
    setOpen(false)
  }

  const handleMenuItemClick = (action: string) => {
    track('profile_open', { action })
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-8 w-8 rounded-full"
          onClick={handleProfileOpen}
          aria-label="Profile menu"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={avatarUrl || ''} 
              alt={profile?.full_name || 'User avatar'} 
              className="object-cover"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              onError={() => setAvatarUrl(null)}
            />
            <AvatarFallback>
              {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-64 p-2 bg-popover border border-border shadow-lg" 
        align="end" 
        forceMount
      >
        <div className="px-3 py-2 mb-2">
          <p className="font-medium text-sm">{profile?.full_name || 'User'}</p>
          <p className="text-xs text-muted-foreground">{profile?.email}</p>
        </div>
        
        <DropdownMenuItem className="p-0">
          <Link
            to="/profile"
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-accent hover:text-accent-foreground"
            onClick={() => handleMenuItemClick('my_profile')}
          >
            <User className="h-4 w-4" />
            My profile
          </Link>
        </DropdownMenuItem>

        <div className="my-2">
          <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Family Spaces
          </div>
          {mockFamilySpaces.map((space) => (
            <DropdownMenuItem key={space.id} className="p-0">
              <button
                className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-accent hover:text-accent-foreground text-left"
                onClick={() => handleSwitchFamily(space.id)}
              >
                <Users className="h-4 w-4" />
                <span className="flex-1">{space.name}</span>
                {space.isActive && (
                  <div className="w-2 h-2 bg-brand-green rounded-full" />
                )}
              </button>
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="p-0">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-accent hover:text-accent-foreground"
            onClick={() => handleMenuItemClick('settings')}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem className="p-0">
          <Link
            to="/billing"  
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-accent hover:text-accent-foreground"
            onClick={() => handleMenuItemClick('billing')}
          >
            <CreditCard className="h-4 w-4" />
            Billing
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="p-0">
          <button
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-accent hover:text-accent-foreground text-left"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}