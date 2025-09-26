import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAnalytics } from '@/hooks/useAnalytics'

interface SubnavItem {
  label: string
  href: string
  badge?: string | number
}

interface ContextualSubnavProps {
  items: SubnavItem[]
  className?: string
}

export function ContextualSubnav({ items, className = '' }: ContextualSubnavProps) {
  const location = useLocation()
  const { track } = useAnalytics()

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const handleItemClick = (item: SubnavItem) => {
    track('nav_click', { 
      item: item.label.toLowerCase(),
      path: item.href
    })
  }

  return (
    <nav 
      className={`contextual-subnav flex items-center gap-1 px-4 py-2 bg-muted/30 border-b border-border overflow-x-auto ${className}`}
      role="navigation"
      aria-label="Section navigation"
    >
      <div className="flex items-center gap-1 min-w-fit">
        {items.map((item) => (
          <Button
            key={item.href}
            asChild
            variant="ghost"
            size="sm"
            className={`relative whitespace-nowrap ${
              isActive(item.href) 
                ? 'bg-background text-foreground shadow-sm border border-border' 
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            <Link
              to={item.href}
              onClick={() => handleItemClick(item)}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              {item.label}
              {item.badge && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary-foreground bg-primary rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          </Button>
        ))}
      </div>
    </nav>
  )
}

// Predefined subnav configurations for different sections
export const StoriesSubnav = () => {
  const items: SubnavItem[] = [
    { label: 'Today', href: '/prompts' },
    { label: 'Browse', href: '/home' },
    { label: 'Drafts', href: '/stories/drafts' },
    { label: 'My Stories', href: '/stories/mine' }
  ]

  return <ContextualSubnav items={items} />
}

export const FamilySubnav = () => {
  const items: SubnavItem[] = [
    { label: 'People', href: '/people' },
    { label: 'Tree', href: '/family/tree' },
    { label: 'Events', href: '/events' },
    { label: 'Media', href: '/media' }
  ]

  return <ContextualSubnav items={items} />
}