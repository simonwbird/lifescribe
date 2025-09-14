import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Menu, BookHeart, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAnalytics } from '@/hooks/useAnalytics'
import GlobalSearch from '@/components/search/GlobalSearch'
import QuickCaptureComposer from '@/components/capture/QuickCaptureComposer'

// Navigation components
import CreateDropdown from '@/components/navigation/CreateDropdown'
import CollectionsDropdown from '@/components/navigation/CollectionsDropdown'
import FamilyDropdown from '@/components/navigation/FamilyDropdown'
import CapturesStreak from '@/components/navigation/CapturesStreak'
import NotificationsBell from '@/components/navigation/NotificationsBell'
import HelpDropdown from '@/components/navigation/HelpDropdown'
import ProfileDropdown from '@/components/navigation/ProfileDropdown'
import CommandPalette from '@/components/navigation/CommandPalette'
import KeyboardShortcutsDialog from '@/components/navigation/KeyboardShortcutsDialog'
import MobileBottomNav from '@/components/navigation/MobileBottomNav'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { track } = useAnalytics()

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

      // Command palette
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setCommandPaletteOpen(true)
        return
      }

      // Search focus
      if (event.key === '/') {
        event.preventDefault()
        track('search_slash_shortcut_used')
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
        return
      }

      // Help shortcuts
      if (event.key === '?') {
        event.preventDefault()
        track('keyboard_shortcut_help')
        setShortcutsOpen(true)
        return
      }

      // Create menu
      if (event.key.toLowerCase() === 'c' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault()
        // Simulate click on create dropdown
        const createButton = document.querySelector('[data-create-button]') as HTMLButtonElement
        if (createButton) {
          createButton.click()
        }
        return
      }

      // Go to home
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
          }
        })
        return
      }

      // Direct creation shortcuts (only if not in command palette or other modals)
      if (!commandPaletteOpen && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const key = event.key.toLowerCase()
        const shortcuts: Record<string, string> = {
          's': '/stories/new',
          'p': '/photos/new', 
          'v': '/audio/new',
          'r': '/recipes/new',
          'o': '/objects/new',
          'y': '/properties/new',
          't': '/pets/new',
          'q': '/prompts/browse'
        }

        if (shortcuts[key]) {
          event.preventDefault()
          track(`create_select_${key === 'p' ? 'photo' : key === 'v' ? 'voice' : key === 'y' ? 'property' : key === 't' ? 'pet' : key === 'q' ? 'prompt' : key === 's' ? 'story' : key === 'r' ? 'recipe' : 'object'}`, { source: 'keyboard' })
          navigate(shortcuts[key])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, track, commandPaletteOpen])

  const isActivePath = (path: string) => {
    if (path === '/home') {
      return location.pathname === '/home' || location.pathname === '/'
    }
    if (path === '/family') {
      return location.pathname.startsWith('/family')
    }
    return location.pathname === path
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      track('search_performed', { query: searchQuery })
      // Implement search functionality
      console.log('Searching for:', searchQuery)
    }
  }

  const handleLogoClick = () => {
    track('nav_click_home', { source: 'logo' })
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Skip to content link */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
        >
          Skip to content
        </a>

        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left side - Logo and Nav */}
          <div className="flex items-center gap-6">
            {/* Logo and Quick Capture */}
            <div className="flex flex-col gap-2">
              <Link 
                to="/home" 
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                onClick={handleLogoClick}
                aria-label="LifeScribe — go to Home"
              >
                <BookHeart className="h-8 w-8 text-brand-primary" />
                <span className="text-2xl font-serif font-bold text-foreground">LifeScribe</span>
              </Link>
              
              {/* Quick Capture Button */}
              <Button 
                variant="outline" 
                size="sm"
                className="bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground shadow-sm"
                onClick={() => setQuickCaptureOpen(true)}
              >
                <Zap className="mr-2 h-3 w-3" />
                Quick Capture
              </Button>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1" role="navigation">
              <Button
                asChild
                variant="ghost"
                className={`hover:bg-accent hover:text-accent-foreground ${
                  isActivePath('/home') 
                    ? 'bg-accent text-accent-foreground font-medium' 
                    : 'text-muted-foreground'
                }`}
              >
                <Link 
                  to="/home"
                  aria-current={isActivePath('/home') ? 'page' : undefined}
                >
                  Home
                </Link>
              </Button>

              <div data-create-button>
                <CreateDropdown />
              </div>
              <CollectionsDropdown />
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

          {/* Center - Search */}
          <div className="hidden md:block max-w-md mx-4 flex-1">
            <GlobalSearch />
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile Search Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Search"
              onClick={() => {
                track('search_open', { source: 'mobile' })
                // Open mobile search modal
              }}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <CapturesStreak />
              <NotificationsBell />
              <HelpDropdown onShortcutsOpen={() => setShortcutsOpen(true)} />
            </div>

            <ProfileDropdown />
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <nav className="container mx-auto px-4 py-3 space-y-2">
              <Link
                to="/home"
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  isActivePath('/home')
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={isActivePath('/home') ? 'page' : undefined}
              >
                Home
              </Link>
              
              <div className="pt-2">
                <CreateDropdown />
              </div>
              
              <Link
                to="/collections"
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  isActivePath('/collections')
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Collections
              </Link>

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

              <Link
                to="/prompts"
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  isActivePath('/prompts')
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Prompts
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Command Palette */}
      <CommandPalette 
        open={commandPaletteOpen} 
        onOpenChange={setCommandPaletteOpen} 
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />

      {/* Quick Capture Modal */}
      <QuickCaptureComposer
        isOpen={quickCaptureOpen}
        onClose={() => setQuickCaptureOpen(false)}
      />

      {/* Main content landmark */}
      <div id="main-content" className="sr-only" aria-hidden="true" />
    </>
  )
}