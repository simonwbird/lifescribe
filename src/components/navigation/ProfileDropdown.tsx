import { useState, useEffect } from 'react'
import { ChevronDown, User, Users, Settings, CreditCard, LogOut, Beaker } from 'lucide-react'
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

// Default family space will be stored in profile.default_space_id

export default function ProfileDropdown() {
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [familyName, setFamilyName] = useState<string>('My Family')
  const [enableMultiSpaces, setEnableMultiSpaces] = useState(false)
  const navigate = useNavigate()
  const { track } = useAnalytics()

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Get profile data with feature flags
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*, default_space_id, settings')
          .eq('id', user.id)
          .single()
        setProfile(profileData)
        
        // Check multi-space feature flag from Labs settings
        const settings = (profileData?.settings as any) || {}
        const labsFlags = settings.labs_flags || {}
        setEnableMultiSpaces(settings.labs_enabled && labsFlags.multiSpaces)
        
        // Get default family name
        if (profileData?.default_space_id) {
          const { data: familyData } = await supabase
            .from('families')
            .select('name')
            .eq('id', profileData.default_space_id)
            .single()
          if (familyData) {
            setFamilyName(familyData.name)
          }
        }
        
        // Get user's family ID from members table
        const { data: memberData } = await supabase
          .from('members')
          .select('family_id')
          .eq('profile_id', user.id)
          .limit(1)
          .single()
        
        // Resolve avatar URL
        if (profileData?.avatar_url) {
          let resolved: string | null = null

          // If it's an absolute URL (external), use it directly
          if (/^https?:\/\//i.test(profileData.avatar_url)) {
            resolved = profileData.avatar_url
          } else {
            // Prefer the edge function (family-aware)
            try {
              if (memberData?.family_id) {
                const signedEdgeUrl = await getSignedMediaUrl(profileData.avatar_url, memberData.family_id)
                if (signedEdgeUrl) {
                  resolved = signedEdgeUrl
                }
              }
            } catch (error) {
              console.error('Error getting signed avatar URL via edge:', error)
            }

            // Fallback: client-side signed URL from Storage
            if (!resolved) {
              try {
                const { data: signed, error: signErr } = await supabase.storage
                  .from('media')
                  .createSignedUrl(profileData.avatar_url, 60 * 60) // 1 hour
                if (signErr) throw signErr
                resolved = signed?.signedUrl || null
              } catch (fallbackErr) {
                console.error('Fallback signed URL failed:', fallbackErr)
              }
            }
          }

          // Final fallback: auth user metadata picture (e.g., Google avatar)
          if (!resolved && user?.user_metadata?.avatar_url) {
            resolved = user.user_metadata.avatar_url
          }

          setAvatarUrl(resolved)
        } else if (user?.user_metadata?.avatar_url) {
          // No profile avatar set, use auth provider avatar
          setAvatarUrl(user.user_metadata.avatar_url)
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
              key={avatarUrl || 'fallback'}
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
            Your Family
          </div>
          <DropdownMenuItem className="p-0">
            <div className="flex items-center gap-3 px-3 py-2 w-full text-left">
              <Users className="h-4 w-4" />
              <span className="flex-1">{familyName}</span>
              <div className="w-2 h-2 bg-brand-green rounded-full" />
            </div>
          </DropdownMenuItem>
          {enableMultiSpaces && (
            <DropdownMenuItem className="p-0">
              <Link
                to="/labs/spaces"
                className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-accent hover:text-accent-foreground text-xs text-muted-foreground"
                onClick={() => handleMenuItemClick('labs_spaces')}
              >
                <Beaker className="h-3 w-3" />
                Manage spaces (Labs)
              </Link>
            </DropdownMenuItem>
          )}
        </div>

        <DropdownMenuItem className="p-0">
          <Link
            to="/labs"
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-accent hover:text-accent-foreground"
            onClick={() => handleMenuItemClick('labs')}
          >
            <Beaker className="h-4 w-4" />
            Labs (experimental)
          </Link>
        </DropdownMenuItem>

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