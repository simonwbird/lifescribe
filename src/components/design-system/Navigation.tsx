import { memo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  BookOpen, 
  Mic, 
  PenTool, 
  Users, 
  TreePine,
  User,
  Search,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavigationProps {
  className?: string
  onSearch?: (query: string) => void
  isMobile?: boolean
}

export const Navigation = memo(function Navigation({ 
  className, 
  onSearch, 
  isMobile = false 
}: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)

  const storiesItems = [
    { label: 'Prompts', href: '/prompts', icon: BookOpen },
    { label: 'Quick Voice', href: '/voice', icon: Mic },
    { label: 'Create Story', href: '/create', icon: PenTool },
  ]

  const familyItems = [
    { label: 'People', href: '/people', icon: Users },
    { label: 'Family Tree', href: '/family-tree', icon: TreePine },
    { label: 'My Life Page', href: '/my-life-page', icon: User },
  ]

  const NavSection = ({ title, items }: { title: string, items: typeof storiesItems }) => (
    <div className="space-y-1">
      <h3 className="text-body-sm font-medium text-muted-foreground px-3 py-2">
        {title}
      </h3>
      <nav className="space-y-1" aria-label={`${title} navigation`}>
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-body-sm transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive 
                  ? 'bg-accent text-accent-foreground font-medium' 
                  : 'text-foreground'
              )
            }
            onClick={() => isMobile && setIsOpen(false)}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )

  if (isMobile) {
    return (
      <>
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>

        {/* Mobile overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-3 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Mobile navigation */}
        <nav
          className={cn(
            'fixed top-0 left-0 h-full w-64 bg-background border-r shadow-lg z-4 transform transition-transform md:hidden',
            isOpen ? 'translate-x-0' : '-translate-x-full',
            className
          )}
          aria-label="Main navigation"
        >
          <div className="p-4 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9"
                onChange={(e) => onSearch?.(e.target.value)}
              />
            </div>

            {/* Navigation sections */}
            <NavSection title="Stories" items={storiesItems} />
            <NavSection title="Family" items={familyItems} />
          </div>
        </nav>
      </>
    )
  }

  // Desktop navigation
  return (
    <nav
      className={cn(
        'hidden md:flex items-center gap-8',
        className
      )}
      aria-label="Main navigation"
    >
      {/* Stories Hub */}
      <div className="flex items-center gap-4">
        <span className="text-body font-medium text-foreground">Stories</span>
        <div className="flex items-center gap-1">
          {storiesItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-body-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive 
                    ? 'bg-accent text-accent-foreground font-medium' 
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Family Hub */}
      <div className="flex items-center gap-4">
        <span className="text-body font-medium text-foreground">Family</span>
        <div className="flex items-center gap-1">
          {familyItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-body-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive 
                    ? 'bg-accent text-accent-foreground font-medium' 
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
})