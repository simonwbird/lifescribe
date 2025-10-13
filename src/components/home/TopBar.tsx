import { useState, useEffect } from 'react'
import { Bell, Search, Plus, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          {/* Avatar Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
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
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Global Search/Command */}
          <div className="flex-1 px-4">
            <Button
              variant="outline"
              className="w-full max-w-lg justify-start text-sm text-muted-foreground"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="mr-2 h-4 w-4" />
              Search stories, people, events...
            </Button>
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => navigate('/notifications')}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>

          {/* Quick Add */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" className="ml-2">
                <Plus className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate('/new-story')}>
                New Story
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/capture')}>
                Capture Photo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/events?new=true')}>
                Create Event
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/people?new=true')}>
                Add Person
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search Command Palette */}
      <CommandPalette 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)} 
      />
    </>
  )
}
