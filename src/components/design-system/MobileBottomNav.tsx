import { Home, Search, Plus, FileText, Users } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAnalytics } from '@/hooks/useAnalytics'

const navItems = [
  { 
    icon: Home, 
    label: 'Home', 
    href: '/home',
    description: 'Your personal dashboard'
  },
  { 
    icon: FileText, 
    label: 'Stories', 
    href: '/prompts',
    description: 'Create and browse stories'
  },
  { 
    icon: Users, 
    label: 'Family', 
    href: '/people',
    description: 'Family members and tree'
  },
  { 
    icon: Search, 
    label: 'Search', 
    href: '/search',
    description: 'Find stories and people'
  }
]

export function MobileBottomNav() {
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
    if (href === '/prompts') {
      return location.pathname.startsWith('/prompts') || 
             location.pathname.startsWith('/stories') ||
             location.pathname.startsWith('/capture')
    }
    if (href === '/people') {
      return location.pathname.startsWith('/people') || 
             location.pathname.startsWith('/family') ||
             location.pathname.startsWith('/events') ||
             location.pathname.startsWith('/media')
    }
    if (href === '/search') {
      return location.pathname.startsWith('/search')
    }
    return location.pathname.startsWith(href)
  }

  return (
    <nav 
      className="mobile-bottom-nav fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border sm:hidden z-50" 
      role="navigation" 
      aria-label="Mobile navigation"
      style={{
        paddingBottom: `max(env(safe-area-inset-bottom), 0.5rem)`
      }}
    >
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item, index) => {
          // Insert Create button after Stories (index 1)
          const elements = []
          
          elements.push(
            <Link
              key={item.href}
              to={item.href}
              className={`nav-item flex flex-col items-center gap-1 p-3 rounded-lg min-w-[60px] min-h-[44px] transition-colors ${
                isActive(item.href)
                  ? 'text-primary bg-accent' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
              onClick={() => handleNavClick(item)}
              aria-current={isActive(item.href) ? 'page' : undefined}
              aria-label={item.description}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )

          // Add Create button after Stories
          if (index === 1) {
            elements.push(
              <Link 
                key="create"
                to="/stories/new" 
                onClick={handleCreateClick}
                aria-label="Create new content"
                className="create-button"
              >
                <Button
                  size="icon"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-12 h-12 rounded-full shadow-lg transition-transform hover:scale-105"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </Link>
            )
          }

          return elements
        })}
      </div>
    </nav>
  )
}