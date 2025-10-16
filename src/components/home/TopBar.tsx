import { useState, useEffect } from 'react'
import { Bell, Plus, User, UserCircle, Settings as SettingsIcon, Users, LogOut, CreditCard, FlaskConical, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAnalytics } from '@/hooks/useAnalytics'
import { routes } from '@/lib/routes'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { getSignedMediaUrl } from '@/lib/media'
import { useNavigate } from 'react-router-dom'

interface TopBarProps {
  familyId: string
  userId: string
}

export function TopBar({ familyId, userId }: TopBarProps) {
  const navigate = useNavigate()
  const { track } = useAnalytics(userId)
  const [profile, setProfile] = useState<any>(null)
  const [families, setFamilies] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [userEmail, setUserEmail] = useState<string>('')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    loadProfile()
    loadFamilies()
    loadNotifications()
    loadUserEmail()
    checkSuperAdmin()
    loadPersonAvatar()
  }, [userId, familyId])

  async function loadProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', userId)
      .single()
    if (data) setProfile(data)
  }

  async function loadPersonAvatar() {
    if (!userId || !familyId) {
      console.log('⏳ TopBar: Waiting for userId/familyId', { userId, familyId })
      return
    }

    try {
      console.log('🔍 TopBar: Loading person avatar for user', userId)
      
      // Get the person record linked to this user
      const { data: personLink, error: linkError } = await supabase
        .from('person_user_links')
        .select('person_id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle()

      console.log('👤 TopBar: Person link result', { personLink, linkError })

      if (personLink?.person_id && familyId) {
        // Get person's avatar
        const { data: personData, error: personError } = await supabase
          .from('people')
          .select('avatar_url')
          .eq('id', personLink.person_id)
          .eq('family_id', familyId)
          .single()

        console.log('🖼️ TopBar: Person data result', { personData, personError })

        if (personData?.avatar_url) {
          const avatarUrl = personData.avatar_url
          console.log('✅ TopBar: Found avatar URL', avatarUrl)

          // If it's already a full URL, use it directly
          if (avatarUrl.startsWith('http')) {
            setResolvedAvatarUrl(avatarUrl)
          } else {
            // If it's a storage path, get signed URL
            const signedUrl = await getSignedMediaUrl(avatarUrl, familyId)
            console.log('🔗 TopBar: Resolved signed URL', signedUrl)
            setResolvedAvatarUrl(signedUrl)
          }
        }
      }
    } catch (error) {
      console.error('❌ TopBar: Error loading person avatar:', error)
    }
  }

  async function loadUserEmail() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) setUserEmail(user.email)
  }

  async function checkSuperAdmin() {
    const { data } = await supabase
      .from('profiles')
      .select('settings')
      .eq('id', userId)
      .single()
    
    if (data?.settings && typeof data.settings === 'object' && 'role' in data.settings) {
      setIsSuperAdmin((data.settings as any).role === 'super_admin')
    }
  }

  async function loadFamilies() {
    const { data } = await supabase
      .from('members')
      .select('family_id, families(id, name)')
      .eq('profile_id', userId)
    if (data) {
      setFamilies(data.map(m => m.families).filter(Boolean))
    }
  }

  async function loadNotifications() {
    // Placeholder - would query notifications table
    setUnreadCount(0)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <>
      <header 
        role="banner" 
        className="w-full border-b bg-background"
        aria-label="LifeScribe navigation bar"
      >
        <div className="container max-w-[1400px] flex h-14 items-center px-4 mx-auto">
          {/* Avatar Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-10 w-10 rounded-full"
                aria-label="Switch family or view settings"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={resolvedAvatarUrl || profile?.avatar_url || ''} alt={profile?.full_name} />
                  <AvatarFallback>
                    {profile?.full_name?.charAt(0) || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 bg-popover z-50">
              {/* User Info Header */}
              <div className="px-2 py-3">
                <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
              
              <DropdownMenuSeparator />
              
              {/* My Profile */}
              <DropdownMenuItem onClick={() => navigate('/me')} className="cursor-pointer">
                <UserCircle className="mr-2 h-4 w-4" />
                My profile
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Your Family Section */}
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                YOUR FAMILY
              </DropdownMenuLabel>
              
              {families.map((family: any) => (
                <DropdownMenuItem
                  key={family.id}
                  onClick={() => {
                    window.location.href = `/home-v2?family=${family.id}`
                  }}
                  className="cursor-pointer"
                >
                  <Users className="mr-2 h-4 w-4" />
                  {family.name}
                  {family.id === familyId && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-green-500" />
                  )}
                </DropdownMenuItem>
              ))}
              
              {/* Labs */}
              <DropdownMenuItem onClick={() => navigate('/labs')} className="cursor-pointer">
                <FlaskConical className="mr-2 h-4 w-4" />
                <span>Labs</span>
                <span className="ml-auto text-xs text-muted-foreground">(experimental)</span>
              </DropdownMenuItem>
              
              {/* Super Admin - Only show if user is super admin */}
              {isSuperAdmin && (
                <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer">
                  <Shield className="mr-2 h-4 w-4 text-destructive" />
                  <span className="text-destructive">Super Admin</span>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              {/* Settings */}
              <DropdownMenuItem onClick={() => navigate(routes.settings())} className="cursor-pointer">
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              
              {/* Billing */}
              <DropdownMenuItem onClick={() => navigate('/settings?tab=billing')} className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Sign Out */}
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>


          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative shrink-0"
            onClick={() => navigate(routes.notifications())}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full p-0 text-xs flex items-center justify-center"
                aria-hidden="true"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>

          {/* Quick Add */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="icon" 
                className="ml-1 sm:ml-2 shrink-0"
                aria-label="Quick add menu"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => {
                const route = routes.storyNew()
                track('nav_quick_add_open', { item: 'new_story', route })
                navigate(route)
              }}>
                New Story
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const route = routes.storyNew({ tab: 'photo' })
                track('nav_quick_add_open', { item: 'capture_photo', route })
                navigate(route)
              }}>
                Capture Photo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const route = routes.eventNew()
                track('nav_quick_add_open', { item: 'create_event', route })
                navigate(route)
              }}>
                Create Event
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const route = routes.peopleNew()
                track('nav_quick_add_open', { item: 'add_person', route })
                navigate(route)
              }}>
                Add Person
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  )
}
