import { useState, useEffect } from 'react'
import { Bell, Search, Plus, User } from 'lucide-react'
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
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { useNavigate } from 'react-router-dom'
import CommandPalette from '@/components/search/CommandPalette'

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
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    loadProfile()
    loadFamilies()
    loadNotifications()
  }, [userId, familyId])

  async function loadProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', userId)
      .single()
    if (data) setProfile(data)
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

  return (
    <>
      <header 
        role="banner" 
        className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        aria-label="LifeScribe navigation bar"
      >
        <div className="container flex h-14 items-center px-4">
          {/* Avatar Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-10 w-10 rounded-full"
                aria-label="Switch family or view settings"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                  <AvatarFallback>
                    {profile?.full_name?.charAt(0) || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Switch Family</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {families.map((family: any) => (
                <DropdownMenuItem
                  key={family.id}
                  onClick={() => {
                    // Switch family context
                    window.location.href = `/home?family=${family.id}`
                  }}
                  className={family.id === familyId ? 'bg-muted' : ''}
                >
                  {family.name}
                  {family.id === familyId && (
                    <Badge variant="secondary" className="ml-auto">
                      Active
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(routes.settings())}>
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Global Search/Command */}
          <div className="flex-1 px-2 sm:px-4">
            <Button
              variant="outline"
              className="w-full max-w-lg justify-start text-sm text-muted-foreground"
              onClick={() => setSearchOpen(true)}
              aria-label="Search stories, people, events"
            >
              <Search className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">Search stories, people, events...</span>
            </Button>
          </div>

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

      {/* Search Command Palette */}
      <CommandPalette 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)} 
      />
    </>
  )
}
