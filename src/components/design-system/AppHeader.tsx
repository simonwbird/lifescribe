import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, BookHeart, FileText, Users, GitBranch, Plus, PenTool, Mic, Camera, Archive, Calendar, Search } from 'lucide-react'
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
        <Link to="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <BookHeart className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline text-lg font-serif font-bold">LifeScribe</span>
        </Link>

        {/* Center: Search */}
        <div className="flex-1 flex justify-center px-4">
          <div className="w-full max-w-md">
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => setShowSearch(true)}
            >
              <Search className="h-4 w-4 mr-2" />
              <span>Search or type a command...</span>
              <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘K</span>
              </kbd>
            </Button>
          </div>
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
                  <Link to="/stories/new">
                    Stories
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Link>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-48 bg-background border shadow-lg z-50"
              >
                <DropdownMenuItem asChild>
                  <Link to="/stories/new" className="cursor-pointer">
                    <PenTool className="h-4 w-4 mr-2" />
                    New Story
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/mylife" className="cursor-pointer">
                    <BookHeart className="h-4 w-4 mr-2" />
                    My Life Page
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/family/tree" className="cursor-pointer flex items-center">
                    <GitBranch className="h-4 w-4 mr-2" />
                    Family Tree
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/prompts/hub" className="cursor-pointer">
                    <FileText className="h-4 w-4 mr-2" />
                    Prompts
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              className={activeSection === 'family' ? 'bg-accent text-accent-foreground' : ''}
            >
              <Link to="/people">Family</Link>
            </Button>
          </nav>

          {/* Create Button */}
          <Button 
            size="sm" 
            className="gap-1 text-primary-foreground hover:text-primary-foreground"
            onClick={() => setShowQuickAdd(true)}
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