import {
  User,
  Users,
  Image,
  Package,
  UtensilsCrossed,
  Home as HomeIcon,
  Dog,
  GitBranch,
  Lock
} from 'lucide-react'
import { LifeScribeLogo } from '@/components/branding/LifeScribeLogo'
import { NavLink, useLocation } from 'react-router-dom'
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

const navItems = [
  { 
    title: 'My Timeline', 
    url: '/me/timeline', 
    icon: User,
    section: 'personal'
  },
  { 
    title: 'People', 
    url: '/people', 
    icon: Users,
    section: 'family'
  },
  { 
    title: 'Albums', 
    url: '/albums', 
    icon: Image,
    section: 'family'
  },
  { 
    title: 'Objects', 
    url: '/objects', 
    icon: Package,
    section: 'family'
  },
  { 
    title: 'Recipes', 
    url: '/recipes', 
    icon: UtensilsCrossed,
    section: 'family'
  },
  { 
    title: 'Properties', 
    url: '/properties', 
    icon: HomeIcon,
    section: 'family'
  },
  { 
    title: 'Pets', 
    url: '/pets', 
    icon: Dog,
    section: 'family'
  },
  { 
    title: 'Family Tree', 
    url: '/tree', 
    icon: GitBranch,
    section: 'family'
  },
  { 
    title: 'Vault', 
    url: '/vault', 
    icon: Lock,
    section: 'vault'
  },
]

export function LeftNav() {
  const { open } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname

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
        open ? 'w-60' : 'w-14'
      )}
      collapsible="icon"
      aria-label="Main navigation"
    >
      <SidebarContent>
        {/* Logo Section */}
        <div className="p-4 border-b">
          {open ? (
            <LifeScribeLogo variant="wordmark" className="text-foreground" />
          ) : (
            <LifeScribeLogo variant="icon" className="text-foreground w-8 h-8 mx-auto" />
          )}
        </div>
        
        {/* Personal Section */}
        <SidebarGroup>
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
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Family Section */}
        <SidebarGroup>
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
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Vault Section */}
        <SidebarGroup>
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
