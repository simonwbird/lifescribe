import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronDown, BookHeart, FileText, Users, GitBranch, Plus, PenTool, Mic, Camera, Archive, Calendar, Search } from 'lucide-react'
import { LSLink } from '@/lib/linking'
import { routes } from '@/lib/routes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import CommandPalette from '@/components/search/CommandPalette'
import NotificationsBell from '@/components/navigation/NotificationsBell'
import ProfileDropdown from '@/components/navigation/ProfileDropdown'
import QuickAddSheet from '@/components/home/QuickAddSheet'
import { InviteFamilySheet } from '@/components/invites/InviteFamilySheet'
import { OfflineSyncBadge } from '@/components/offline/OfflineSyncBadge'
import { useLabs } from '@/hooks/useLabs'
import { useAnalytics } from '@/hooks/useAnalytics'
import { supabase } from '@/integrations/supabase/client'

export function AppHeader() {
  const location = useLocation()
  const { track } = useAnalytics()
  const { labsEnabled, flags } = useLabs()
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [familyId, setFamilyId] = useState<string | null>(null)

  useEffect(() => {
    loadFamilyId()
  }, [])

  const loadFamilyId = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('members')
      .select('family_id')
      .eq('profile_id', user.id)
      .limit(1)
      .single()

    if (data) {
      setFamilyId(data.family_id)
    }
  }

  // Don't render header on marketing homepage
  if (location.pathname === '/' && !location.search) {
    return null
  }

  const getActiveSection = () => {
    if (location.pathname.startsWith('/stories') || 
        location.pathname.startsWith('/prompts') ||
        location.pathname.startsWith('/capture')) {
      return 'stories'
    }
    if (location.pathname.startsWith('/people') || 
        location.pathname.startsWith('/family') ||
        location.pathname.startsWith('/events') ||
        location.pathname.startsWith('/media')) {
      return 'family'
    }
    return null
  }

  const activeSection = getActiveSection()

  return (
    <header className="header-modern sticky top-0 z-40 h-16 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 h-full flex items-center">
        {/* Left: Logo */}
        <LSLink 
          to={routes.home()} 
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          event="nav_logo_click"
          aria-label="Go to home"
        >
          <BookHeart className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline text-lg font-serif font-bold">LifeScribe</span>
        </LSLink>

        {/* Global Search/Command */}
        <div className="flex-1 px-2 sm:px-4">
          <Button
            variant="outline"
            className="w-full max-w-lg justify-start text-sm text-muted-foreground"
            onClick={() => setShowSearch(true)}
            aria-label="Search stories, people, events"
          >
            <Search className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">Search stories, people, events...</span>
          </Button>
        </div>

        {/* Right: Navigation + Actions */}
        <div className="flex items-center gap-1">
          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 mr-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className={`${activeSection === 'stories' ? 'bg-accent text-accent-foreground' : ''} gap-1`}
                >
                  <LSLink to={routes.storyNew()} aria-label="Stories menu">
                    Stories
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </LSLink>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-48 bg-background border shadow-lg z-50"
              >
                <DropdownMenuItem asChild>
                  <LSLink 
                    to={routes.storyNew()} 
                    className="cursor-pointer"
                    event="nav_create_story"
                    aria-label="Create new story"
                  >
                    <PenTool className="h-4 w-4 mr-2" />
                    New Story
                  </LSLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <LSLink 
                    to={routes.meTimeline()} 
                    className="cursor-pointer"
                    event="nav_my_life"
                    aria-label="View my life page"
                  >
                    <BookHeart className="h-4 w-4 mr-2" />
                    My Life Page
                  </LSLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <LSLink 
                    to={routes.tree()} 
                    className="cursor-pointer flex items-center"
                    event="nav_family_tree"
                    aria-label="View family tree"
                  >
                    <GitBranch className="h-4 w-4 mr-2" />
                    Family Tree
                  </LSLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <LSLink 
                    to="/prompts/hub" 
                    className="cursor-pointer"
                    event="nav_prompts_hub"
                    aria-label="Browse prompts"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Prompts
                  </LSLink>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              className={activeSection === 'family' ? 'bg-accent text-accent-foreground' : ''}
              asChild
            >
              <LSLink 
                to={routes.peopleIndex()} 
                event="nav_family"
                aria-label="View family"
              >
                Family
              </LSLink>
            </Button>
          </nav>

          {/* Create Button */}
          <Button 
            size="sm" 
            className="gap-1 text-primary-foreground hover:text-primary-foreground"
            onClick={() => {
              track('nav_quick_add_open')
              setShowQuickAdd(true)
            }}
            aria-label="Quick add menu"
          >
            <Plus className="h-3 w-3" />
            Create
          </Button>

          {/* Invite Button */}
          {familyId && <InviteFamilySheet familyId={familyId} />}

          {/* Offline Sync Badge */}
          <OfflineSyncBadge />

          {/* Notifications */}
          {labsEnabled && flags.notifications && <NotificationsBell />}

          {/* Profile */}
          <ProfileDropdown />
        </div>
      </div>

      <QuickAddSheet open={showQuickAdd} onOpenChange={setShowQuickAdd} />
      <CommandPalette isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </header>
  )
}