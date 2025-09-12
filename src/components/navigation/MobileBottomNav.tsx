import { Home, Plus, Users, Library, MessageSquare } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAnalytics } from '@/hooks/useAnalytics'

const navItems = [
  { icon: Home, label: 'Home', href: '/home' },
  { icon: Users, label: 'Family', href: '/family/members' },
  { icon: Library, label: 'Collections', href: '/collections' },
  { icon: MessageSquare, label: 'Prompts', href: '/prompts' }
]

export default function MobileBottomNav() {
  const location = useLocation()
  const { track } = useAnalytics()

  const handleNavClick = (item: typeof navItems[0]) => {
    track('mobile_nav_clicked', { destination: item.label.toLowerCase() })
  }

  const handleCreateClick = () => {
    track('mobile_create_clicked')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border sm:hidden z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.slice(0, 2).map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg min-w-[60px] ${
              location.pathname === item.href || 
              (item.href === '/home' && location.pathname === '/') ||
              (item.href === '/family/members' && location.pathname.startsWith('/family'))
                ? 'text-primary bg-accent' 
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
            onClick={() => handleNavClick(item)}
            aria-current={location.pathname === item.href ? 'page' : undefined}
          >
            <item.icon className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}

        {/* Center Create Button */}
        <Link to="/stories/new" onClick={handleCreateClick}>
          <Button
            size="icon"
            className="bg-brand-green hover:bg-brand-green/90 text-brand-green-foreground w-12 h-12 rounded-full shadow-lg"
            aria-label="Create new content"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </Link>

        {navItems.slice(2).map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg min-w-[60px] ${
              location.pathname === item.href
                ? 'text-primary bg-accent' 
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
            onClick={() => handleNavClick(item)}
            aria-current={location.pathname === item.href ? 'page' : undefined}
          >
            <item.icon className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}