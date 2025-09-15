import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Search, BookHeart, Home, Users, GitBranch, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAnalytics } from '@/hooks/useAnalytics'
import GlobalSearch from '@/components/search/GlobalSearch'

import { useLabs } from '@/hooks/useLabs'
import { useMode } from '@/contexts/ModeContext'

// MVP Navigation components
import MicButton from '@/components/navigation/MicButton'
import MoreMenu from '@/components/navigation/MoreMenu'
import CreateDropdown from '@/components/navigation/CreateDropdown'
import CapturesStreak from '@/components/navigation/CapturesStreak'
import NotificationsBell from '@/components/navigation/NotificationsBell'
import ProfileDropdown from '@/components/navigation/ProfileDropdown'
import MobileBottomNav from '@/components/navigation/MobileBottomNav'

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { track } = useAnalytics()
  const { labsEnabled, flags } = useLabs()
  const { flags: modeFlags, mode } = useMode()

  // Don't render header on marketing homepage
  if (location.pathname === '/' && !location.search) {
    return null
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if in input field
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return
      }

      // Search focus (/)
      if (event.key === '/') {
        event.preventDefault()
        track('search_slash_shortcut_used')
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
        return
      }

      // Mic shortcut (C)
      if (event.key.toLowerCase() === 'c' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault()
        const micButton = document.querySelector('[data-mic-button]') as HTMLButtonElement
        if (micButton) {
          micButton.click()
        }
        return
      }

      // Navigation shortcuts (G + H/P/T)
      if (event.key.toLowerCase() === 'g') {
        const nextKey = new Promise(resolve => {
          const handler = (e: KeyboardEvent) => {
            resolve(e.key.toLowerCase())
            window.removeEventListener('keydown', handler)
          }
          window.addEventListener('keydown', handler)
          setTimeout(() => {
            window.removeEventListener('keydown', handler)
            resolve(null)
          }, 1000)
        })
        
        nextKey.then(key => {
          if (key === 'h') {
            event.preventDefault()
            track('nav_click_home', { source: 'keyboard' })
            navigate('/home')
          } else if (key === 'p') {
            event.preventDefault()
            track('nav_click_people', { source: 'keyboard' })
            navigate('/family/members')
          } else if (key === 't') {
            event.preventDefault()
            track('nav_click_tree', { source: 'keyboard' })
            navigate('/family/tree')
          }
        })
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, track])

  const isActivePath = (path: string) => {
    if (path === '/home') {
      return location.pathname === '/home' || location.pathname === '/'
    }
    if (path === '/family') {
      return location.pathname.startsWith('/family')
    }
    return location.pathname === path
  }

  const handleLogoClick = () => {
    track('nav_click_home', { source: 'logo' })
  }

  return (
    <>
      <header className="mvp-header sticky top-0 z-40 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Skip to content link */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
        >
          Skip to content
        </a>

        <div className="container mx-auto px-4 h-full flex items-center">
          {/* Left: Logo · Nav (Home, People, Tree) */}
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Link 
              to="/home" 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              onClick={handleLogoClick}
              aria-label="LifeScribe — go to Home"
            >
              <BookHeart className="h-6 w-6 text-primary" />
              <span className="hidden sm:inline text-lg font-serif font-bold">LifeScribe</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center gap-1" role="navigation">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={isActivePath('/home') ? 'bg-accent text-accent-foreground' : ''}
              >
                <Link to="/home" className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  Home
                </Link>
              </Button>
              
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={isActivePath('/people') ? 'bg-accent text-accent-foreground' : ''}
              >
                <Link to="/people" className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  People
                </Link>
              </Button>
              
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={isActivePath('/family/tree') ? 'bg-accent text-accent-foreground' : ''}
              >
                <Link to="/family/tree" className="flex items-center gap-1">
                  <GitBranch className="h-4 w-4" />
                  Tree
                </Link>
              </Button>

              {/* Labs More Menu */}
              <MoreMenu />
            </nav>
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <GlobalSearch />
          </div>

          {/* Right: Mic · Create(+) (Studio only) · Notifications (Labs only) · Streak (Studio only) · Avatar */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Mic Button */}
            <div data-mic-button>
            <MicButton onStoryCreated={(storyId) => {
              // TODO: Navigate to story or show success toast
              console.log('Story created:', storyId)
            }} />
            </div>

            {/* Mobile Search */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Create Button (Studio only) */}
            {modeFlags.showCreateMenu && (
              <div className="hidden sm:block">
                <CreateDropdown />
              </div>
            )}

            {/* Notifications (Labs only) */}
            {labsEnabled && flags.notifications && (
              <div className="hidden md:block">
                <NotificationsBell />
              </div>
            )}

            {/* Streak Chip (Studio only) */}
            {mode === 'studio' && (
              <div className="hidden lg:block">
                <CapturesStreak />
              </div>
            )}

            {/* Profile Avatar */}
            <ProfileDropdown />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Main content landmark */}
      <div id="main-content" className="sr-only" aria-hidden="true" />
    </>
  )
}