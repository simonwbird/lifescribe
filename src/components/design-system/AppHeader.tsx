import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Bell, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppHeaderProps {
  className?: string
  onSearch?: (query: string) => void
  onNotifications?: () => void
  onProfile?: () => void
  showSearch?: boolean
  title?: string
}

export const AppHeader = memo(function AppHeader({
  className,
  onSearch,
  onNotifications,
  onProfile,
  showSearch = true,
  title = "Lifescribe"
}: AppHeaderProps) {
  return (
    <header 
      className={cn(
        "flex items-center justify-between px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "sticky top-0 z-4",
        className
      )}
      role="banner"
    >
      {/* Logo/Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-h3 font-serif font-semibold text-foreground">
          {title}
        </h1>
      </div>

      {/* Search - Global */}
      {showSearch && (
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stories, people, memories..."
              className="pl-9 bg-muted/50 border-0 focus:bg-background"
              onChange={(e) => onSearch?.(e.target.value)}
              aria-label="Global search"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onNotifications}
          aria-label="Notifications"
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {/* Notification badge could go here */}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onProfile}
          aria-label="Profile menu"
        >
          <User className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
})