import { useState, useEffect } from 'react'
import {
  User,
  Users,
  Image,
  Package,
  UtensilsCrossed,
  Home as HomeIcon,
  Dog,
  GitBranch,
  Lock,
  FileText
} from 'lucide-react'
import { LifeScribeLogo } from '@/components/branding/LifeScribeLogo'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAnalytics } from '@/hooks/useAnalytics'
import { routes } from '@/lib/routes'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import { Badge } from '@/components/ui/badge'

interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  section: 'personal' | 'family' | 'vault'
  showBadge?: boolean
}

const navItems: NavItem[] = [
  { 
    title: 'My LifePage', 
    url: '/me', 
    icon: User,
    section: 'personal'
  },
  { 
    title: 'Resume Drafts', 
    url: routes.drafts(), 
    icon: FileText,
    section: 'personal',
    showBadge: true
  },
  { 
    title: 'People', 
    url: routes.peopleIndex(), 
    icon: Users,
    section: 'family'
  },
  { 
    title: 'Albums', 
    url: routes.albumsIndex(), 
    icon: Image,
    section: 'family'
  },
  { 
    title: 'Objects', 
    url: routes.objectsIndex(), 
    icon: Package,
    section: 'family'
  },
  { 
    title: 'Recipes', 
    url: routes.recipesIndex(), 
    icon: UtensilsCrossed,
    section: 'family'
  },
  { 
    title: 'Properties', 
    url: routes.propertiesIndex(), 
    icon: HomeIcon,
    section: 'family'
  },
  { 
    title: 'Pets', 
    url: routes.petsIndex(), 
    icon: Dog,
    section: 'family'
  },
  { 
    title: 'Family Tree', 
    url: '/family/tree', 
    icon: GitBranch,
    section: 'family'
  },
  { 
    title: 'Vault', 
    url: routes.vault(), 
    icon: Lock,
    section: 'vault'
  },
]

export function LeftNav() {
  const { open } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()
  const { track } = useAnalytics()
  const currentPath = location.pathname
  const [draftCount, setDraftCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [familyId, setFamilyId] = useState<string | null>(null)

  // Load user and family info
  useEffect(() => {
    async function loadUserInfo() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        
        // Get user's family
        const { data: memberData } = await supabase
          .from('members')
          .select('family_id')
          .eq('profile_id', user.id)
          .limit(1)
          .single()
        
        if (memberData) {
          setFamilyId(memberData.family_id)
        }
      }
    }
    loadUserInfo()
  }, [])

  // Load draft count
  useEffect(() => {
    if (!userId || !familyId) return

    async function loadDraftCount() {
      const { count } = await supabase
        .from('stories')
        .select('*', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .eq('profile_id', userId)
        .eq('status', 'draft')

      setDraftCount(count || 0)
    }

    loadDraftCount()

    // Real-time updates
    const channel = supabase
      .channel('sidebar-draft-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stories',
        filter: `family_id=eq.${familyId}`,
      }, () => {
        loadDraftCount()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, familyId])

  const isActive = (path: string) => {
    // Exact match or starts with the path (for nested routes)
    return currentPath === path || currentPath.startsWith(`${path}/`)
  }

  const getNavClasses = (active: boolean) =>
    cn(
      'transition-colors',
      active && 'bg-accent text-accent-foreground font-medium'
    )

  // Group items by section
  const personalItems = navItems.filter(item => item.section === 'personal')
  const familyItems = navItems.filter(item => item.section === 'family')
  const vaultItems = navItems.filter(item => item.section === 'vault')

  // Check if any item in a section is active to keep group expanded
  const isPersonalExpanded = personalItems.some(item => isActive(item.url))
  const isFamilyExpanded = familyItems.some(item => isActive(item.url))
  const isVaultExpanded = vaultItems.some(item => isActive(item.url))

  return (
    <Sidebar
      className={cn(
        'border-r transition-all duration-300',
        open ? 'w-52' : 'w-14'
      )}
      collapsible="icon"
      aria-label="Main navigation"
    >
      <SidebarContent>
        {/* Logo Section */}
        <div className="p-4 border-b">
          {open ? (
            <LifeScribeLogo 
              variant="wordmark" 
              className="text-foreground flex items-center gap-2" 
              clickable
              onClick={() => {
                const destination = routes.home()
                track('nav_logo_click', { destination })
                navigate(destination)
              }}
            />
          ) : (
            <LifeScribeLogo 
              variant="icon" 
              className="text-foreground w-8 h-8 mx-auto" 
              clickable
              onClick={() => {
                const destination = routes.home()
                track('nav_logo_click', { destination })
                navigate(destination)
              }}
            />
          )}
        </div>
        
        {/* Personal Section */}
        <SidebarGroup className={cn(open && "pl-3")}>
          {open && <SidebarGroupLabel>Personal</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {personalItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.url)
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={getNavClasses(active)}
                        aria-label={item.title}
                        aria-current={active ? 'page' : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {open && <span>{item.title}</span>}
                        {open && item.showBadge && draftCount > 0 && (
                          <Badge variant="secondary" className="ml-auto h-5 min-w-5 px-1.5 text-xs">
                            {draftCount}
                          </Badge>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Family Section */}
        <SidebarGroup className={cn(open && "pl-3")}>
          {open && <SidebarGroupLabel>Family</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {familyItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.url)
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={getNavClasses(active)}
                        aria-label={item.title}
                        aria-current={active ? 'page' : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {open && <span>{item.title}</span>}
                        {open && item.showBadge && draftCount > 0 && (
                          <Badge variant="secondary" className="ml-auto h-5 min-w-5 px-1.5 text-xs">
                            {draftCount}
                          </Badge>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Vault Section */}
        <SidebarGroup className={cn(open && "pl-3")}>
          {open && <SidebarGroupLabel>SafeBox</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {vaultItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.url)
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={getNavClasses(active)}
                        aria-label={item.title}
                        aria-current={active ? 'page' : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
