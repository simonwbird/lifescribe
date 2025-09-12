import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, Search } from 'lucide-react'
import type { Profile } from '@/lib/types'
import CreateDropdown from '@/components/navigation/CreateDropdown'
import FamilyDropdown from '@/components/navigation/FamilyDropdown'
import GlobalSearch from '@/components/navigation/GlobalSearch'
import NotificationsBell from '@/components/navigation/NotificationsBell'
import MobileBottomNav from '@/components/navigation/MobileBottomNav'

export default function Header() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
    }
    getProfile()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const isActivePath = (path: string) => {
    if (path === '/home') {
      return location.pathname === '/home' || location.pathname === '/'
    }
    if (path === '/family') {
      return location.pathname.startsWith('/family')
    }
    return location.pathname === path
  }

  const navItems = [
    { label: 'Feed', href: '/home' },
    { label: 'Collections', href: '/collections' },
    { label: 'Prompts', href: '/prompts' }
  ]

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left side - Logo and Nav */}
          <div className="flex items-center gap-6">
            <Link 
              to="/home" 
              className="text-xl font-serif text-foreground hover:text-primary transition-colors"
            >
              LifeScribe
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  asChild
                  variant="ghost"
                  className={`hover:bg-accent hover:text-accent-foreground ${
                    isActivePath(item.href) 
                      ? 'bg-accent text-accent-foreground font-medium' 
                      : 'text-muted-foreground'
                  }`}
                >
                  <Link 
                    to={item.href}
                    aria-current={isActivePath(item.href) ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </Button>
              ))}
              
              <CreateDropdown />
              <FamilyDropdown />
            </nav>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Right side - Search, Notifications, Avatar */}
          <div className="flex items-center gap-2">
            {/* Desktop Search */}
            <div className="hidden md:block">
              <GlobalSearch variant="inline" />
            </div>
            
            {/* Mobile Search Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>

            <NotificationsBell />

            {/* Avatar Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={profile?.avatar_url || ''} 
                      alt={profile?.full_name || 'User avatar'} 
                    />
                    <AvatarFallback>
                      {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem asChild>
                  <Link to="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <nav className="container mx-auto px-4 py-3 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${
                    isActivePath(item.href)
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActivePath(item.href) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-2">
                <CreateDropdown />
              </div>
              <div className="space-y-2">
                <Link
                  to="/family/members"
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${
                    isActivePath('/family')
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  People
                </Link>
                <Link
                  to="/family/tree"
                  className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Tree
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </>
  )
}