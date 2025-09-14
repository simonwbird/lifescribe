import { Home, Plus, Search, Library } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAnalytics } from '@/hooks/useAnalytics'

const navItems = [
  { icon: Home, label: 'Home', href: '/home' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Library, label: 'Collections', href: '/collections' }
]

export default function MobileBottomNav() {
  const location = useLocation()
  const { track } = useAnalytics()

  // Don't show on marketing homepage
  if (location.pathname === '/' && !location.search) {
    return null
  }

  const handleNavClick = (item: typeof navItems[0]) => {
    track('mobile_nav_clicked', { destination: item.label.toLowerCase() })
  }

  const handleCreateClick = () => {
    track('mobile_create_clicked')
  }

  const isActive = (href: string) => {
    if (href === '/home') {
      return location.pathname === '/home' || location.pathname === '/'
    }
    if (href === '/search') {
      // Search could be active when searching
      return false // For now, since we don't have a dedicated search page
    }
    return location.pathname === href || location.pathname.startsWith(href)
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border sm:hidden z-50 mobile-safe-bottom" 
      role="navigation" 
      aria-label="Mobile navigation"
      style={{
        paddingBottom: `max(env(safe-area-inset-bottom), 0.5rem)` // Handle iPhone notch
      }}
    >
      <div className="flex items-center justify-around py-2 px-4">
        {/* Home */}
        <Link
          to="/home"
          className={`flex flex-col items-center gap-1 p-3 rounded-lg min-w-[60px] min-h-[44px] tap-target ${
            isActive('/home')
              ? 'text-primary bg-accent' 
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          }`}
          onClick={() => handleNavClick(navItems[0])}
          aria-current={isActive('/home') ? 'page' : undefined}
          aria-label="Go to Home"
        >
          <Home className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs font-medium">Home</span>
        </Link>

        {/* Search */}
        <button
          className="flex flex-col items-center gap-1 p-3 rounded-lg min-w-[60px] min-h-[44px] tap-target text-muted-foreground hover:text-foreground hover:bg-accent/50"
          onClick={() => {
            track('search_open', { source: 'mobile_nav' })
            // Open search modal or focus search input
          }}
          aria-label="Search"
        >
          <Search className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs font-medium">Search</span>
        </button>

        {/* Center Create Button */}
        <Link 
          to="/stories/new" 
          onClick={handleCreateClick}
          aria-label="Create new content"
        >
          <Button
            size="icon"
            className="bg-brand-green hover:bg-brand-green/90 text-brand-green-foreground w-12 h-12 rounded-full shadow-lg"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </Link>

        {/* Collections */}
        <Link
          to="/collections"
          className={`flex flex-col items-center gap-1 p-3 rounded-lg min-w-[60px] ${
            isActive('/collections')
              ? 'text-primary bg-accent' 
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          }`}
          onClick={() => handleNavClick(navItems[2])}
          aria-current={isActive('/collections') ? 'page' : undefined}
          aria-label="Go to Collections"
        >
          <Library className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs font-medium">Collections</span>
        </Link>

        {/* More/Profile - this could expand to show Family & Prompts */}
        <Link
          to="/profile"
          className="flex flex-col items-center gap-1 p-3 rounded-lg min-w-[60px] text-muted-foreground hover:text-foreground hover:bg-accent/50"
          aria-label="Profile and more"
        >
          <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-muted-foreground rounded-full" />
          </div>
          <span className="text-xs font-medium">More</span>
        </Link>
      </div>
    </nav>
  )
}